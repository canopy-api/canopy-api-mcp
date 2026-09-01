import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  domain: domainParam("The domain for fetching best sellers data, defaults to US"),
  page: z.number().optional().describe("The page number requested for product results"),
  limit: z.number().optional().describe("Optionally limit the products results. Typically between 20-50 results will be available per page if no limit is applied."),
  categoryId: z.string().optional().describe("The category ID for best sellers (required if url is not provided). Discover IDs via get_amazon_bestseller_categories."),
  url: z.string().optional().describe("The Amazon URL for a best sellers page (required if categoryId is not provided)."),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_bestsellers",
  description: "Get Amazon best-selling products for a category. Provide either categoryId or url.",
  annotations: {
    title: "Get Amazon Best Sellers",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonBestSellers(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonBestSellers(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
