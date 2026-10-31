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

### Install the plugin

The plugin root is this repository. It points every client at the hosted server `https://mcp.canopyapi.co/mcp` and does not embed an API key. OAuth-capable clients discover sign-in from the server. If a client only supports a static header, set `CANOPY-API-KEY` in that client.

Two skills ship with the plugin: `amazon-product-research` and `amazon-price-and-deals`.

**Cursor Marketplace.** Install **Canopy** from Customize or the [Cursor Marketplace](https://cursor.com/marketplace) after it is listed. The listing manifest is `.cursor-plugin/plugin.json` (name `canopy`, logo `assets/canopy-icon.png`). It points `mcpServers` at `.cursor-plugin/mcp.json`, a remote `http` server, so Cursor starts OAuth against `https://mcp.canopyapi.co/mcp` without a pasted key. Root `mcp.json` stays the Agent Plugins file and is not the Cursor listing config. To try it before it is listed, copy this repository to `~/.cursor/plugins/local/canopy` (a symlink that points outside that folder is ignored), reload the window, and confirm the Canopy server and both skills in Customize.

**Claude Code, from this repo.** This repository is also a marketplace. In Claude Code:

```bash
claude plugin marketplace add canopy-api/canopy-api-mcp
claude plugin install canopy@canopy-api
```

Or, inside a session: `/plugin marketplace add canopy-api/canopy-api-mcp`, then `/plugin install canopy@canopy-api`. For one session without installing, run `claude --plugin-dir /path/to/canopy-api-mcp`. The manifest is `.claude-plugin/plugin.json`, the marketplace catalog is `.claude-plugin/marketplace.json`, and the server is `.mcp.json` (`type: http`). On first use, approve the Canopy OAuth prompt.

**Claude.ai and Cowork.** After the plugin is listed in Anthropic's directory, add **Canopy** from the directory. Sign in on the plugin's Connectors tab. The plugin uses the same URL as the existing [Canopy connector](https://claude.ai/directory/canopy).

**Grok Build.** After the plugin is in the [xAI plugin marketplace](https://github.com/xai-org/plugin-marketplace), install it from `/marketplace` or:

```bash
grok plugin install canopy --trust
```

The first connection opens Canopy's OAuth flow. Skills load from `skills/` and the server from `.mcp.json`. `.grok-plugin/plugin.json` is the manifest the xAI catalog indexer reads first. In this repo, `grok plugin validate` reports the Agent Plugins manifest at root `plugin.json` (name `canopy-api-mcp`) because the CLI checks that file before `.grok-plugin/plugin.json`. The marketplace install id is still `canopy`.

**Other Agent Plugins clients.** This repository is also an [Agent Plugin](https://agent-plugins.org/specification) (specification 1.0.0). Those clients read root `plugin.json` (name `canopy-api-mcp`) and `mcp.json` (`type: streamable-http`). They need Agent Plugins 1.0.0. There is no archive and no registry protocol in the specification: the package is this directory.

`server.json` is the MCP Registry server card (`co.canopyapi/mcp`), separate from the plugin manifests. `npm install`, `npm run dev`, and `npm run deploy` are unchanged.

Validate the manifests:

```bash
npm run validate:plugin
claude plugin validate . --strict
grok plugin validate .
```

### Submit to a marketplace

These steps are for publishing. Nothing in this repo submits a listing on its own.

**Cursor — form, signed in.** Marketplace plugins must be open source and are reviewed manually.

1. Merge this change to the public default branch.
2. Sign in at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).
3. Submit the repository URL `https://github.com/canopy-api/canopy-api-mcp`.
4. Wait for Cursor's review. Updates to the default branch are reviewed again.

**Claude Code — no form for this repo's marketplace.** Anyone can install from the git catalog above as soon as the commit is on GitHub. Pushing a new commit is the release. If `version` in `.claude-plugin/plugin.json` does not change, `claude plugin update` keeps the previous copy, so bump `version` on each release.

**Anthropic directory — form, signed in to claude.ai.** Submitting needs a paid plan (Pro, Max, Ultra, Team, or Enterprise). On Team and Enterprise, an Owner submits, or an Enterprise Owner grants the Directory permission.

1. Merge to the public default branch. Connect the GitHub account that can push to `canopy-api/canopy-api-mcp` on [claude.ai](https://claude.ai).
2. Open [claude.ai/directory/manage](https://claude.ai/directory/manage), choose **Submit new**, then **Plugin bundle**.
3. Repository: `canopy-api/canopy-api-mcp`. Leave the plugin path empty (the manifest is at the repo root). Leave the branch empty to track the default branch.
4. Select **Validate**, fix anything that blocks submission, and validate again. The repo-root `package-lock.json` is expected to be held for a reviewer (`Dependencies install from a lockfile`) because the plugin folder is the repository root. That hold is not a rejection.
5. Finish listing details, data handling, and compliance, then **Submit for review**.
6. The Canopy MCP server is already listed at [claude.ai/directory/canopy](https://claude.ai/directory/canopy). Do not create a second connector. From the same organization, pair this plugin with that connector so both point at `https://mcp.canopyapi.co/mcp`.
7. When the version passes, select **Publish**. With the GitHub push webhook (admin on the repo), later commits on the tracked branch are scanned without a new form.

**xAI — pull request, no form.** Do not open the PR until the plugin commit is on the public default branch. `submissions/xai-marketplace-entry.json` is the object to append to `.grok-plugin/marketplace.json` in [xai-org/plugin-marketplace](https://github.com/xai-org/plugin-marketplace). Its `sha` must be the full commit you want Grok to install.

1. After this change is on `main`, refresh the pin:

   ```bash
   git ls-remote https://github.com/canopy-api/canopy-api-mcp.git refs/heads/main
   ```

   Put that 40-character SHA in `source.sha`. A squash merge does not keep the SHA from the pull request branch.
2. Fork `xai-org/plugin-marketplace` and branch from `main`.
3. Append the entry to `.grok-plugin/marketplace.json`. Do not vendor the plugin under `external_plugins/`.
4. From that fork, regenerate and validate (CI runs the same commands):

   ```bash
   python3 scripts/generate-plugin-index.py
   python3 scripts/validate-catalog.py
   python3 scripts/generate-plugin-index.py --check
   ```

5. Open a pull request with the repo's template. Remote third-party plugins are reviewed by the code owners. To ship a later update, bump `sha` and regenerate the index. Do not add a second `canopy` entry.

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
- `get_amazon_deals` — current deals, optionally filtered by category
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
├── .cursor-plugin/
│   ├── plugin.json             # Cursor Marketplace manifest
│   └── mcp.json                # Cursor remote HTTP MCP server
├── .claude-plugin/
│   ├── plugin.json             # Claude Code plugin manifest
│   └── marketplace.json        # self-hosted Claude Code marketplace
├── .grok-plugin/plugin.json    # Grok Build plugin manifest
├── .mcp.json                   # Claude Code and Grok MCP server (HTTP)
├── plugin.json                 # Agent Plugins 1.0.0 manifest
├── mcp.json                    # Agent Plugins MCP declaration (Streamable HTTP)
├── skills/
│   ├── amazon-product-research/
│   │   ├── SKILL.md
│   │   └── references/tools.md
│   └── amazon-price-and-deals/
│       └── SKILL.md
├── submissions/
│   └── xai-marketplace-entry.json  # entry to paste into xai-org/plugin-marketplace
├── server.json                 # MCP Registry server card (separate from plugin.json)
├── LICENSE                     # MIT License
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
├── worker-entry.ts             # Workers entry (unchanged)
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
- `npm run validate:plugin` — check `plugin.json`, `mcp.json`, and `skills/` against Agent Plugins 1.0.0

## Migration from v1.x

v2.0 replaces ModelFetch with [xmcp](https://xmcp.dev). The MCP endpoint moved from `/sse/mcp` (deprecated SSE transport mount) to `/mcp` (current Streamable HTTP convention). Update any clients accordingly.

## License

This project is released under the [MIT License](LICENSE). Copyright (c) 2026 Canopy API.

## Related

- [Model Context Protocol](https://modelcontextprotocol.io)
- [xmcp framework](https://xmcp.dev)
- [Amazon MCP Server — Canopy](https://canopyapi.co/amazon-mcp-server)
- [Canopy API](https://canopyapi.co/docs)
- [Cloudflare Workers](https://workers.cloudflare.com/)
