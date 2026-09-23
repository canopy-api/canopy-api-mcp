# Canopy MCP Server — Amazon Product Data API for AI Agents

An Amazon product data API served over the [Model Context Protocol](https://modelcontextprotocol.io). Connect Claude, ChatGPT, Cursor, or any MCP client to real-time Amazon data — an Amazon search API, reviews API, price tracker, ASIN lookup, best sellers, deals, and sales estimates — powered by the [Canopy API](https://canopyapi.co/). No headless browsers, no brittle HTML scraping: typed JSON over standard MCP tools.

Built with [xmcp](https://xmcp.dev) and deployed on Cloudflare Workers. Use the hosted remote MCP server at `https://mcp.canopyapi.co/mcp` or self-host from this repo. Setup guides and client walkthroughs live on the [Amazon MCP server](https://canopyapi.co/amazon-mcp-server) page.

## Why an Amazon MCP server?

AI agents and LLM apps increasingly need live e-commerce data. This server gives any MCP-capable assistant or agent framework direct tool access to Amazon:

- **Shopping assistants** — an Amazon search API for agents: query products, compare prices and Buy Box offers, surface deals and coupons in chat
- **Price monitoring & competitive intelligence** — an Amazon price tracker API for prices, stock estimates, and seller offers on any ASIN
- **Product research & market analysis** — an Amazon product research tool with best seller rankings, sales estimates, and category taxonomies
- **Catalog enrichment** — ASIN lookup and ASIN ↔ GTIN/UPC/ISBN/EAN conversion, plus images, variants, and specs
- **Review analysis** — an Amazon reviews API returning top customer reviews with ratings, helpful votes, and media for summarization

Works as a Claude MCP server (Desktop, Code, and the claude.ai connectors directory), a ChatGPT MCP connector (Apps SDK, with rich product widgets), in Cursor and the MCP Inspector, and with any agent built on the MCP SDK, LangChain, or the OpenAI Agents SDK.

## Features

- **17 Amazon Data Tools** — product info, variants, offers, stock, sales, reviews, search, autocomplete, categories, best sellers, sellers, authors, deals, and ASIN/GTIN lookup
- **Streamable HTTP transport** at `/mcp` (current MCP spec)
- **File-based tools** — one file per tool under `src/tools/`
- **Type Safety** — TypeScript types generated from the Canopy OpenAPI spec via `openapi-typescript`
- **Flexible Auth** — OAuth 2.1 sign-in (Supabase authorization server, dynamic client registration) or an API key in any of four header formats
- **CORS Enabled** — preflight + custom API key headers allowed

## Quick Start

### Use the hosted server (no install)

Add the remote MCP server to your client and sign in with OAuth, or supply a Canopy API key:

```
https://mcp.canopyapi.co/mcp
```

Claude and other OAuth-capable MCP clients will walk you through sign-in automatically. Get an API key at [canopyapi.co](https://canopyapi.co/), and see the [Amazon MCP server guide](https://canopyapi.co/amazon-mcp-server) for per-client setup instructions.

### Run it yourself

You'll need a Canopy API key from [canopyapi.co](https://canopyapi.co/).

```bash
npm install
npm run dev      # xmcp watcher + wrangler dev (local Workers runtime)
npm run deploy   # build + wrangler deploy --env production
```

### Testing

Run `npm test` to build the worker and run the regression suite. Output-schema
tests use mocked REST responses to verify that null-valued fields (unavailable
prices, coupons, ratings) are stripped before reaching MCP clients, that
responses match the advertised JSON Schema, and that malformed values are still
rejected. These tests do not require a real Canopy API key.

Use the MCP Inspector and connect to `http://localhost:8787/mcp` (or your deployed URL). Provide the API key as a request header:

```bash
npx -y @modelcontextprotocol/inspector@latest
```

Or with curl:

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "CANOPY-API-KEY: $CANOPY_API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Authentication

Every request must carry credentials. Two modes are supported:

**1. OAuth 2.1 (recommended for MCP clients).** OAuth-capable clients discover the flow automatically: an unauthenticated request returns 401 with `WWW-Authenticate: Bearer resource_metadata="https://mcp.canopyapi.co/.well-known/oauth-protected-resource"`. Supabase is the authorization server (dynamic client registration supported); consent lives at canopyapi.co. The verified user's Canopy API key is resolved server-side.

**2. API key headers.** Any of these forms works (checked in this order):

- `CANOPY-API-KEY: your-api-key`
- `API-KEY: your-api-key`
- `X-API-KEY: your-api-key`
- `Authorization: Bearer your-api-key`

A missing or invalid credential returns HTTP 401 with a JSON-RPC error before the request reaches the MCP transport (see `src/middleware.ts`).

## Available Tools

All 17 tools are read-only (`readOnlyHint: true`) and annotated with a `title`.

### Product Information
- `get_amazon_product` — product details by ASIN, URL, or GTIN
- `get_amazon_product_variants` — product variants
- `get_amazon_product_offers` — seller offers and Buy Box info
- `get_amazon_product_stock` — stock level estimates
- `get_amazon_product_sales` — sales estimates (weekly, monthly, annual)
- `get_amazon_product_top_reviews` — top customer reviews (title, body, rating, helpful votes, images/videos)

### Search & Discovery
- `search_amazon_products` — search with filters and sorting
- `get_amazon_autocomplete` — search term suggestions
- `get_amazon_deals` — current deals
- `get_amazon_bestsellers` — best-selling products for a category
- `get_amazon_bestseller_categories` — best seller category list

### Categories
- `get_amazon_categories` — root category taxonomy
- `get_amazon_category` — category details with products and subcategories

### Entities
- `get_amazon_seller` — seller information and product listings
- `get_amazon_author` — author information and book listings

### Identifiers
- `get_amazon_asin_from_gtin` — ASIN lookup by ISBN/UPC/EAN
- `get_amazon_gtin_from_asin` — GTIN lookup by ASIN

## Project Structure

```
canopy-api-mcp/
├── src/
│   ├── tools/                  # one file per tool (auto-discovered by xmcp)
│   │   ├── get-amazon-product.ts
│   │   └── ...
│   ├── lib/
│   │   └── api-key.ts          # reads API key from extra.authInfo
│   ├── middleware.ts           # auth middleware (lifts header → authInfo.token)
│   ├── api-client.ts           # type-safe Canopy REST client
│   └── types/
│       └── api.d.ts            # generated from OpenAPI
├── xmcp.config.ts              # xmcp config (endpoint, CORS, paths)
├── wrangler.jsonc              # Cloudflare Workers config
├── tsconfig.json
└── package.json
```

## Type Safety

`src/types/api.d.ts` is generated from the Canopy OpenAPI spec. Regenerate when the API changes:

```bash
npm run generate
```

## Scripts

- `npm run dev` — xmcp watcher + `wrangler dev` (local Workers runtime)
- `npm run build` — `xmcp build --cf` (emits `worker.js` for Cloudflare)
- `npm run deploy` — build + `wrangler deploy --env production`
- `npm run delete` — remove the deployed Worker
- `npm run generate` — regenerate API types from the OpenAPI spec

## Migration from v1.x

v2.0 replaces ModelFetch with [xmcp](https://xmcp.dev). The MCP endpoint moved from `/sse/mcp` (deprecated SSE transport mount) to `/mcp` (current Streamable HTTP convention). Update any clients accordingly.

## Related

- [Model Context Protocol](https://modelcontextprotocol.io)
- [xmcp framework](https://xmcp.dev)
- [Amazon MCP Server — Canopy](https://canopyapi.co/amazon-mcp-server)
- [Canopy API](https://canopyapi.co/docs)
- [Cloudflare Workers](https://workers.cloudflare.com/)
