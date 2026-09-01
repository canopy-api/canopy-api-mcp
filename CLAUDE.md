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
- **worker-entry.ts** — wrapper around the generated `worker.js` (wrangler `main`). Serves `/.well-known/oauth-protected-resource[/mcp]` and stashes Worker env on `globalThis` for the middleware (xmcp's CF runtime 404s unknown paths and never passes env to middleware).
- **src/middleware.ts** — `WebMiddleware` handling both auth modes: header API keys, and Supabase OAuth bearer JWTs (verified against JWKS, mapped to the user's `api_key`). Stores the resolved key via `context.setAuth({ token })`. Returns 401 with a `WWW-Authenticate` discovery header if no/invalid credentials.
- **src/lib/supabase-auth.ts** — JWT detection/verification (jose), `sub` → `api_key` lookup via Supabase REST (service role key, 5-min in-isolate cache).
- **src/lib/oauth-metadata.ts** — protected-resource metadata + `WWW-Authenticate` helper.
- **src/lib/api-key.ts** — `getApiKey(extra)` helper that reads `extra.authInfo.token` inside tool handlers.
- **src/api-client.ts** — type-safe Canopy REST client (uses generated `paths` types).
- **src/types/api.d.ts** — auto-generated from the Canopy OpenAPI spec.
- **xmcp.config.ts** — endpoint (`/mcp`), CORS, paths.
- **wrangler.jsonc** — Cloudflare Workers config (custom domain `mcp.canopyapi.co` in `production` env).

### Tools

All tools are read-only (`readOnlyHint: true`) and carry an annotation `title` (required for the Claude connectors directory).

1. `get_amazon_product` — product details by ASIN/URL/GTIN
2. `get_amazon_product_variants` — product variants
3. `get_amazon_product_offers` — seller offers + Buy Box
4. `get_amazon_product_stock` — stock estimates
5. `get_amazon_product_sales` — sales estimates
6. `get_amazon_product_top_reviews` — top customer reviews
7. `search_amazon_products` — product search with filters
8. `get_amazon_autocomplete` — search suggestions
9. `get_amazon_categories` — root categories
10. `get_amazon_category` — category details and products
11. `get_amazon_bestsellers` — best sellers for a category
12. `get_amazon_bestseller_categories` — best seller category list
13. `get_amazon_seller` — seller information
14. `get_amazon_author` — author information and books
15. `get_amazon_deals` — current Amazon deals
16. `get_amazon_asin_from_gtin` — ASIN by ISBN/UPC/EAN
17. `get_amazon_gtin_from_asin` — GTIN by ASIN

### Adding a tool

1. Create `src/tools/<tool-name>.ts` exporting `schema`, `metadata: ToolMetadata`, and a default async function.
2. The handler signature is `(params: InferSchema<typeof schema>, extra: ToolExtraArguments)`.
3. Call `getApiKey(extra)` to get the request's API key, pass it to `createApiClient(...)`, then call the corresponding API method.
4. Return `{ content: [{ type: "text", text: ... }], structuredContent: data }`.

## Authentication

Auth runs in `src/middleware.ts` before any tool handler. Two modes:

1. **API key headers** (unchanged): `CANOPY-API-KEY`, `API-KEY`, `X-API-KEY`, or `Authorization: Bearer <key>` (non-JWT).
2. **Supabase OAuth**: `Authorization: Bearer <jwt>` (three dot-separated segments — Canopy keys are UUIDs, so shape disambiguates). The JWT is verified against the Supabase JWKS (issuer `https://tboibfpbpdexvgroofuz.supabase.co/auth/v1`); the `sub` claim is mapped to `public.users.api_key` via the Supabase REST API using `SUPABASE_SERVICE_ROLE_KEY`. A failed verification is a hard 401 — it never falls through to the API-key path. Two non-401 carve-outs: a JWKS fetch failure (our side) returns 503 so clients keep their valid token, and a verified user with no `api_key` row gets 403 without a `WWW-Authenticate` challenge so clients don't loop through re-consent.

Either way the resolved Canopy key lands on `authInfo.token`, so `getApiKey(extra)` and all tools are auth-mode agnostic.

401 responses carry `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource"` so MCP clients can discover the OAuth flow (Supabase is the authorization server; consent lives at canopyapi.co — nothing in this repo).

Secrets: `SUPABASE_SERVICE_ROLE_KEY` via `wrangler secret put` (and `--env production`); locally in `.dev.vars` (gitignored, see `.dev.vars.example`).

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

`xmcp build --cf` emits a single `worker.js` at the project root. `wrangler.jsonc` points `main` at `worker-entry.ts`, which wraps `worker.js` (so `worker.js` must be built before `wrangler dev`/`deploy` runs). The intermediate `.xmcp/` directory contains the import map and per-runtime stubs.
