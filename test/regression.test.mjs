// Regression tests for the built Cloudflare worker (worker.js).
// Guards the contract existing MCP clients rely on:
//  - auth via any of the four supported API key headers, 401 otherwise
//  - stateless Streamable HTTP (no mcp-session-id required)
//  - 2025-era protocol clients keep working after the xmcp 1.x / MCP SDK v2 upgrade
//  - tool roster and input schemas survive the zod -> JSON Schema conversion
// Run with: npm test (builds worker.js first).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { unstable_dev } from "wrangler";

let worker;

before(async () => {
  worker = await unstable_dev("worker-entry.ts", {
    config: "wrangler.jsonc",
    experimental: { disableExperimentalWarning: true },
  });
});

after(async () => {
  await worker.stop();
});

const PROTOCOL = "2025-06-18";

function rpc(body, headers = {}) {
  return worker.fetch("http://localhost/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// SSE or plain JSON — clients see both depending on era/handler.
async function parseRpc(res) {
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    const data = text
      .split("\n")
      .filter((l) => l.startsWith("data: "))
      .map((l) => l.slice(6));
    assert.ok(data.length > 0, `no SSE data lines in: ${text.slice(0, 200)}`);
    return JSON.parse(data[data.length - 1]);
  }
  return JSON.parse(text);
}

const initBody = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: PROTOCOL,
    capabilities: {},
    clientInfo: { name: "regression-test", version: "1.0.0" },
  },
};

test("rejects requests without an API key with 401 and a JSON-RPC error", async () => {
  const res = await rpc(initBody);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, -32001);
  assert.match(body.error.message, /Sign in via OAuth|API key/);
});

for (const headers of [
  { "CANOPY-API-KEY": "test-key" },
  { "API-KEY": "test-key" },
  { "X-API-KEY": "test-key" },
  { Authorization: "Bearer test-key" },
]) {
  const name = Object.keys(headers)[0];
  test(`accepts the API key via the ${name} header`, async () => {
    const res = await rpc(initBody, headers);
    assert.equal(res.status, 200);
    const msg = await parseRpc(res);
    assert.equal(msg.result.protocolVersion, PROTOCOL);
    assert.equal(msg.result.serverInfo.name, "Canopy");
  });
}

test("initialize advertises tools capability", async () => {
  const res = await rpc(initBody, { "X-API-KEY": "test-key" });
  const msg = await parseRpc(res);
  assert.ok(msg.result.capabilities.tools, "tools capability missing");
});

test("tools/list works statelessly (no mcp-session-id, no prior initialize)", async () => {
  const res = await rpc(
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    { "X-API-KEY": "test-key", "mcp-protocol-version": PROTOCOL },
  );
  assert.equal(res.status, 200);
  const msg = await parseRpc(res);
  const names = msg.result.tools.map((t) => t.name).sort();
  // The full public tool roster — a removal or rename here breaks existing users.
  assert.deepEqual(names, [
    "get_amazon_asin_from_gtin",
    "get_amazon_author",
    "get_amazon_autocomplete",
    "get_amazon_bestseller_categories",
    "get_amazon_bestsellers",
    "get_amazon_categories",
    "get_amazon_category",
    "get_amazon_deals",
    "get_amazon_gtin_from_asin",
    "get_amazon_product",
    "get_amazon_product_offers",
    "get_amazon_product_reviews",
    "get_amazon_product_sales",
    "get_amazon_product_stock",
    "get_amazon_product_variants",
    "get_amazon_seller",
    "search_amazon_products",
  ]);
});

test("tool input schemas survive the zod -> JSON Schema conversion", async () => {
  const res = await rpc(
    { jsonrpc: "2.0", id: 3, method: "tools/list" },
    { "X-API-KEY": "test-key", "mcp-protocol-version": PROTOCOL },
  );
  const msg = await parseRpc(res);
  const product = msg.result.tools.find((t) => t.name === "get_amazon_product");
  assert.ok(product, "get_amazon_product missing");
  assert.equal(product.inputSchema.type, "object");
  for (const prop of ["asin", "url", "gtin", "domain"]) {
    assert.ok(product.inputSchema.properties[prop], `property ${prop} missing from inputSchema`);
  }
  assert.equal(product.annotations?.readOnlyHint, true);
});

