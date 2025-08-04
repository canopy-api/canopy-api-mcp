# Canopy API MCP Server

A fully type-safe MCP (Model Context Protocol) server that provides Amazon product data through the Canopy API. Built with ModelFetch and deployed on Cloudflare Workers.

## Features

- ✅ **11 Amazon Data Tools** - Product info, variants, stock, sales, reviews, search, categories, sellers, and authors
- ✅ **Full Type Safety** - TypeScript types generated from OpenAPI spec with `openapi-typescript`
- ✅ **Flexible Authentication** - Supports multiple API key header formats
- ✅ **CORS Enabled** - Ready for cross-origin requests with MCP protocol compliance
- ✅ **Structured Content** - Returns both structured data and text content for maximum compatibility
- ✅ **Clean API Client** - Type-safe internal client using generated types and paths

## Quick Start

### Prerequisites

You'll need a Canopy API key from [Canopy](https://canopyapi.co/).

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

### Testing

Test the MCP server using the MCP Inspector:

```bash
npx -y @modelcontextprotocol/inspector@latest
```

Connect to `http://localhost:8787/mcp` (development) or your deployed URL.

## Authentication

The server requires a Canopy API key provided via request headers. Supported formats:

- `CANOPY-API-KEY: your-api-key-here`
- `API-KEY: your-api-key-here`
- `X-API-KEY: your-api-key-here`
- `Authorization: Bearer your-api-key-here`

The server automatically detects and uses the first available API key.

## Available Tools

### Product Information
- **get_amazon_product** - Detailed product information by ASIN, URL, or GTIN
- **get_amazon_product_variants** - Product variants and options
- **get_amazon_product_stock** - Stock level estimates
- **get_amazon_product_sales** - Sales estimates (weekly, monthly, annual)
- **get_amazon_product_reviews** - Top product reviews

### Search & Discovery
- **search_amazon_products** - Search with filters, sorting, and pagination
- **get_amazon_autocomplete** - Search term suggestions

### Categories & Organization
- **get_amazon_categories** - Root level category taxonomy
- **get_amazon_category** - Category details with products and subcategories

### Entities
- **get_amazon_seller** - Seller information and product listings
- **get_amazon_author** - Author information and book listings

## Project Architecture

```
canopy-api-mcp/
├── src/
│   ├── index.ts          # Cloudflare Worker entry point with CORS
│   ├── server.ts         # MCP server with 11 registered tools
│   ├── api-client.ts     # Type-safe Canopy API client
│   └── types/
│       └── api.d.ts      # Generated TypeScript types from OpenAPI
├── wrangler.jsonc        # Cloudflare Workers configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── CLAUDE.md            # Development documentation
```

### Key Components

- **MCP Server** (`src/server.ts`) - Registers tools with proper input/output schemas
- **API Client** (`src/api-client.ts`) - Type-safe wrapper around Canopy REST API
- **Generated Types** (`src/types/api.d.ts`) - Auto-generated from OpenAPI specification
- **Worker Entry** (`src/index.ts`) - Handles CORS and request routing

## Type Safety

The project uses `openapi-typescript` to generate TypeScript types from the Canopy API specification. This provides:

- Compile-time validation of API requests and responses
- Full IntelliSense support for all API endpoints
- Automatic parameter and response type inference
- Type-safe path and query parameter handling

Regenerate types when the API changes:

```bash
npm run generate
```

## MCP Protocol Compliance

The server fully complies with MCP protocol requirements:

- **HTTP POST Only** - Uses POST for JSON-RPC communication
- **Required Headers** - Supports `Accept` header with `application/json` and `text/event-stream`
- **Structured Content** - Returns both `structuredContent` and backwards-compatible text content
- **Proper Error Handling** - HTTP status codes and error messages

## CORS Configuration

Configured for cross-origin requests:
- Allows all origins (`*`) for development
- Supports required MCP and API key headers
- Handles preflight OPTIONS requests
- **Production Note**: Restrict origins in production environments

## Development Commands

- `npm run dev` - Start development server
- `npm run deploy` - Deploy to Cloudflare Workers  
- `npm run delete` - Delete deployment and resources
- `npm run generate` - Regenerate API types from OpenAPI spec

## Example Usage

Once deployed, the MCP server can be used by any MCP-compatible client. Example tool call:

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_amazon_product",
    "arguments": {
      "asin": "B08N5WRWNW",
      "domain": "US"
    }
  }
}
```

## Related Documentation

- [Model Context Protocol](https://modelcontextprotocol.io)
- [ModelFetch Framework](https://www.modelfetch.com)
- [Canopy API Documentation](https://canopyapi.co/docs)
- [Cloudflare Workers](https://workers.cloudflare.com/)
