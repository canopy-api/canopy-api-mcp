import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import packageJson from "../package.json" with { type: "json" };
import { createApiClient } from "./api-client.js";

// Utility function to extract API key from various header formats
function extractApiKey(headers: Headers): string | null {
  // Try CANOPY-API-KEY header
  const canopyApiKey = headers.get('CANOPY-API-KEY');
  if (canopyApiKey) return canopyApiKey;
  
  // Try API-KEY header
  const apiKey = headers.get('API-KEY');
  if (apiKey) return apiKey;
  
  // Try X-API-KEY header
  const xApiKey = headers.get('X-API-KEY');
  if (xApiKey) return xApiKey;
  
  // Try Authorization: Bearer header
  const authorization = headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.substring(7); // Remove 'Bearer ' prefix
  }
  
  return null;
}

// Global variable to store current request headers (set by middleware)
let currentRequestHeaders: Headers | null = null;

// Function to get API key from current request
function getCurrentApiKey(): string {
  if (!currentRequestHeaders) {
    throw new Error('No request context available - API key cannot be determined');
  }
  
  const apiKey = extractApiKey(currentRequestHeaders);
  if (!apiKey) {
    throw new Error('API key is required. Provide it via CANOPY-API-KEY, API-KEY, X-API-KEY, or Authorization: Bearer <key> header');
  }
  
  return apiKey;
}

// Export function to set request headers (called from middleware)
export function setRequestHeaders(headers: Headers): void {
  currentRequestHeaders = headers;
}

const server = new McpServer({
  title: "Canopy",
  name: packageJson.name,
  version: packageJson.version,
});

// Common Zod schemas for output types
const priceSchema = z.object({
  symbol: z.string(),
  value: z.number(),
  currency: z.string(),
  display: z.string(),
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  url: z.string().optional(),
  breadcrumbPath: z.string().optional(),
});

const sellerSchema = z.object({
  sellerId: z.string().optional(),
  name: z.string().optional(),
});

const productResultSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  asin: z.string().optional(),
  price: priceSchema.optional(),
  mainImageUrl: z.string().optional(),
  rating: z.number().optional(),
  ratingsTotal: z.number().optional(),
  isPrime: z.boolean().optional(),
  sponsored: z.boolean().optional(),
});

const pageInfoSchema = z.object({
  currentPage: z.number().optional(),
  totalPages: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPrevPage: z.boolean().optional(),
});

// Register tool for each API endpoint

