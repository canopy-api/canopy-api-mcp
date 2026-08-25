import { type WebMiddleware } from "xmcp";
import { wwwAuthenticate } from "./lib/oauth-metadata";
import {
  looksLikeJwt,
  resolveApiKeyForUser,
  verifySupabaseJwt,
} from "./lib/supabase-auth";

type Credential = {
  value: string;
  /** Which header carried it — only bearer credentials can be OAuth JWTs. */
  source: "bearer" | "api-key-header";
};

function extractCredential(headers: Headers): Credential | null {
  for (const name of ["CANOPY-API-KEY", "API-KEY", "X-API-KEY"]) {
    const value = headers.get(name);
    if (value) return { value, source: "api-key-header" };
  }

  const auth = headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return { value: auth.slice(7), source: "bearer" };
  }

  return null;
}

function jsonRpcError(
  status: number,
  code: number,
  message: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...extraHeaders },
    },
  );
}

function unauthorized(
  requestUrl: string,
  message: string,
  error?: "invalid_token",
): Response {
  return jsonRpcError(401, -32001, message, {
    "WWW-Authenticate": wwwAuthenticate(requestUrl, error),
  });
}

const middleware: WebMiddleware = async (request, context) => {
  const credential = extractCredential(request.headers);

  if (!credential) {
    return unauthorized(
      request.url,
      "Authentication required. Sign in via OAuth, or provide a Canopy API key via CANOPY-API-KEY, API-KEY, X-API-KEY, or Authorization: Bearer <key> header. Sign up for an API key at https://www.canopyapi.co/.",
    );
  }

  let apiKey = credential.value;

  // A bearer credential shaped like a JWT is a Supabase OAuth access token
  // (Canopy API keys are plain UUIDs and never contain dots). Verify it and
  // map the user to their Canopy API key. A failed verification is a hard
  // 401 — it must never fall through to the API-key path.
  if (credential.source === "bearer" && looksLikeJwt(credential.value)) {
    const verification = await verifySupabaseJwt(credential.value);
    if (!verification.ok) {
      if (verification.reason === "unavailable") {
        // Our JWKS fetch failed, not their token. A 401 here would make
        // clients discard a valid token and re-run the consent flow.
        return jsonRpcError(
          503,
          -32603,
          "Unable to verify OAuth access tokens right now. Please try again.",
        );
      }
      return unauthorized(
        request.url,
        "Invalid or expired OAuth access token. Re-authenticate, or provide a Canopy API key header instead.",
        "invalid_token",
      );
    }
    if (typeof verification.payload.sub !== "string") {
      return unauthorized(
        request.url,
        "Invalid or expired OAuth access token. Re-authenticate, or provide a Canopy API key header instead.",
        "invalid_token",
      );
    }
    const lookup = await resolveApiKeyForUser(verification.payload.sub);
    if (!lookup.ok) {
      if (lookup.reason === "no-api-key") {
        // Authentication succeeded; the account just isn't provisioned. 403
        // without a WWW-Authenticate challenge, so clients surface the
        // message instead of looping through a fresh (equally keyless)
        // OAuth consent flow.
        return jsonRpcError(
          403,
          -32001,
          "Your account has no Canopy API key yet. Finish signing up at https://www.canopyapi.co/.",
        );
      }
      return jsonRpcError(
        500,
        -32603,
        "Failed to resolve your API key. Please try again.",
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
