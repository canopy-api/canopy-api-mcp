# Claude Connectors Directory — submission packet

Everything needed to submit `https://mcp.canopyapi.co/mcp` through the
[submission portal](https://claude.ai/admin-settings/directory/submissions/new).
Requirements source: [submission docs](https://claude.com/docs/connectors/building/submission)
and the [pre-submission checklist](https://claude.com/docs/connectors/building/review-criteria).

## Readiness check (verified 2026-08-31)

| Requirement | Status |
| --- | --- |
| Public HTTPS endpoint, Streamable HTTP | ✅ `https://mcp.canopyapi.co/mcp` |
| Remote server (not stdio/local) | ✅ Cloudflare Worker |
| OAuth 2.0/2.1 for authenticated service | ✅ Supabase AS, **dynamic client registration supported** (`registration_endpoint` present) |
| Protected-resource metadata discovery | ✅ `/.well-known/oauth-protected-resource[/mcp]` |
| 401 carries `WWW-Authenticate` w/ `resource_metadata` | ✅ verified with curl |
| Every tool has `title` + `readOnlyHint`/`destructiveHint` | ✅ all 17 tools: `title` + `readOnlyHint: true` (verified against the live server) |
| Read and write tools separated | ✅ N/A — the server is 100% read-only, no write tools |
| No catch-all `api_request`-style tool | ✅ every tool calls a fixed Canopy endpoint |
| Tool names ≤ 64 chars | ✅ longest is `get_amazon_bestseller_categories` (32) |
| Descriptions free of prompt-injection patterns | ✅ each describes only what the tool does |
| First-party API | ✅ Canopy owns `rest.canopyapi.co` and `mcp.canopyapi.co` |
| Not an unsupported use case (money transfer / AI media gen) | ✅ |
| Privacy policy URL (HTTPS, public) | ✅ https://www.canopyapi.co/privacy-policy |
| Public documentation URL | ✅ https://docs.canopyapi.co/ai/mcp — rewritten 2026-09-01: hosted URL, OAuth, all 17 tools |
| Test account, fully populated | ✅ ready (credentials held by Ryan, entered at the Test & launch step) |
| Team/Enterprise org + Owner (or Directory role) on claude.ai | ⚠️ user must confirm |

## Remaining before submitting

Done: docs page rewritten (2026-09-01), reviewer test account ready, server deployed
at 2.1.0 and published to the MCP registry.

1. **Confirm plan/permissions**: the portal lives in organization settings, so the
   claude.ai account submitting must be on **Team or Enterprise** and be an Owner
   (or hold a custom role with the Directory or Libraries permission on Enterprise).
   Individual Pro/Max plans cannot reach the portal.
2. **Icon**: ✅ `assets/canopy-icon.png` (180×180 PNG, Canopy tree mark).
3. **Tool sweep**: ✅ done 2026-09-01 — all 17 tools exercised against the live server
   as a connected Claude connector; every one returned a real payload. (`get_amazon_deals`,
   `get_amazon_bestsellers`, `search_amazon_products` also verified with `limit`/`page`.)
   The earlier `get_amazon_gtin_from_asin` 500 on `B0F7K8DPPT` is fixed upstream; it now
   returns `gtin: null`, which is intended behaviour when no GTIN is found.

## Portal answers

### Connection
- Server URL: `https://mcp.canopyapi.co/mcp`
- Transport: **Streamable HTTP**
- Same URL for every user: **yes**

### Listing
- **Server name** (≤100): `Canopy API`
- **Tagline** (≤55): `Amazon product data: search, prices, reviews, deals` (51 chars)
- **Description** (≤2000):

> Canopy API gives Claude live access to Amazon's public catalog, so you can research
> products, prices, and competitors without leaving the conversation.
>
> Look up any product by ASIN, Amazon URL, or GTIN (ISBN/UPC/EAN) and get titles,
> images, pricing, ratings, specifications, and Buy Box details. Search the catalog
> with filters and sorting, browse the category taxonomy, pull best sellers for any
> category, and see what's currently discounted in Amazon's deals.
>
> Go deeper on a single listing with product variants, the full list of seller offers,
> top customer reviews, and estimates for stock levels and weekly, monthly, and annual
> sales volume — the numbers e-commerce teams use to size demand and track competitors.
> Look up sellers and authors to see everything they list, and convert freely between
> ASINs and GTINs when reconciling catalogs.
>
> All 17 tools are read-only: the connector never writes to Amazon, never places orders,
> and never touches your Amazon account. It reads only what Canopy's API returns for the
> products you ask about.
>
> Typical uses: competitive price and review monitoring, product and keyword research
> before a launch, catalog enrichment from a list of ASINs or barcodes, demand estimation
> from sales and stock signals, and shopping research where up-to-date prices matter.
>
> Requires a Canopy API account. Sign in with your Canopy account when you connect —
> no API key copy-paste needed — or supply a key via header if you prefer. Free tier
> available; see canopyapi.co for plans and rate limits.

- **Categories** (1–5, pick from the portal's list): Data & Analytics; Shopping /
  E-commerce; Research; Productivity — choose the closest available options.
- **Documentation URL**: `https://docs.canopyapi.co/ai/mcp` (after the rewrite below)
- **Privacy policy URL**: `https://www.canopyapi.co/privacy-policy`
- **Icon**: `assets/canopy-icon.png` (180×180 PNG)
- **Support contact**: Canopy support email (use the address monitored for API support)
- **URL slug**: `canopy-api` — **permanent once published**, pick deliberately.

### Use cases

Primary use cases:
1. **Competitive monitoring** — track a competitor's prices, Buy Box winner, review
   sentiment, and estimated sales over time from a list of ASINs.
2. **Product & keyword research** — search the catalog with filters, check autocomplete
   demand signals, and read best sellers in a category before launching a product.
3. **Catalog enrichment** — turn a list of GTINs/ISBNs into ASINs with full product
   detail, images, and pricing.
4. **Shopping research** — ask Claude for current prices, deals, and real customer
   review themes for something you're about to buy.

Prerequisites for users: a Canopy API account (free tier available) at
https://www.canopyapi.co/ — sign-in happens through the connector's OAuth flow.

Reads data / writes data: **reads only**.

Example prompts (each exercises different tools):
1. "Compare the Sony WH-1000XM5 and Bose QuietComfort Ultra on Amazon — price, rating,
   and what reviewers complain about most." → `search_amazon_products`,
   `get_amazon_product`, `get_amazon_product_top_reviews`
2. "What are the top 10 best sellers in Amazon's Kitchen & Dining category right now,
   and which are on deal today?" → `get_amazon_bestseller_categories`,
   `get_amazon_bestsellers`, `get_amazon_deals`
3. "For ASIN B01HY0JA3G: list every seller offer, the variants, and estimated monthly
   sales." → `get_amazon_product_offers`, `get_amazon_product_variants`,
   `get_amazon_product_sales`
4. "I have ISBN 9780134685991 — find the Amazon listing, current price, and stock
   estimate." → `get_amazon_asin_from_gtin`, `get_amazon_product`,
   `get_amazon_product_stock`

### Company
- Company name: Canopy
- Website: `https://www.canopyapi.co/`
- Primary contact: the submitting account holder.

### Authentication
- Mode: **OAuth with dynamic client registration**.
- Authorization server: `https://tboibfpbpdexvgroofuz.supabase.co/auth/v1`
  (discovered from `https://mcp.canopyapi.co/.well-known/oauth-protected-resource`).
- Scopes: `openid`, `email`, `offline_access` (refresh tokens supported).
- Consent screen: `https://www.canopyapi.co/oauth/consent`.
- Note for the reviewer: the server also accepts a Canopy API key via header
  (`CANOPY-API-KEY` / `API-KEY` / `X-API-KEY` / `Authorization: Bearer <uuid>`) as a
  fallback for non-OAuth clients. This is not the path directory users take.

### Data handling
- Underlying API: **our own first-party API** (`rest.canopyapi.co`, owned by Canopy).
  It serves public Amazon catalog data collected by Canopy.
- Personal health data: **no**.
- Sponsored content: **no** — results are not paid placements.
  (If Canopy ever injects affiliate tags into returned URLs, that must be disclosed here.
  Confirm before answering.)

### Test & launch

Write instructions detailed enough for a reviewer to go end-to-end. Template:

> 1. Go to https://www.canopyapi.co/signin and sign in with:
>    email `<reviewer@…>` / password `<…>` (account is on the `<plan>` plan with
>    `<N>` requests available).
> 2. In Claude, add the connector at `https://mcp.canopyapi.co/mcp`. Click Connect —
>    you'll be redirected to Canopy's consent screen; approve access.
> 3. All 17 tools are read-only and need no further setup. Suggested calls:
>    `get_amazon_product` with `asin: "B01HY0JA3G"`; `search_amazon_products` with
>    `searchTerm: "wireless headphones"`; `get_amazon_bestseller_categories` with no args.
> 4. Alternative for header auth: the account's API key is on the dashboard at
>    https://www.canopyapi.co/dashboard; pass it as `CANOPY-API-KEY`.

Attest that you have run every tool via MCP Inspector and as a custom connector.

### Compliance (7 acknowledgments)
Directory guidelines, first-party API usage, financial transactions (none), AI media
generation (none), prompt injection (descriptions are behavior-neutral), conversation
data collection (none — no tool reads memory, chat history, or user files), public
documentation (docs.canopyapi.co/ai/mcp). All seven should be answerable truthfully as-is.

### Allowed link URIs
Optional; the server does not use `ui/open-link` today. If that changes, declare
`https://www.canopyapi.co` and `https://docs.canopyapi.co` (subdomains are not implied).

## Replacement docs page

Suggested rewrite for `/ai/mcp.md` in the docs repo. The key changes: lead with the
hosted URL, document OAuth, list all 17 tools, and demote self-hosting to the bottom.

```markdown
---
title: Canopy API MCP
description: Connect Claude and other AI clients to Amazon product data over MCP.
---

The Canopy API MCP server gives AI assistants direct access to Amazon product data
over the Model Context Protocol. It's hosted for you — no install required.

**Server URL:** `https://mcp.canopyapi.co/mcp` (Streamable HTTP)

## Connecting

### Claude
Settings → Connectors → Add custom connector → paste `https://mcp.canopyapi.co/mcp`.
Click Connect and sign in with your Canopy account when prompted. That's it — no API
key to copy.

### Other MCP clients
Any client that speaks Streamable HTTP can connect to the same URL. OAuth-capable
clients discover the sign-in flow automatically. Clients without OAuth support can
send a Canopy API key as a header instead:

    CANOPY-API-KEY: your-api-key

`API-KEY`, `X-API-KEY`, and `Authorization: Bearer your-api-key` also work. Get your
key from the Canopy dashboard.

## Authentication

Two options:

- **OAuth (recommended).** An unauthenticated request returns 401 with a
  `WWW-Authenticate` header pointing at
  `https://mcp.canopyapi.co/.well-known/oauth-protected-resource`. Clients follow that
  to Canopy's authorization server, register dynamically, and send you through the
  consent screen. Your Canopy API key is resolved server-side and never leaves Canopy.
- **API key header.** Any of the four header forms above.

Usage counts against your Canopy plan either way.

## Available tools

All 17 tools are read-only — the server never writes to Amazon or your account.

| Tool | Description |
| --- | --- |
| `get_amazon_product` | Product details by ASIN, URL, or GTIN |
| `get_amazon_product_variants` | Product variants and options |
| `get_amazon_product_offers` | Seller offers and Buy Box info |
| `get_amazon_product_stock` | Stock level estimates |
| `get_amazon_product_sales` | Sales estimates (weekly/monthly/annual) |
| `get_amazon_product_top_reviews` | Top customer reviews with ratings, helpful votes, and media |
| `search_amazon_products` | Search with filters, sorting, and pagination |
| `get_amazon_autocomplete` | Search term suggestions |
| `get_amazon_deals` | Current Amazon deals |
| `get_amazon_bestsellers` | Best-selling products for a category |
| `get_amazon_bestseller_categories` | Best seller category list |
| `get_amazon_categories` | Root category taxonomy |
| `get_amazon_category` | Category details with products and subcategories |
| `get_amazon_seller` | Seller info and listings |
| `get_amazon_author` | Author info and books |
| `get_amazon_asin_from_gtin` | ASIN lookup by ISBN, UPC, or EAN |
| `get_amazon_gtin_from_asin` | GTIN lookup by ASIN |

## Example prompts

- "Compare the Sony WH-1000XM5 and Bose QuietComfort Ultra on Amazon — price, rating,
  and what reviewers complain about most."
- "What are the top 10 best sellers in Kitchen & Dining right now, and which are on
  deal today?"
- "For ASIN B01HY0JA3G, list every seller offer, the variants, and estimated monthly
  sales."

## Testing with MCP Inspector

    npx -y @modelcontextprotocol/inspector@latest

Connect to `https://mcp.canopyapi.co/mcp` and invoke tools interactively.

## Self-hosting

The server is open source at
[github.com/canopy-api/canopy-api-mcp](https://github.com/canopy-api/canopy-api-mcp)
and runs on Cloudflare Workers:

    git clone https://github.com/canopy-api/canopy-api-mcp
    cd canopy-api-mcp
    npm install
    npm run dev     # http://localhost:8787/mcp
    npm run deploy
```

## Note on the MCP registry listing

This server is already published to the official MCP registry as `co.canopyapi/mcp`
(`server.json`). That is a separate catalog from the Claude Connectors Directory —
listing in one does not list you in the other. Keep `server.json` in sync when the
listing copy changes.
