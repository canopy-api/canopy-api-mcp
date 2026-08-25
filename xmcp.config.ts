import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    endpoint: "/mcp",
    cors: {
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Accept",
        "Authorization",
        "X-API-Key",
        "API-KEY",
        "CANOPY-API-KEY",
        "mcp-method",
        "mcp-name",
        "mcp-protocol-version",
        "mcp-session-id",
      ],
      exposedHeaders: [
        "Content-Type",
        "Authorization",
        "mcp-session-id",
        "WWW-Authenticate",
      ],
      credentials: true,
    },
  },
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
  template: {
    name: "Canopy",
    description:
      "MCP server for Amazon product data via the Canopy API (https://canopyapi.co).",
  },
};

export default config;