test("tools/call forwards the request's API key to the Canopy API", async (t) => {
  const res = await rpc(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "get_amazon_product", arguments: { asin: "B01HY0JA3G" } },
    },
    { "X-API-KEY": "definitely-invalid-key", "mcp-protocol-version": PROTOCOL },
  );
  assert.equal(res.status, 200);
  const msg = await parseRpc(res);
  if (msg.result?.content?.[0]?.text?.includes("fetch failed")) {
    t.skip("no network access to the Canopy API");
    return;
  }
  // The invalid key must reach Canopy and come back as a tool-level error,
  // proving per-request key forwarding still works.
  assert.equal(msg.result.isError, true);
  assert.match(msg.result.content[0].text, /not a valid API key/);
});

test("CORS preflight allows the headers MCP clients send", async () => {
  const res = await worker.fetch("http://localhost/mcp", {
    method: "OPTIONS",
    headers: {
      Origin: "https://example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,x-api-key,mcp-protocol-version",
    },
  });
  assert.ok(res.status === 204 || res.status === 200, `unexpected status ${res.status}`);
  const allowed = (res.headers.get("access-control-allow-headers") ?? "").toLowerCase();
  for (const h of [
    "authorization",
    "x-api-key",
    "api-key",
    "canopy-api-key",
    "mcp-protocol-version",
    "mcp-session-id",
    "mcp-method",
    "mcp-name",
  ]) {
    assert.ok(allowed.includes(h), `preflight missing allowed header: ${h}`);
  }
  const methods = (res.headers.get("access-control-allow-methods") ?? "").toUpperCase();
  assert.ok(methods.includes("POST"), "preflight missing POST");
});

test("notifications are accepted without a session", async () => {
  const res = await rpc(
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { "X-API-KEY": "test-key", "mcp-protocol-version": PROTOCOL },
  );
  assert.ok(res.status === 202 || res.status === 200, `unexpected status ${res.status}`);
});

// ---- OAuth (Supabase) support ----

test("serves OAuth protected-resource metadata with CORS", async () => {
  for (const path of [
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/mcp",
  ]) {
    const res = await worker.fetch(`http://localhost${path}`);
    assert.equal(res.status, 200, `unexpected status for ${path}`);
    assert.match(res.headers.get("content-type") ?? "", /application\/json/);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    const body = await res.json();
    assert.deepEqual(body.authorization_servers, [
      "https://tboibfpbpdexvgroofuz.supabase.co/auth/v1",
    ]);
    assert.match(body.resource, /\/mcp$/);
    assert.deepEqual(body.bearer_methods_supported, ["header"]);
  }
});

test("OPTIONS preflight on the well-known route succeeds", async () => {
  const res = await worker.fetch(
    "http://localhost/.well-known/oauth-protected-resource",
    { method: "OPTIONS", headers: { Origin: "https://example.com" } },
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("401 without credentials advertises OAuth discovery via WWW-Authenticate", async () => {
  const res = await rpc(initBody);
  assert.equal(res.status, 401);
  const header = res.headers.get("www-authenticate") ?? "";
  assert.match(
    header,
    /^Bearer resource_metadata="https?:\/\/[^"]+\/\.well-known\/oauth-protected-resource"$/,
  );
  const body = await res.json();
  assert.match(body.error.message, /OAuth/);
  assert.match(body.error.message, /API key/);
});

test("a JWT-shaped bearer token that fails verification is rejected, not treated as an API key", async () => {
  // Self-signed garbage JWT: right shape, wrong issuer/signature.
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const fakeJwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    iss: "https://evil.example.com",
    sub: "someone",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.${Buffer.from("sig").toString("base64url")}`;
  const res = await rpc(initBody, { Authorization: `Bearer ${fakeJwt}` });
  assert.equal(res.status, 401);
  assert.ok(res.headers.get("www-authenticate"), "missing WWW-Authenticate");
  const body = await res.json();
  assert.match(body.error.message, /Invalid or expired OAuth access token/);
});

test("a non-JWT bearer token still takes the API-key path", async () => {
  // A UUID-style key must NOT be rejected as a bad JWT; it reaches setAuth
  // and initialize succeeds (key validity is Canopy's concern, not ours).
  const res = await rpc(initBody, {
    Authorization: "Bearer 123e4567-e89b-12d3-a456-426614174000",
  });
  assert.equal(res.status, 200);
  const msg = await parseRpc(res);
  assert.equal(msg.result.serverInfo.name, "Canopy");
});

