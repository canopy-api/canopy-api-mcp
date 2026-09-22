import { z } from "zod";

// Shared building blocks for tool outputSchema declarations, mirroring the
// Canopy API response shapes in src/types/api.d.ts. Objects are loose and
// fields optional so response validation never rejects a live API payload.

export const priceSchema = z.looseObject({
  symbol: z.string().optional().describe("Currency symbol (e.g. $)"),
  value: z.number().optional().describe("Numeric price value"),
  currency: z.string().optional().describe("Currency code (e.g. USD)"),
  display: z.string().optional().describe("Formatted price string (e.g. $19.99)"),
});

export const pageInfoSchema = z.looseObject({
  currentPage: z.number().optional(),
  totalPages: z.number().optional(),
  totalResults: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPrevPage: z.boolean().optional(),
});

export const categoryRefSchema = z.looseObject({
  id: z.string().nullable().optional().describe("Category ID"),
  name: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  breadcrumbPath: z.string().optional(),
});

export const productResultSchema = z.looseObject({
  title: z.string().optional(),
  url: z.string().optional(),
  asin: z.string().optional(),
  price: priceSchema.optional(),
  mainImageUrl: z.string().optional(),
  rating: z.number().optional().describe("Average star rating"),
  ratingsTotal: z.number().optional().describe("Total number of ratings"),
  isPrime: z.boolean().optional(),
  sponsored: z.boolean().optional(),
});

export const reviewSchema = z.looseObject({
  id: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  videos: z
    .array(
      z.looseObject({
        posterImageUrl: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .optional(),
  rating: z.number().optional().describe("Star rating given by the reviewer"),
  helpfulVotes: z.number().optional(),
  verifiedPurchase: z.boolean().optional(),
  reviewer: z
    .looseObject({
      id: z.string().optional(),
      name: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
});
