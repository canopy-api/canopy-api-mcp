import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  domain: domainParam("The domain for fetching deals data, defaults to US"),
  page: z.number().optional().describe("The page number requested for product results"),
  limit: z
    .number()
    .optional()
    .describe(
      "Optionally limit the products results. Typically between 20-40 results will be available per page if no limit is applied.",
    ),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_deals",
  description:
    "Retrieve current deals from Amazon. Returns a paginated list of products currently on deal, including deal-specific information like discount percentages and deal badges.",
  annotations: {
    title: "Get Amazon Deals",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonDeals(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonDeals(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
