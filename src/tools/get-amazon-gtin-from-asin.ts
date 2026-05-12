import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";

export const schema = {
  asin: z.string().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
  domain: z.string().optional().default("US").describe("The domain for fetching product data, defaults to US"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_gtin_from_asin",
  description: "Look up the GTIN (ISBN, UPC or EAN code) for an Amazon product by its ASIN.",
  annotations: {
    title: "Get GTIN from ASIN",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonGtinFromAsin(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonGtinFromAsin(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
