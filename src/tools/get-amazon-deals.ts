import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";
import { widgetToolMeta } from "../lib/widget-meta";

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
    destructiveHint: false,
    openWorldHint: true,
  },
  _meta: widgetToolMeta("deals", "Fetching current deals…", "Loaded current deals"),
};

export default async function getAmazonDeals(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonDeals(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

import { priceSchema, pageInfoSchema } from "../lib/output-schemas";

export const outputSchema = {
  data: z.looseObject({
    amazonDeals: z
      .looseObject({
        productResults: z
          .looseObject({
            results: z
              .array(
                z.looseObject({
                  title: z.string().optional(),
                  url: z.string().optional(),
                  asin: z.string().optional(),
                  price: priceSchema.optional(),
                  recommendedRetailPrice: priceSchema.optional(),
                  mainImageUrl: z.string().optional(),
                  dealId: z.string().optional(),
                  dealUrl: z.string().optional(),
                  dealPrice: priceSchema.optional(),
                  dealCurrentPrice: priceSchema.optional(),
                  dealListPrice: priceSchema.optional(),
                  dealPercentOff: z.number().optional(),
                  dealType: z.string().optional(),
                  dealIsLightningDeal: z.boolean().optional(),
                  dealBadge: z.string().optional(),
                  dealStartTime: z.string().optional(),
                  dealEndTime: z.string().optional(),
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
