# Canopy API MCP Server

A type-safe MCP (Model Context Protocol) server that provides Amazon product data through the Canopy API. Built with [xmcp](https://xmcp.dev) and deployed on Cloudflare Workers.

## Features

- **17 Amazon Data Tools** — product info, variants, offers, stock, sales, reviews, search, autocomplete, categories, best sellers, sellers, authors, deals, and ASIN/GTIN lookup
- **Streamable HTTP transport** at `/mcp` (current MCP spec)
- **File-based tools** — one file per tool under `src/tools/`
- **Type Safety** — TypeScript types generated from the Canopy OpenAPI spec via `openapi-typescript`
- **Flexible Auth** — OAuth 2.1 sign-in (Supabase authorization server, dynamic client registration) or an API key in any of four header formats
- **CORS Enabled** — preflight + custom API key headers allowed

## Quick Start

You'll need a Canopy API key from [canopyapi.co](https://canopyapi.co/).

```bash
npm install
npm run dev      # xmcp watcher + wrangler dev (local Workers runtime)
npm run deploy   # build + wrangler deploy --env production
```

### Testing

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
- [Canopy API](https://canopyapi.co/docs)
- [Cloudflare Workers](https://workers.cloudflare.com/)
