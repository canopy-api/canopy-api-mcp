---
name: amazon-product-research
description: Research live Amazon listings with the Canopy MCP server, including product search, prices, Buy Box offers, stock and sales estimates, reviews, deals, best sellers, categories, sellers, authors, and ASIN/GTIN conversion. Use when the user asks about an Amazon product, ASIN, ISBN, UPC, EAN, price, seller, review, deal, coupon, best-seller rank, or marketplace listing.
---

# Amazon product research

Use the Canopy MCP server from this plugin (`canopy` in `mcp.json`). It is the hosted Streamable HTTP endpoint `https://mcp.canopyapi.co/mcp`. Every tool is read-only. Do not scrape Amazon HTML and do not browse the site to reconstruct data the tools already return.

## Before calling a tool

1. Choose the marketplace. `domain` defaults to `US`. Valid values are `US`, `UK`, `CA`, `DE`, `FR`, `IT`, `ES`, `AU`, `IN`, `MX`, `BR`, `JP`, `PL`, and `AE`.
2. For a product-scoped tool, pass exactly one of `asin`, `url`, or `gtin`.
3. If a call fails because the client is not authenticated, stop and ask the user to sign in with Canopy or to set a Canopy API key in the client. Do not invent a key, and do not put a key in plugin files.

## Which tool

- Product by name or keywords: `search_amazon_products`
- Known ASIN, Amazon URL, or barcode: `get_amazon_product`
- Child variants: `get_amazon_product_variants`
- Seller offers and Buy Box: `get_amazon_product_offers`
- Stock estimate: `get_amazon_product_stock`
- Sales estimate: `get_amazon_product_sales`
- Top reviews: `get_amazon_product_top_reviews`
- Current deals: `get_amazon_deals`
- Best sellers: `get_amazon_bestseller_categories`, then `get_amazon_bestsellers`
- Category browse: `get_amazon_categories`, then `get_amazon_category`
- Seller storefront: `get_amazon_seller`
- Author page: `get_amazon_author`
- Barcode to ASIN: `get_amazon_asin_from_gtin`
- ASIN to barcode: `get_amazon_gtin_from_asin`
- Query suggestions: `get_amazon_autocomplete`

Parameter details are in [references/tools.md](references/tools.md).

## Reporting

Name the marketplace and the ASIN. When you have a product `url` from the tool, link to that. Say that stock and sales figures are Canopy estimates. A missing price, coupon, or rating means the field was unavailable; do not treat it as zero.

## Gotchas

- `get_amazon_author` takes the author's ASIN, not a book ASIN.
- Best-seller category ids come from `get_amazon_bestseller_categories`. They are not the ids from `get_amazon_categories`.
- Search and category `sort` is one of `FEATURED`, `MOST_RECENT`, `PRICE_ASCENDING`, `PRICE_DESCENDING`, or `AVERAGE_CUSTOMER_REVIEW`.
- Search `conditions` is a comma-separated list of `NEW`, `USED`, and `RENEWED`.
- Page through results with `page`. Search pages are typically 20–40 products. Best-seller pages are typically 20–50.
