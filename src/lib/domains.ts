import { z } from "zod";

/** Amazon marketplaces the Canopy API supports (mirrors the `domain` enum in the OpenAPI spec). */
export const AMAZON_DOMAINS = [
  "US", "UK", "CA", "DE", "FR", "IT", "ES", "AU", "IN", "MX", "BR", "JP", "PL", "AE",
] as const;

/** The shared `domain` tool parameter. Enumerated so clients see the valid marketplaces. */
export const domainParam = (description: string) =>
  z.enum(AMAZON_DOMAINS).optional().default("US").describe(description);
