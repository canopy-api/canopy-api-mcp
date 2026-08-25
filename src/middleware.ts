import { type WebMiddleware } from "xmcp";
import { wwwAuthenticate } from "./lib/oauth-metadata";
import {
  looksLikeJwt,
  resolveApiKeyForUser,
  verifySupabaseJwt,
} from "./lib/supabase-auth";

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

function unauthorized(requestUrl: string, message: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": wwwAuthenticate(requestUrl),
      },
    },
  );
}

const middleware: WebMiddleware = async (request, context) => {
  const credential = extractApiKey(request.headers);

  if (!credential) {
    return unauthorized(
      request.url,
      "Authentication required. Sign in via OAuth, or provide a Canopy API key via CANOPY-API-KEY, API-KEY, X-API-KEY, or Authorization: Bearer <key> header. Sign up for an API key at https://www.canopyapi.co/.",
    );
  }

  let apiKey = credential;

  // A bearer credential shaped like a JWT is a Supabase OAuth access token
  // (Canopy API keys are plain UUIDs and never contain dots). Verify it and
  // map the user to their Canopy API key. A failed verification is a hard
  // 401 — it must never fall through to the API-key path.
  const bearer = request.headers.get("Authorization")?.startsWith("Bearer ")
    ? request.headers.get("Authorization")!.slice(7)
    : null;
  if (credential === bearer && looksLikeJwt(credential)) {
    const payload = await verifySupabaseJwt(credential);
    if (!payload || typeof payload.sub !== "string") {
      return unauthorized(
        request.url,
        "Invalid or expired OAuth access token. Re-authenticate, or provide a Canopy API key header instead.",
      );
    }
    const lookup = await resolveApiKeyForUser(payload.sub);
    if (!lookup.ok) {
      if (lookup.reason === "no-api-key") {
        return unauthorized(
          request.url,
          "Your account has no Canopy API key yet. Finish signing up at https://www.canopyapi.co/.",
        );
      }
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Failed to resolve your API key. Please try again.",
          },
          id: null,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    apiKey = lookup.apiKey;
  }

  context.setAuth({
    token: apiKey,
    clientId: "canopy-api-mcp",
    scopes: [],
  });
};

export default middleware;
