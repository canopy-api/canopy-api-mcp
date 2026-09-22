import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  sellerId: z.string().describe("The seller ID for a product (e.g. A34JY1ZNKUG942)"),
  domain: domainParam("The domain for fetching seller data, defaults to US"),
  page: z.number().optional().describe("The page number requested for product results"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_seller",
  description: "Get detailed information about an Amazon seller including their products.",
  annotations: {
    title: "Get Amazon Seller Information",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
};

export default async function getAmazonSeller(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonSeller(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

import { productResultSchema, pageInfoSchema } from "../lib/output-schemas";

export const outputSchema = {
  data: z.looseObject({
    amazonSeller: z
      .looseObject({
        sellerId: z.string().optional(),
        name: z.string().optional(),
        logoUrl: z.string().optional(),
        phone: z.string().optional().describe("Seller's public business phone number, when listed"),
        rating: z.number().optional(),
        about: z.string().optional(),
        productResults: z
          .looseObject({
            results: z.array(productResultSchema).optional(),
            pageInfo: pageInfoSchema.optional(),
          })
          .optional(),
      })
      .optional(),
  }),
};
