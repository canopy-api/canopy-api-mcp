import { SUPABASE_ISSUER } from "./supabase-auth";

const WELL_KNOWN_PATH = "/.well-known/oauth-protected-resource";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728), served at both the root
 * well-known path and the /mcp path-suffix variant clients use for discovery.
 * Returns null for any other request so the caller can delegate to the
 * xmcp-built worker.
 */
export function handleWellKnown(request: Request): Response | null {
  const url = new URL(request.url);
  if (
    url.pathname !== WELL_KNOWN_PATH &&
    url.pathname !== `${WELL_KNOWN_PATH}/mcp`
  ) {
    return null;
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  return new Response(
    JSON.stringify({
      resource: `${url.origin}/mcp`,
      authorization_servers: [SUPABASE_ISSUER],
      bearer_methods_supported: ["header"],
      // offline_access makes Supabase issue a refresh token; without it,
      // sessions hard-expire with the access token (~1h) and force re-consent.
      scopes_supported: ["openid", "email", "offline_access"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
}

/**
 * WWW-Authenticate header value advertising OAuth discovery (RFC 9728 §5.1).
 * Pass `error: "invalid_token"` when a token was presented but rejected
 * (RFC 6750 §3.1); omit it when no credentials were provided at all.
 */
export function wwwAuthenticate(
  requestUrl: string,
  error?: "invalid_token",
): string {
  const origin = new URL(requestUrl).origin;
  const errorParam = error ? `error="${error}", ` : "";
  return `Bearer ${errorParam}resource_metadata="${origin}${WELL_KNOWN_PATH}/mcp"`;
}
