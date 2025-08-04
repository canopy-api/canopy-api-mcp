# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Cloudflare Worker)
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run delete` - Delete deployment and resources
- `npm run generate` - Generate TypeScript types from OpenAPI spec at https://rest.canopyapi.co/api/v1/openapi.json

## Project Architecture

This is an MCP (Model Context Protocol) server that provides Amazon product data tools through the Canopy API. Built with ModelFetch and deployed on Cloudflare Workers.

### Core Components

- **src/index.ts** - Cloudflare Worker entry point using ModelFetch handler
- **src/server.ts** - MCP server implementation with 11 registered tools for Amazon data
- **src/types/api.d.ts** - Auto-generated TypeScript types from Canopy OpenAPI spec

### MCP Server Structure

The server registers these Amazon data tools:
1. `get_amazon_product` - Product details by ASIN/URL/GTIN
2. `get_amazon_product_variants` - Product variants
3. `get_amazon_product_stock` - Stock estimates  
4. `get_amazon_product_sales` - Sales estimates
5. `get_amazon_product_reviews` - Product reviews
6. `search_amazon_products` - Product search with filters
7. `get_amazon_autocomplete` - Search suggestions
8. `get_amazon_categories` - Root categories
9. `get_amazon_category` - Category details and products
10. `get_amazon_seller` - Seller information
11. `get_amazon_author` - Author information and books

### API Integration

- Uses Canopy REST API (https://rest.canopyapi.co/api) with native fetch
- Requires API key provided via request headers (see Authentication section)
- All tools support domain parameter (defaults to 'US') 
- Parameters use ASIN, URL, or GTIN for product identification
- Full TypeScript type safety with generated types from OpenAPI spec
- CORS enabled for cross-origin requests (configured for all origins in development)

### Type Safety

The `src/types/api.d.ts` file contains auto-generated TypeScript types from the Canopy OpenAPI specification. All API responses are properly typed using the `operations` interface. Regenerate with `npm run generate` when the API changes.

## Testing

Test the MCP server using the MCP Inspector:
```bash
npx -y @modelcontextprotocol/inspector@latest
```
Connect to `http://localhost:8787/mcp` (development) or your deployed URL.

## Authentication

The server requires a Canopy API key to be provided in the request headers. The API key can be sent using any of these header formats:

- `CANOPY-API-KEY: your-api-key-here`
- `API-KEY: your-api-key-here`
- `X-API-KEY: your-api-key-here`
- `Authorization: Bearer your-api-key-here`

The server will automatically detect and use the first available API key from these headers.

## CORS Configuration

The server includes CORS middleware to enable cross-origin requests and MCP compliance:
- Currently configured to allow all origins (`origin: "*"`) for development
- Supports required MCP headers: `Content-Type`, `Accept`, plus API key headers: `Authorization`, `X-API-Key`, `API-KEY`, `CANOPY-API-KEY`
- Allows `POST` and `OPTIONS` methods (MCP requires POST for JSON-RPC communication)
- **Production Note**: Restrict `origin` to specific domains in production environments

### MCP Protocol Compliance

The server is configured to support the MCP (Model Context Protocol) requirements:
- Accepts HTTP POST requests with JSON-RPC messages
- Supports `Accept` header with `application/json` and `text/event-stream` content types
- Handles single JSON-RPC requests, notifications, and responses in request body

To modify CORS settings, update the middleware configuration in `src/index.ts`.