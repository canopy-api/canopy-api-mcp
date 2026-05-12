import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";

export const schema = {
  domain: z.string().optional().default("US").describe("The domain for fetching product category taxonomy, defaults to US"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_categories",
  description: "Get the root level Amazon product category taxonomy.",
  annotations: {
    title: "Get Amazon Product Categories",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonCategories(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonCategories(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
