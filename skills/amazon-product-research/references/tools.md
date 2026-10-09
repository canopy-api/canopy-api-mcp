# Canopy Amazon tools

All tools are read-only. `domain` is optional on every tool and defaults to `US`.

Marketplaces: `US`, `UK`, `CA`, `DE`, `FR`, `IT`, `ES`, `AU`, `IN`, `MX`, `BR`, `JP`, `PL`, `AE`.

Product-scoped tools take exactly one of `asin`, `url`, or `gtin`.

| Tool | Required | Optional |
| --- | --- | --- |
| `get_amazon_product` | one of `asin`, `url`, `gtin` | `domain` |
| `get_amazon_product_variants` | one of `asin`, `url`, `gtin` | `domain` |
| `get_amazon_product_offers` | one of `asin`, `url`, `gtin` | `domain`, `page` |
| `get_amazon_product_stock` | one of `asin`, `url`, `gtin` | `domain` |
| `get_amazon_product_sales` | one of `asin`, `url`, `gtin` | `domain` |
| `get_amazon_product_top_reviews` | one of `asin`, `url`, `gtin` | `domain` |
| `search_amazon_products` | `searchTerm` | `domain`, `categoryId`, `page`, `limit` (typically 20–40), `minPrice`, `maxPrice`, `conditions` (`NEW`, `USED`, `RENEWED`, comma-separated), `sort` |
| `get_amazon_autocomplete` | `searchTerm` | `domain`, `category` (Amazon autocomplete alias) |
| `get_amazon_deals` | — | `domain`, `page`, `limit` (typically 20–40) |
| `get_amazon_categories` | — | `domain` |
| `get_amazon_category` | `categoryId` | `domain`, `page`, `sort` |
| `get_amazon_bestseller_categories` | — | `domain` |
| `get_amazon_bestsellers` | `categoryId` or `url` | `domain`, `page`, `limit` (typically 20–50) |
| `get_amazon_seller` | `sellerId` | `domain`, `page` |
| `get_amazon_author` | author `asin` | `domain`, `page` |
| `get_amazon_asin_from_gtin` | `gtin` (ISBN, UPC, or EAN) | `domain` |
| `get_amazon_gtin_from_asin` | `asin` | `domain` |

`sort` values for search and category: `FEATURED` (default), `MOST_RECENT`, `PRICE_ASCENDING`, `PRICE_DESCENDING`, `AVERAGE_CUSTOMER_REVIEW`.

Identifier lookup can return a null ASIN or GTIN when Canopy has no match. Stock `stockLevel` and sales `weeklyUnitSales`, `monthlyUnitSales`, and `annualUnitSales` are estimates. Offer `buyboxWinner` marks the current Buy Box offer.
