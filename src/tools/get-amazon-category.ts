import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";

export const schema = {
  categoryId: z.string().describe("The category ID, typically a number but may also be a string in certain cases"),
  domain: z.string().optional().default("US").describe("The domain for fetching product category data, defaults to US"),
  page: z.number().optional().describe("The page number requested for product results"),
  sort: z.string().optional().default("FEATURED").describe("Sort order (FEATURED, MOST_RECENT, PRICE_ASCENDING, PRICE_DESCENDING, AVERAGE_CUSTOMER_REVIEW)"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_category",
  description: "Get detailed information about a specific Amazon category including products and subcategories.",
  annotations: {
    title: "Get Amazon Category Information",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonCategory(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonCategory(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
