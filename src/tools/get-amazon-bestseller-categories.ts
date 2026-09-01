import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  domain: domainParam("The domain for fetching best seller categories, defaults to US"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_bestseller_categories",
  description: "Get the list of Amazon best seller categories. Useful for discovering categoryIds to pass to get_amazon_bestsellers.",
  annotations: {
    title: "Get Amazon Best Seller Categories",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonBestSellerCategories(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonBestSellerCategories(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
