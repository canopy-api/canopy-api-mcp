# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-11-09

The server, its tools, and its auth are unchanged. The major version marks the plugin files leaving this repository.

### Removed

- The plugin manifests (`.claude-plugin/`, `.cursor-plugin/`, `.grok-plugin/`, `.mcp.json`, `plugin.json`, `mcp.json`) and both skills. They moved to [canopy-api/canopy-plugin](https://github.com/canopy-api/canopy-plugin). If you added this repository as a Claude Code marketplace, run `claude plugin marketplace remove canopy-api`, then `claude plugin marketplace add canopy-api/canopy-plugin` and `claude plugin install canopy@canopy-api`.

## [2.2.0] - 2026-11-08

### Added

- Marketplace manifests for Claude Code (`.claude-plugin/`), Cursor (`.cursor-plugin/`), and Grok (`.grok-plugin/`), plus the xAI catalog entry.
- `get_amazon_deals` accepts an optional `categoryId` to filter deals to one category.
- `SG`, `NL`, and `SE` marketplaces in the `domain` enum for every tool.
- `license` field in `plugin.json`.

### Changed

- Updated the MCP server SDK to 2.3.1, xmcp to 1.9.0, and wrangler to 4.152.
- Renamed `CLAUDE.md` to `AGENTS.md` so any coding agent picks it up.

### Fixed

- An expired Supabase JWT returns 401 `invalid_token` instead of 503, so clients refresh the token.
- Dependency security advisories.

## [2.1.0] - 2026-10-09

### Added

- Agent Plugins 1.0.0 packaging: `plugin.json`, `mcp.json`, and the `amazon-product-research` and `amazon-price-and-deals` skills.
- MCP Apps and ChatGPT Apps widgets for six tools: product card, search carousel, offers, reviews, best sellers, and deals.
- `outputSchema` on all 17 tools.
- `get_amazon_product_top_reviews`, which replaces the reviews tool.
- Logging of tool calls and Canopy API outcomes.
- MIT license and `glama.json`.

### Changed

- Every tool is annotated with `destructiveHint: false`.

### Fixed

- Null fields are stripped from Canopy responses, so strict hosts no longer reject results against `outputSchema`.

### Removed

- The reviews tool, replaced by `get_amazon_product_top_reviews`.

## [2.0.1] - 2026-08-31

### Added

- Supabase OAuth sign-in alongside header API keys, with `offline_access` for refresh tokens.
- Listing in the official MCP registry as `co.canopyapi/mcp`.
- Regression tests against the built Worker.

### Changed

- Upgraded to xmcp 1.x (MCP SDK v2) with a fully stateless HTTP transport.
- Upgraded zod to v4 for clean tool input schemas.
- 401 responses flag `invalid_token` in the `WWW-Authenticate` challenge.
- Enabled Worker observability.

## [2.0.0] - 2026-05-12

### Changed

- Rebuilt the server on xmcp and deployed it on Cloudflare Workers.

## [0.0.1] - 2025-08-04

### Added

- First MCP server, with API-key authentication.

[Unreleased]: https://github.com/canopy-api/canopy-api-mcp/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/canopy-api/canopy-api-mcp/compare/v2.2.0...v3.0.0
[2.2.0]: https://github.com/canopy-api/canopy-api-mcp/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/canopy-api/canopy-api-mcp/releases/tag/v2.1.0
