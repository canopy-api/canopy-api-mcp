import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";

export const schema = {
  searchTerm: z.string().describe("The search term for fetching search results"),
  domain: z.string().optional().default("US").describe("The domain for fetching search results data, defaults to US"),
  categoryId: z.string().optional().describe("An optional category ID used to filter search results"),
  page: z.number().optional().describe("The page number requested for product results"),
  limit: z.number().optional().describe("Optionally limit the products results, typically between 20-40 results"),
  minPrice: z.number().optional().describe("Minimum price filter"),
  maxPrice: z.number().optional().describe("Maximum price filter"),
  conditions: z.string().optional().describe("Product conditions (NEW, USED, RENEWED) - comma separated"),
  sort: z.string().optional().default("FEATURED").describe("Sort order (FEATURED, MOST_RECENT, PRICE_ASCENDING, PRICE_DESCENDING, AVERAGE_CUSTOMER_REVIEW)"),
};

export const metadata: ToolMetadata = {
  name: "search_amazon_products",
  description: "Search for Amazon products with filters and sorting options.",
  annotations: {
    title: "Search Amazon Products",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function searchAmazonProducts(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.searchAmazonProducts(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
