// Exercise the built MCP server with deterministic REST responses. No API key
// or live Canopy request is needed, and both server and client validation run.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Miniflare, Response } from "miniflare";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/server/validators/ajv";

let worker;
let tools;
let upstreamBody;
let upstreamRequest;
const validator = new AjvJsonSchemaValidator();
const price = { symbol: "$", value: 44.99, currency: "USD", display: "$44.99" };
// Reproduce the reported failures: 18 null coupons, two null prices, and an
// unrated product at index 2 (null rating/ratingsTotal, the ChatGPT rejection).
// Synthetic fixture, not a captured shopping response.
const searchResponse = {
  data: {
    amazonProductSearchResults: {
      productResults: {
        results: Array.from({ length: 20 }, (_, i) => ({
          asin: `TEST${i}`,
          title: `Headphones ${i}`,
          price: i === 7 || i === 13 ? null : price,
          coupon: i === 1 || i === 6 ? { label: "Save 10%" } : null,
          rating: i === 2 ? null : 4.5,
          ratingsTotal: i === 2 ? null : 1234,
        })),
        pageInfo: { currentPage: 1, hasNextPage: true },
      },
    },
  },
};

// Mirrors the api-client's stripNulls: null object properties are dropped,
// array elements are preserved.
function stripNulls(value) {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== null)
        .map(([key, entry]) => [key, stripNulls(entry)]),
    );
  }
  return value;
}

async function rpc(method, params = {}) {
  const response = await worker.dispatchFetch("http://localhost/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-API-KEY": "fixture-key",
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  assert.equal(response.status, 200);
  const text = await response.text();
  const payload = response.headers.get("content-type")?.includes("text/event-stream")
    ? text.split("\n").filter((line) => line.startsWith("data: ")).at(-1)?.slice(6)
    : text;
  const message = JSON.parse(payload);
  assert.equal(message.error, undefined, JSON.stringify(message.error));
  return message.result;
}

before(async () => {
  worker = new Miniflare({
    modules: true,
    scriptPath: "worker.js",
    compatibilityDate: "2025-06-17",
    compatibilityFlags: ["nodejs_compat"],
    cf: false,
    outboundService(request) {
      upstreamRequest = request;
      assert.equal(new URL(request.url).origin, "https://rest.canopyapi.co");
      assert.equal(request.headers.get("API-KEY"), "fixture-key");
      return Response.json(upstreamBody);
    },
  });
  tools = (await rpc("tools/list")).tools;
});

after(async () => { await worker?.dispose(); });

async function checkTool(name, args, body) {
  upstreamBody = body;
  const result = await rpc("tools/call", { name, arguments: args });
  assert.notEqual(result.isError, true, result.content?.[0]?.text);
  const expected = stripNulls(body);
  assert.deepEqual(result.structuredContent, expected, "REST payload must be preserved minus nulls");
  assert.deepEqual(JSON.parse(result.content[0].text), expected, "text fallback must agree");
  const schema = tools.find((tool) => tool.name === name).outputSchema;
  const validated = validator.getValidator(schema)(result.structuredContent);
  assert.equal(validated.valid, true, validated.errorMessage);
}

test("search accepts null coupons and prices through MCP and its advertised schema", async () => {
  const args = {
    searchTerm: "wireless headphones", domain: "US", maxPrice: 99.99,
    conditions: "NEW", limit: 20,
  };
  await checkTool("search_amazon_products", args, searchResponse);
  const url = new URL(upstreamRequest.url);
  assert.equal(url.pathname, "/api/amazon/search");
  for (const [key, value] of Object.entries(args)) {
    assert.equal(url.searchParams.get(key), String(value));
  }
});

test("search still accepts omitted fields and rejects malformed price/coupon values", async () => {
  const body = { data: { amazonProductSearchResults: { productResults: { results: [{}] } } } };
  await checkTool("search_amazon_products", { searchTerm: "headphones" }, body);
  for (const fields of [{ price: "44.99" }, { price: { value: "44.99" } }, { coupon: false }]) {
    upstreamBody = structuredClone(body);
    upstreamBody.data.amazonProductSearchResults.productResults.results = [fields];
    const result = await rpc("tools/call", {
      name: "search_amazon_products", arguments: { searchTerm: "headphones" },
    });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /does not match outputSchema/);
  }
});

const nullableProduct = { title: "Headphones", price: null, coupon: null };
for (const [name, args, data] of [
  ["get_amazon_product", { asin: "TEST" }, { amazonProduct: nullableProduct }],
  ["get_amazon_product_variants", { asin: "TEST" }, { amazonProduct: { variants: [{ price: null }] } }],
  ["get_amazon_author", { asin: "TEST" }, { amazonAuthor: { bookResults: { results: [nullableProduct] } } }],
  ["get_amazon_seller", { sellerId: "TEST" }, { amazonSeller: { productResults: { results: [nullableProduct] } } }],
  ["get_amazon_category", { categoryId: "TEST" }, { amazonProductCategory: { productResults: { results: [nullableProduct] } } }],
  ["get_amazon_bestsellers", { categoryId: "TEST" }, { amazonBestSellers: { productResults: { results: [nullableProduct] } } }],
  ["get_amazon_deals", {}, { amazonDeals: { productResults: { results: [{
    price: null, recommendedRetailPrice: null, dealPrice: null, dealCurrentPrice: null, dealListPrice: null,
  }] } } }],
  ["get_amazon_product_offers", { asin: "TEST" }, { amazonProduct: { offersPaginated: { offers: [{
    price: null, delivery: { price: null },
  }] } } }],
]) {
  test(`${name} accepts unavailable prices`, async () => {
    await checkTool(name, args, { data });
  });
}