// Get Amazon Product Information
server.registerTool(
  "get_amazon_product",
  {
    title: "Get Amazon Product Information",
    description: "Fetch detailed Amazon product information by ASIN, URL, or GTIN.",
    inputSchema: {
      asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
      url: z.string().optional().describe("The Amazon URL for a product"),
      gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
      domain: z.string().optional().default('US').describe("The domain for fetching product data, defaults to US"),
    },
    outputSchema: {
      data: z.object({
        amazonProduct: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          brand: z.string().optional(),
          url: z.string().optional(),
          asin: z.string().optional(),
          isPrime: z.boolean().optional(),
          isNew: z.boolean().optional(),
          price: priceSchema.optional(),
          mainImageUrl: z.string().optional(),
          imageUrls: z.array(z.string()).optional(),
          rating: z.number().optional(),
          ratingsTotal: z.number().optional(),
          featureBullets: z.array(z.string()).optional(),
          categories: z.array(categorySchema).optional(),
          seller: sellerSchema.optional(),
        }),
      }),
    },
  },
  async ({ asin, url, gtin, domain }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonProduct({ asin, url, gtin, domain });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Product Variants
server.registerTool(
  "get_amazon_product_variants",
  {
    title: "Get Amazon Product Variants",
    description: "Fetch product variants for an Amazon product by ASIN, URL, or GTIN.",
    inputSchema: {
      asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
      url: z.string().optional().describe("The Amazon URL for a product"),
      gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
      domain: z.string().optional().default('US').describe("The domain for fetching product data, defaults to US"),
    },
    outputSchema: {
      data: z.object({
        amazonProduct: z.object({
          variants: z.array(z.object({
            asin: z.string().optional(),
            text: z.string().optional(),
            url: z.string().optional(),
            attributes: z.array(z.object({
              name: z.string().optional(),
              value: z.string().optional(),
            })).optional(),
            price: priceSchema.optional(),
          })).optional(),
        }),
      }),
    },
  },
  async ({ asin, url, gtin, domain }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonProductVariants({ asin, url, gtin, domain });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Product Stock Estimates
server.registerTool(
  "get_amazon_product_stock",
  {
    title: "Get Amazon Product Stock Estimates",
    description: "Fetch stock level estimates for an Amazon product by ASIN, URL, or GTIN.",
    inputSchema: {
      asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
      url: z.string().optional().describe("The Amazon URL for a product"),
      gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
      domain: z.string().optional().default('US').describe("The domain for fetching product data, defaults to US"),
    },
    outputSchema: {
      data: z.object({
        amazonProduct: z.object({
          stockEstimate: z.object({
            offerId: z.string().optional(),
            inStock: z.boolean(),
            stockLevel: z.number().optional(),
            availabilityMessage: z.string().optional(),
          }).optional(),
        }),
      }),
    },
  },
  async ({ asin, url, gtin, domain }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonProductStock({ asin, url, gtin, domain });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Product Sales Estimates
server.registerTool(
  "get_amazon_product_sales",
  {
    title: "Get Amazon Product Sales Estimates",
    description: "Fetch sales estimates for an Amazon product by ASIN, URL, or GTIN.",
    inputSchema: {
      asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
      url: z.string().optional().describe("The Amazon URL for a product"),
      gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
      domain: z.string().optional().default('US').describe("The domain for fetching product data, defaults to US"),
    },
    outputSchema: {
      data: z.object({
        amazonProduct: z.object({
          salesEstimate: z.object({
            weeklyUnitSales: z.number().optional(),
            monthlyUnitSales: z.number().optional(),
            annualUnitSales: z.number().optional(),
          }).optional(),
        }),
      }),
    },
  },
  async ({ asin, url, gtin, domain }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonProductSales({ asin, url, gtin, domain });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Product Reviews
server.registerTool(
  "get_amazon_product_reviews",
  {
    title: "Get Amazon Product Reviews",
    description: "Fetch top reviews for an Amazon product by ASIN, URL, or GTIN.",
    inputSchema: {
      asin: z.string().optional().describe("The ASIN for a product (e.g. B01HY0JA3G)"),
      url: z.string().optional().describe("The Amazon URL for a product"),
      gtin: z.string().optional().describe("The GTIN (ISBN, UPC or EAN code) for a product"),
      domain: z.string().optional().default('US').describe("The domain for fetching product data, defaults to US"),
    },
    outputSchema: {
      data: z.object({
        amazonProduct: z.object({
          topReviews: z.array(z.object({
            id: z.string().optional(),
            title: z.string().optional(),
            body: z.string().optional(),
            imageUrls: z.array(z.string()).optional(),
            videos: z.array(z.object({
              posterImageUrl: z.string().optional(),
              url: z.string().optional(),
            })).optional(),
            rating: z.number().optional(),
            helpfulVotes: z.number().optional(),
            verifiedPurchase: z.boolean().optional(),
            reviewer: z.object({
              id: z.string().optional(),
              name: z.string().optional(),
              url: z.string().optional(),
            }).optional(),
          })).optional(),
        }),
      }),
    },
  },
  async ({ asin, url, gtin, domain }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonProductReviews({ asin, url, gtin, domain });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Search Amazon Products
server.registerTool(
  "search_amazon_products",
  {
    title: "Search Amazon Products",
    description: "Search for Amazon products with filters and sorting options.",
    inputSchema: {
      searchTerm: z.string().describe("The search term for fetching search results"),
      domain: z.string().optional().default('US').describe("The domain for fetching search results data, defaults to US"),
      categoryId: z.string().optional().describe("An optional category ID used to filter search results"),
      page: z.number().optional().describe("The page number requested for product results"),
      limit: z.number().optional().describe("Optionally limit the products results, typically between 20-40 results"),
      minPrice: z.number().optional().describe("Minimum price filter"),
      maxPrice: z.number().optional().describe("Maximum price filter"),
      conditions: z.string().optional().describe("Product conditions (NEW, USED, RENEWED) - comma separated"),
      sort: z.string().optional().default('FEATURED').describe("Sort order (FEATURED, MOST_RECENT, PRICE_ASCENDING, PRICE_DESCENDING, AVERAGE_CUSTOMER_REVIEW)"),
    },
    outputSchema: {
      data: z.object({
        amazonProductSearchResults: z.object({
          availableRefinements: z.array(z.object({
            name: z.string().optional(),
            options: z.array(z.object({
              name: z.string().optional(),
            })).optional(),
          })).optional(),
          productResults: z.object({
            results: z.array(productResultSchema).optional(),
            pageInfo: pageInfoSchema.optional(),
          }).optional(),
        }),
      }),
    },
  },
  async ({ searchTerm, domain, categoryId, page, limit, minPrice, maxPrice, conditions, sort }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.searchAmazonProducts({ searchTerm, domain, categoryId, page, limit, minPrice, maxPrice, conditions, sort });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Search Autocomplete
server.registerTool(
  "get_amazon_autocomplete",
  {
    title: "Get Amazon Search Autocomplete",
    description: "Get autocomplete suggestions for Amazon search terms.",
    inputSchema: {
      searchTerm: z.string().describe("The search term for fetching autocomplete results"),
      domain: z.string().optional().default('US').describe("The domain for fetching autocomplete data, defaults to US"),
      category: z.string().optional().describe("The search autocomplete_alias in the amazon url parameter"),
    },
    outputSchema: {
      data: z.object({
        amazonSearchAutocompleteResults: z.array(z.object({
          suggestion: z.string(),
        })),
      }),
    },
  },
  async ({ searchTerm, domain, category }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonAutocomplete({ searchTerm, domain, category });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Categories
server.registerTool(
  "get_amazon_categories",
  {
    title: "Get Amazon Product Categories",
    description: "Get the root level Amazon product category taxonomy.",
    inputSchema: {
      domain: z.string().optional().default('US').describe("The domain for fetching product category taxonomy, defaults to US"),
    },
    outputSchema: {
      data: z.object({
        amazonProductCategoryTaxonomy: z.array(z.object({
          id: z.string(),
          name: z.string(),
          url: z.string(),
          breadcrumbPath: z.string(),
        })),
      }),
    },
  },
  async ({ domain }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonCategories({ domain });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Category Information
server.registerTool(
  "get_amazon_category",
  {
    title: "Get Amazon Category Information",
    description: "Get detailed information about a specific Amazon category including products and subcategories.",
    
    inputSchema: {
      categoryId: z.string().describe("The category ID, typically a number but may also be a string in certain cases"),
      domain: z.string().optional().default('US').describe("The domain for fetching product category data, defaults to US"),
      page: z.number().optional().describe("The page number requested for product results"),
      sort: z.string().optional().default('FEATURED').describe("Sort order (FEATURED, MOST_RECENT, PRICE_ASCENDING, PRICE_DESCENDING, AVERAGE_CUSTOMER_REVIEW)"),
    },
    outputSchema: {
      data: z.object({
        amazonProductCategory: z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          url: z.string().optional(),
          breadcrumbPath: z.string().optional(),
          subcategories: z.array(categorySchema).optional(),
          productResults: z.object({
            results: z.array(productResultSchema).optional(),
            pageInfo: pageInfoSchema.optional(),
          }).optional(),
        }),
      }),
    },
  },
  async ({ categoryId, domain, page, sort }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonCategory({ categoryId, domain, page, sort });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Seller Information
server.registerTool(
  "get_amazon_seller",
  {
    title: "Get Amazon Seller Information",
    description: "Get detailed information about an Amazon seller including their products.",
    inputSchema: {
      sellerId: z.string().describe("The seller ID for a product (e.g. A34JY1ZNKUG942)"),
      domain: z.string().optional().default('US').describe("The domain for fetching seller data, defaults to US"),
      page: z.number().optional().describe("The page number requested for product results"),
    },
    outputSchema: {
      data: z.object({
        amazonSeller: z.object({
          sellerId: z.string().optional(),
          name: z.string().optional(),
          logoUrl: z.string().optional(),
          phone: z.string().optional(),
          rating: z.number().optional(),
          about: z.string().optional(),
          productResults: z.object({
            results: z.array(productResultSchema).optional(),
            pageInfo: pageInfoSchema.optional(),
          }).optional(),
        }),
      }),
    },
  },
  async ({ sellerId, domain, page }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonSeller({ sellerId, domain, page });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

// Get Amazon Author Information
server.registerTool(
  "get_amazon_author",
  {
    title: "Get Amazon Author Information",
    description: "Get detailed information about an Amazon author including their books.",
    inputSchema: {
      asin: z.string().describe("The asin ID for the author (e.g. B017M7UJX6)"),
      domain: z.string().optional().default('US').describe("The domain for fetching author data, defaults to US"),
      page: z.number().optional().describe("The page number requested for book results"),
    },
    outputSchema: {
      data: z.object({
        amazonAuthor: z.object({
          name: z.string().optional(),
          url: z.string().optional(),
          imageUrl: z.string().optional(),
          biography: z.string().optional(),
          bookResults: z.object({
            results: z.array(z.object({
              title: z.string().optional(),
              url: z.string().optional(),
              asin: z.string().optional(),
              price: priceSchema.optional(),
              mainImageUrl: z.string().optional(),
              rating: z.number().optional(),
              ratingsTotal: z.number().optional(),
              isPrime: z.boolean().optional(),
              sponsored: z.boolean().optional(),
              authors: z.array(z.object({
                name: z.string().optional(),
                url: z.string().optional(),
              })).optional(),
            })).optional(),
            pageInfo: pageInfoSchema.optional(),
          }).optional(),
        }),
      }),
    },
  },
  async ({ asin, domain, page }) => {
    const client = createApiClient(getCurrentApiKey());
    const data = await client.getAmazonAuthor({ asin, domain, page });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data
    };
  }
);

export default server;
