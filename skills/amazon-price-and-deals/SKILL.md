---
name: amazon-price-and-deals
description: Look up live Amazon prices, Buy Box offers, coupons, and current deals with the Canopy MCP server. Use when the user asks for a price, a price comparison, the cheapest offer, a coupon, a deal, or whether a product is on sale.
---

# Amazon prices and deals

Use the Canopy MCP server bundled with this plugin (server name `canopy`, endpoint `https://mcp.canopyapi.co/mcp`). Quote only prices that server returns. Do not scrape Amazon HTML, and do not fill in a price, coupon, or discount the tools left out.

## Before calling a tool

1. Choose the marketplace. `domain` defaults to `US`. Valid values are `US`, `UK`, `CA`, `DE`, `FR`, `IT`, `ES`, `AU`, `IN`, `MX`, `BR`, `JP`, `PL`, `AE`, `SG`, `NL`, and `SE`.
2. For a product-scoped tool, pass exactly one of `asin`, `url`, or `gtin`.
3. If a call fails because the client is not authenticated, stop and ask the user to sign in with Canopy or to set a Canopy API key in the client. Do not invent a key, and do not put a key in plugin files.

## Which tool

- Current price and listing: `get_amazon_product`.
- Every seller offer and the Buy Box: `get_amazon_product_offers`. `buyboxWinner` marks the Buy Box offer. Page with `page` when there are more offers.
- Products inside a price band: `search_amazon_products` with `searchTerm`, and optional `minPrice`, `maxPrice`, and `sort` of `PRICE_ASCENDING` or `PRICE_DESCENDING`. `conditions` is a comma-separated list of `NEW`, `USED`, and `RENEWED`.
- What is on sale now: `get_amazon_deals`. Filter with `categoryId` from `get_amazon_categories` when the user names a department. Page with `page`.
- Stock next to a price: `get_amazon_product_stock`. `stockLevel` is a Canopy estimate.

For product research that is not a price or deal question, use the `amazon-product-research` skill. Parameter details are in that skill's [tools reference](../amazon-product-research/references/tools.md).

## Reporting

Name the marketplace and the ASIN. When the tool returns a product `url`, link to it. Quote the price, currency, and offer condition the tool returned, and keep the Buy Box price separate from other seller offers. A missing price or coupon means the field was unavailable; do not treat it as zero. Say that stock figures are Canopy estimates.
