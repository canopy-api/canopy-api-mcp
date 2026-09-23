import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { createApiClient } from "../api-client";
import { getApiKey } from "../lib/api-key";
import { domainParam } from "../lib/domains";
import { widgetToolMeta } from "../lib/widget-meta";

export const schema = {
  asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
  url: z.string().optional().describe("The Amazon URL for a product"),
  gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
  domain: domainParam("The domain for fetching product data, defaults to US"),
};

export const metadata: ToolMetadata = {
  name: "get_amazon_product",
  description: "Fetch detailed Amazon product information by ASIN, URL, or GTIN.",
  annotations: {
    title: "Get Amazon Product Information",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  _meta: widgetToolMeta("product", "Fetching product details…", "Loaded product details"),
};

export default async function getAmazonProduct(params: InferSchema<typeof schema>, extra: ToolExtraArguments) {
  const client = createApiClient(getApiKey(extra));
  const data = await client.getAmazonProduct(params);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

import { priceSchema, categoryRefSchema, couponSchema } from "../lib/output-schemas";

export const outputSchema = {
  data: z.looseObject({
    amazonProduct: z
      .looseObject({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        brand: z.string().optional(),
        url: z.string().optional(),
        asin: z.string().optional(),
        isPrime: z.boolean().optional(),
        isNew: z.boolean().optional(),
        isInStock: z.boolean().optional(),
        price: priceSchema.optional(),
        mainImageUrl: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        rating: z.number().optional().describe("Average star rating"),
        ratingsTotal: z.number().optional().describe("Total number of ratings"),
        featureBullets: z.array(z.string()).optional(),
        technicalSpecifications: z
          .array(z.looseObject({ name: z.string().optional(), value: z.string().optional() }))
          .optional(),
        categories: z.array(categoryRefSchema).optional(),
        coupon: couponSchema.optional(),
        seller: z
          .looseObject({ sellerId: z.string().optional(), name: z.string().optional() })
          .optional(),
      })
      .optional()
      .describe("Amazon product details"),
  }),
};
