import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";
import { widgetToolMeta } from "../lib/widget-meta";

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
    destructiveHint: false,
    openWorldHint: true,
  },
  _meta: widgetToolMeta("bestsellers", "Fetching best sellers…", "Loaded best sellers"),
};

export default async function getAmazonBestSellers(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonBestSellers(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

import { priceSchema, pageInfoSchema } from "../lib/output-schemas";

export const outputSchema = {
  data: z.looseObject({
    amazonBestSellers: z
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
                  mainImageUrl: z.string().optional(),
                  rating: z.number().optional(),
                  ratingsTotal: z.number().optional(),
                  bestSellersRank: z.number().optional().describe("Rank position in the category"),
                }),
              )
              .optional(),
            pageInfo: pageInfoSchema.optional(),
          })
          .optional(),
        categoryInfo: z
          .looseObject({
            currentCategory: z
              .looseObject({ name: z.string().optional(), url: z.string().optional(), id: z.string().optional() })
              .optional(),
            parentCategory: z
              .looseObject({ name: z.string().optional(), url: z.string().optional(), id: z.string().optional() })
              .optional(),
            childCategories: z
              .array(
                z.looseObject({ name: z.string().optional(), url: z.string().optional(), id: z.string().optional() }),
              )
              .optional(),
          })
          .optional(),
      })
      .optional(),
  }),
};
