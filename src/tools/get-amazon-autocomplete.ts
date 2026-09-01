import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  searchTerm: z.string().describe("The search term for fetching autocomplete results"),
  domain: domainParam("The domain for fetching autocomplete data, defaults to US"),
  category: z.string().optional().describe("The search autocomplete_alias in the amazon url parameter"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_autocomplete",
  description: "Get autocomplete suggestions for Amazon search terms.",
  annotations: {
    title: "Get Amazon Search Autocomplete",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function getAmazonAutocomplete(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonAutocomplete(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
