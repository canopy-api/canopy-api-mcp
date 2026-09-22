import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  asin: z.string().describe("The asin ID for the author (e.g. B017M7UJX6)"),
  domain: domainParam("The domain for fetching author data, defaults to US"),
  page: z.number().optional().describe("The page number requested for book results"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_author",
  description: "Get detailed information about an Amazon author including their books.",
  annotations: {
    title: "Get Amazon Author Information",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
};

export default async function getAmazonAuthor(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonAuthor(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

import { productResultSchema, pageInfoSchema } from "../lib/output-schemas";

export const outputSchema = {
  data: z.looseObject({
    amazonAuthor: z
      .looseObject({
        name: z.string().optional(),
        url: z.string().optional(),
        imageUrl: z.string().optional(),
        biography: z.string().optional(),
        bookResults: z
          .looseObject({
            results: z
              .array(
                productResultSchema.extend({
                  authors: z
                    .array(z.looseObject({ name: z.string().optional(), url: z.string().optional() }))
                    .optional(),
                }),
              )
              .optional(),
            pageInfo: pageInfoSchema.optional(),
          })
          .optional(),
      })
      .optional(),
  }),
};
