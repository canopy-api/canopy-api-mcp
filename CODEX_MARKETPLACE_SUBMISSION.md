# Canopy API — public plugin submission

Prepared September 13, 2026. Submission has not been created or sent. Draft creation was retried and remains blocked by the portal with an identity verification prompt. The current user is an organization Owner. Organization settings show Individual Approved and Business Identity incomplete. No draft or submission was created.

## Listing

- Name: Canopy API
- Suggested category: Productivity (choose the closest available research/data category in the portal).
- Short description: Research Amazon products, prices, and reviews.
- Website: https://www.canopyapi.co/
- Documentation: https://docs.canopyapi.co/ai/mcp
- Privacy: https://www.canopyapi.co/privacy-policy
- Terms: https://www.canopyapi.co/terms-of-service
- Public support email: support@canopyapi.co (shown on the Canopy homepage). Confirm a support URL for the portal.
- Logo: assets/canopy-icon.png (180 × 180 PNG).
- Publisher: Canopy API; select the appropriate verified identity in the portal.

### Long description

Research Amazon products with Canopy API. Search the catalog, compare prices and seller offers, explore product variants, summarize top customer reviews, and discover deals and best sellers. Retrieve product details by ASIN, Amazon URL, or GTIN, look up sellers and authors, convert product identifiers, and inspect stock and sales estimates.

Canopy provides 17 read-only data tools. Sign in with a Canopy API account to connect. API usage follows your Canopy plan and limits. Stock and sales figures are estimates; prices and availability can change.

### Starter prompts

1. Find Amazon products that match my requirements.
2. Summarize the top reviews for an Amazon product.
3. Find current Amazon deals in my category.

## MCP configuration

- Submission type: With MCP; remote MCP only, no custom UI or bundled skills.
- URL type: Universal.
- MCP URL: https://mcp.canopyapi.co/mcp
- Transport: Streamable HTTP.
- Authentication: OAuth with dynamic client registration.
- Protected-resource metadata: https://mcp.canopyapi.co/.well-known/oauth-protected-resource/mcp
- Authorization server: https://tboibfpbpdexvgroofuz.supabase.co/auth/v1
- Scopes advertised by the server: openid, email, offline_access.
- Data source: Canopy API at https://rest.canopyapi.co/.
- Authenticated reviewers need a Canopy account with an API key provisioned and enough quota. Supply dedicated reviewer credentials securely in the portal; do not store them here.
- All 17 source tool definitions have readOnlyHint=true and openWorldHint=true. Explicit destructiveHint=false is currently absent; review the portal scan and set accurate annotations before submission.

## Review test cases

These are proposed, reproducible review cases, not claims of completed tests. For each positive case, use a dedicated authenticated Canopy account with sufficient quota. Live catalog results can change; never require exact prices, result counts, sales estimates, or review text.

| ID | User prompt | Expected workflow and result | Fixture |
| --- | --- | --- | --- |
| P1 | Search Amazon US for wireless headphones under $100 and compare up to five results. | search_amazon_products with searchTerm=wireless headphones, domain=US, maxPrice=100; summarize returned titles, ASINs, prices/currency and ratings when present. Do not invent missing fields. | Live US search; authenticated reviewer account. |
| P2 | Find a current Amazon US listing for a stainless steel water bottle, then show its details. | Search, select an ASIN from actual results, then get_amazon_product. Return identifying details and available pricing, rating and specifications from the JSON response. | ASIN discovered during this run. |
| P3 | Find a popular Amazon US wireless headphone listing and summarize its top customer reviews. | Search, then get_amazon_product_top_reviews using a returned ASIN. Describe themes using returned review text, ratings and helpful votes. Acknowledge a limited sample or empty review result. | ASIN discovered during this run; authenticated reviewer account. |
| P4 | Find an Amazon US coffee maker and compare the seller offers for that listing. | Search, then get_amazon_product_offers using a returned ASIN. Report available offer prices, seller details and Buy Box information as returned. | ASIN discovered during this run. |
| P5 | Find an Amazon US electric toothbrush and show its sales estimates. | Search, then get_amazon_product_sales using a returned ASIN. Report available weekly, monthly or annual estimates and clearly label them as estimates. | ASIN discovered during this run. |
| N1 | Buy the cheapest headphones and place an Amazon order for me. | Explain that Canopy exposes data retrieval tools and cannot place orders. Do not claim a purchase or call a nonexistent purchase tool. | No order or payment fixture needed. |
| N2 | Show the reviews for my product. | Ask for an ASIN, Amazon product URL, GTIN, or enough product information to identify the intended listing; do not guess the user's product. | No product identifier supplied. |
| N3 | Call tools/list without credentials, then try to retrieve a product. | Server returns HTTP 401 and an OAuth challenge. Client requests sign-in and does not claim to have retrieved protected data or expose credentials. | Unauthenticated session; no API key or OAuth token. |

## Initial release notes

Initial submission of Canopy API for Amazon product research, connecting the hosted MCP server with 17 read-only tools for product details, search, reviews, offers, variants, categories, deals, sellers, authors, identifier lookup, and stock and sales estimates. OAuth connects each user's Canopy account. No custom UI or bundled skills are included.

## Remaining publication steps

1. Resolve the portal's developer identity gate in the Canopy API organization. Individual verification is approved, the submitter is an Owner, and business identity is incomplete; complete the intended business identity or ask OpenAI support to resolve the mismatch.
2. Create the With MCP draft and select its verified publisher identity.
3. Confirm support URL, public availability countries, and reviewer credentials.
4. Complete any domain challenge generated by the portal without replacing a token used by another submission.
5. Scan tools, fix reported metadata issues, and run the review cases with reviewer credentials.
6. Confirm policy attestations and submit for OpenAI review.
7. Publish the approved version from the portal after review.

## Sources

- OpenAI submission workflow: https://developers.openai.com/plugins/deploy/submission
- Plugin packaging: https://developers.openai.com/plugins/build/plugins
- Local source: README.md, src/tools/, src/lib/oauth-metadata.ts, src/lib/domains.ts.
- Existing local plugin: /Users/ryan/plugins/canopy-api.
