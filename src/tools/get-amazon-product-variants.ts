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
  name: "get_amazon_product_variants",
  description: "Fetch product variants for an Amazon product by ASIN, URL, or GTIN.",
  annotations: {
    title: "Get Amazon Product Variants",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonProductVariants(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonProductVariants(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
