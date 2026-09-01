import type { paths } from "./types/api";

// Base API configuration
const API_BASE_URL = "https://rest.canopyapi.co";

// Type helpers to extract path info
type PathKeys = keyof paths;
type PathInfo<P extends PathKeys> = paths[P];
type GetOperation<P extends PathKeys> = PathInfo<P>["get"];
type QueryParams<P extends PathKeys> = GetOperation<P> extends {
  parameters: { query?: infer Q };
}
  ? Q
  : never;
type ResponseData<P extends PathKeys> = GetOperation<P> extends {
  responses: { 200: { content: { "application/json": infer R } } };
}
  ? R
  : never;

// API Client class
export class CanopyApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Generic method to make API calls using path from generated types
  async get<P extends PathKeys>(
    path: P,
    params?: QueryParams<P>
  ): Promise<ResponseData<P>> {
    const url = new URL(path as string, API_BASE_URL);

    // Add query parameters if provided
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${
          body ? ` — ${body}` : ""
        }`
      );
    }

    return response.json() as Promise<ResponseData<P>>;
  }

  // Convenience methods for specific endpoints
  async getAmazonProduct(params?: QueryParams<"/api/amazon/product">) {
    return this.get("/api/amazon/product", params);
  }

  async getAmazonProductVariants(
    params?: QueryParams<"/api/amazon/product/variants">
  ) {
    return this.get("/api/amazon/product/variants", params);
  }

  async getAmazonProductStock(
    params?: QueryParams<"/api/amazon/product/stock">
  ) {
    return this.get("/api/amazon/product/stock", params);
  }

  async getAmazonProductSales(
    params?: QueryParams<"/api/amazon/product/sales">
  ) {
    return this.get("/api/amazon/product/sales", params);
  }

  async getAmazonProductTopReviews(
    params?: QueryParams<"/api/amazon/product/top-reviews">
  ) {
    return this.get("/api/amazon/product/top-reviews", params);
  }

  async searchAmazonProducts(params: QueryParams<"/api/amazon/search">) {
    return this.get("/api/amazon/search", params);
  }

  async getAmazonAutocomplete(params: QueryParams<"/api/amazon/autocomplete">) {
    return this.get("/api/amazon/autocomplete", params);
  }

  async getAmazonCategories(params?: QueryParams<"/api/amazon/categories">) {
    return this.get("/api/amazon/categories", params);
  }

  async getAmazonCategory(params: QueryParams<"/api/amazon/category">) {
    return this.get("/api/amazon/category", params);
  }

  async getAmazonSeller(params: QueryParams<"/api/amazon/seller">) {
    return this.get("/api/amazon/seller", params);
  }

  async getAmazonAuthor(params: QueryParams<"/api/amazon/author">) {
    return this.get("/api/amazon/author", params);
  }

  async getAmazonDeals(params?: QueryParams<"/api/amazon/deals">) {
    return this.get("/api/amazon/deals", params);
  }

  async getAmazonGtinFromAsin(
    params: QueryParams<"/api/amazon/product/gtin-from-asin">
  ) {
    return this.get("/api/amazon/product/gtin-from-asin", params);
  }

  async getAmazonAsinFromGtin(
    params: QueryParams<"/api/amazon/product/asin-from-gtin">
  ) {
    return this.get("/api/amazon/product/asin-from-gtin", params);
  }

  async getAmazonProductOffers(
    params?: QueryParams<"/api/amazon/product/offers">
  ) {
    return this.get("/api/amazon/product/offers", params);
  }

  async getAmazonBestSellers(params?: QueryParams<"/api/amazon/bestsellers">) {
    return this.get("/api/amazon/bestsellers", params);
  }

  async getAmazonBestSellerCategories(
    params?: QueryParams<"/api/amazon/bestseller-categories">
  ) {
    return this.get("/api/amazon/bestseller-categories", params);
  }
}

// Factory function to create client with current API key
export function createApiClient(apiKey: string): CanopyApiClient {
  return new CanopyApiClient(apiKey);
}
