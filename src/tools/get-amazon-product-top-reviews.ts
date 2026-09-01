import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
  url: z.string().optional().describe("The Amazon URL for a product"),
  gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
  domain: domainParam("The domain for fetching product data, defaults to US"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_product_top_reviews",
  description:
    "Fetch the top customer reviews for an Amazon product by ASIN, URL, or GTIN. Each review includes the title, body, star rating, helpful votes, verified-purchase flag, reviewer, and any review images or videos.",
  annotations: {
    title: "Get Amazon Product Top Reviews",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonProductTopReviews(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonProductTopReviews(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
