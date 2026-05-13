import { type WebMiddleware } from "xmcp";

function extractApiKey(headers: Headers): string | null {
  const canopy = headers.get("CANOPY-API-KEY");
  if (canopy) return canopy;

  const apiKey = headers.get("API-KEY");
  if (apiKey) return apiKey;

  const xApiKey = headers.get("X-API-KEY");
  if (xApiKey) return xApiKey;

  const auth = headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

const middleware: WebMiddleware = (request, context) => {
  const apiKey = extractApiKey(request.headers);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "API key required. Provide via CANOPY-API-KEY, API-KEY, X-API-KEY, or Authorization: Bearer <key> header. Sign up for an API key at https://www.canopyapi.co/.",
        },
        id: null,
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // console.log("mcp request", { apiKey });

  context.setAuth({
    token: apiKey,
    clientId: "canopy-api-mcp",
    scopes: [],
  });
};

export default middleware;
