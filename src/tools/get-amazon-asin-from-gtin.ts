import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";

export const schema = {
  gtin: z.string().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
  domain: z.string().optional().default("US").describe("The domain for fetching product data, defaults to US"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_asin_from_gtin",
  description: "Look up the ASIN for an Amazon product by its GTIN (ISBN, UPC or EAN code).",
  annotations: {
    title: "Get ASIN from GTIN",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonAsinFromGtin(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonAsinFromGtin(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
