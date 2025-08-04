import handle from "@modelfetch/cloudflare";
import { cors } from "hono/cors";

import server, { setRequestHeaders } from "./server";

export default {
  fetch: handle({
    server,
    basePath: "/sse",
    pre: (app) => {
      app.use(
        "/sse/*",
        cors({
          origin: "*", // Allow all origins for development - restrict in production
          allowHeaders: [
            "Content-Type",
            "Accept",
            "Authorization",
            "X-API-Key",
            "API-KEY",
            "CANOPY-API-KEY",
          ],
          allowMethods: ["POST", "OPTIONS"], // MCP requires POST for JSON-RPC
          credentials: true,
        })
      );

      // Middleware to capture request headers for API key extraction
      app.use("/sse/*", async (c, next) => {
        setRequestHeaders(c.req.raw.headers);
        await next();
      });
    },
  }),
} satisfies ExportedHandler<Env>;
