import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";

export const schema = {
  asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
  url: z.string().optional().describe("The Amazon URL for a product"),
  gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
  domain: domainParam("The domain for fetching product data, defaults to US"),
  page: z.number().optional().describe("The page number for offers results"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_product_offers",
  description: "Get the list of seller offers (and Buy Box info) for an Amazon product by ASIN, URL, or GTIN.",
  annotations: {
    title: "Get Amazon Product Offers",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
};

export default async function getAmazonProductOffers(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonProductOffers(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

import { priceSchema, pageInfoSchema } from "../lib/output-schemas";

export const outputSchema = {
  data: z.looseObject({
    amazonProduct: z
      .looseObject({
        offersPaginated: z
          .looseObject({
            offers: z
              .array(
                z.looseObject({
                  id: z.string().optional(),
                  price: priceSchema.nullable().optional(),
                  minimumOrderQuantity: z.number().optional(),
                  maximumOrderQuantity: z.number().optional(),
                  conditionIsNew: z.boolean().optional(),
                  title: z.string().optional(),
                  delivery: z
                    .looseObject({
                      fulfilledByAmazon: z.boolean().optional(),
                      shippedFromOutsideCountry: z.boolean().optional(),
                      countdown: z.string().optional(),
                      comments: z.string().optional(),
                      price: priceSchema.nullable().optional(),
                      upsell: z
                        .looseObject({ name: z.string().optional(), value: z.string().optional() })
                        .nullable()
                        .optional(),
                    })
                    .nullable()
                    .optional(),
                  seller: z
                    .looseObject({
                      name: z.string().optional(),
                      link: z.string().optional(),
                      rating: z.number().optional(),
                      ratingsPercentagePositive: z.number().optional(),
                      ratingsTotal: z.number().optional(),
                      id: z.string().optional(),
                      imageUrl: z.string().optional(),
                    })
                    .nullable()
                    .optional(),
                  isPrime: z.boolean().optional(),
                  buyboxWinner: z.boolean().optional().describe("True for the current Buy Box offer"),
                }),
              )
              .optional(),
            pageInfo: pageInfoSchema.nullable().optional(),
          })
          .nullable()
          .optional(),
      })
      .optional(),
  }),
};
