# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` — xmcp watcher + `wrangler dev` (local Workers runtime, port 8787)
- `npm run build` — `xmcp build --cf` (emits `worker.js` at the project root)
- `npm run deploy` — build + `wrangler deploy --env production`
- `npm run delete` — remove deployed Worker and resources
- `npm run generate` — regenerate `src/types/api.d.ts` from `https://rest.canopyapi.co/api/v1/openapi.json`

## Project Architecture

MCP server providing Amazon product data through the Canopy API. Built with [xmcp](https://xmcp.dev) and deployed on Cloudflare Workers.

### Layout

- **src/tools/** — one file per tool, auto-discovered by xmcp. Each file exports `schema`, `metadata`, and a default async function.
- **src/middleware.ts** — `WebMiddleware` that extracts the API key from request headers and stores it via `context.setAuth({ token })`. Returns 401 if no key is present.
- **src/lib/api-key.ts** — `getApiKey(extra)` helper that reads `extra.authInfo.token` inside tool handlers.
- **src/api-client.ts** — type-safe Canopy REST client (uses generated `paths` types).
- **src/types/api.d.ts** — auto-generated from the Canopy OpenAPI spec.
- **xmcp.config.ts** — endpoint (`/mcp`), CORS, paths.
- **wrangler.jsonc** — Cloudflare Workers config (custom domain `mcp.canopyapi.co` in `production` env).

### Tools

1. `get_amazon_product` — product details by ASIN/URL/GTIN
2. `get_amazon_product_variants` — product variants
3. `get_amazon_product_stock` — stock estimates
4. `get_amazon_product_sales` — sales estimates
5. `get_amazon_product_reviews` — product reviews
6. `search_amazon_products` — product search with filters
7. `get_amazon_autocomplete` — search suggestions
8. `get_amazon_categories` — root categories
9. `get_amazon_category` — category details and products
10. `get_amazon_seller` — seller information
11. `get_amazon_author` — author information and books
12. `get_amazon_deals` — current Amazon deals

### Adding a tool

1. Create `src/tools/<tool-name>.ts` exporting `schema`, `metadata: ToolMetadata`, and a default async function.
2. The handler signature is `(params: InferSchema<typeof schema>, extra: ToolExtraArguments)`.
3. Call `getApiKey(extra)` to get the request's API key, pass it to `createApiClient(...)`, then call the corresponding API method.
4. Return `{ content: [{ type: "text", text: ... }], structuredContent: data }`.

## Authentication

Auth runs in `src/middleware.ts` before any tool handler. The middleware accepts the API key in any of four header formats (`CANOPY-API-KEY`, `API-KEY`, `X-API-KEY`, or `Authorization: Bearer <key>`) and stashes it on `authInfo.token`. Tools call `getApiKey(extra)` from `src/lib/api-key.ts` to read it back.

If no key is present, the middleware short-circuits with HTTP 401 and a JSON-RPC error.

## CORS

CORS is configured in `xmcp.config.ts` under `http.cors`:
- `origin: "*"` for development (restrict in production)
- Allowed methods: `POST`, `OPTIONS`
- Allowed headers include `Content-Type`, `Accept`, `Authorization`, plus the API key headers above

## MCP Protocol

- Streamable HTTP transport at `/mcp`, fully stateless (fresh server per request, no `mcp-session-id` needed)
- xmcp 1.x / MCP SDK v2: serves both protocol revision 2026-07-28 (envelope requests, `server/discover`) and 2025-era clients
- CORS must allow the `mcp-method`, `mcp-name`, `mcp-protocol-version` headers that 2026-07-28 clients send
- Accepts JSON-RPC POST requests with `Accept: application/json, text/event-stream`
- Returns `structuredContent` plus a JSON text fallback for backwards compatibility

## Testing

`npm test` builds `worker.js` and runs `test/regression.test.mjs` (node:test + wrangler `unstable_dev`) against the built worker. It covers the client-facing contract: 401 without a key, all four API key header formats, stateless `tools/list` (no `mcp-session-id`), the full tool roster, input-schema conversion, per-request key forwarding to Canopy (skips if offline), CORS preflight headers, and notification handling.

For interactive testing:

```bash
npx -y @modelcontextprotocol/inspector@latest
```

Connect to `http://localhost:8787/mcp` (development) or the deployed URL. Provide the API key as a request header.

## Build output

`xmcp build --cf` emits a single `worker.js` at the project root. `wrangler.jsonc` points `main` at `./worker.js`. The intermediate `.xmcp/` directory contains the import map and per-runtime stubs.
