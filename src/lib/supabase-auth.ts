import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export const SUPABASE_URL = "https://tboibfpbpdexvgroofuz.supabase.co";
export const SUPABASE_ISSUER = `${SUPABASE_URL}/auth/v1`;
const SUPABASE_JWKS_URL = `${SUPABASE_ISSUER}/.well-known/jwks.json`;

/**
 * The wrapper entry (worker-entry.ts) stashes the Worker env on globalThis
 * before delegating to the xmcp-built worker, because xmcp's WebMiddleware
 * does not receive env bindings.
 */
export function getWorkerEnv(): Record<string, unknown> {
  return (
    (globalThis as { __CANOPY_WORKER_ENV?: Record<string, unknown> })
      .__CANOPY_WORKER_ENV ?? {}
  );
}

/**
 * A Canopy API key is a plain UUID; a Supabase access token is a JWT
 * (three dot-separated base64url segments).
 */
export function looksLikeJwt(token: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

// Module-scope singleton so the JWKS is cached across requests in an isolate.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export async function verifySupabaseJwt(
  token: string,
): Promise<JWTPayload | null> {
  try {
    jwks ??= createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: SUPABASE_ISSUER,
    });
    return payload;
  } catch {
    return null;
  }
}

// Short-TTL cache of sub -> api_key to avoid a DB round trip per tool call.
// Per-isolate only; never persisted.
const API_KEY_CACHE_TTL_MS = 5 * 60 * 1000;
const apiKeyCache = new Map<string, { apiKey: string; expires: number }>();

export type ApiKeyLookup =
  | { ok: true; apiKey: string }
  | { ok: false; reason: "no-api-key" | "lookup-failed" | "misconfigured" };

/**
 * Map a verified Supabase user id (JWT `sub`) to their Canopy API key via
 * the Supabase REST API using the service role key.
 */
export async function resolveApiKeyForUser(sub: string): Promise<ApiKeyLookup> {
  const cached = apiKeyCache.get(sub);
  if (cached && cached.expires > Date.now()) {
    return { ok: true, apiKey: cached.apiKey };
  }

  const serviceRoleKey = getWorkerEnv()["SUPABASE_SERVICE_ROLE_KEY"];
  if (typeof serviceRoleKey !== "string" || !serviceRoleKey) {
    console.error(
      "[supabase-auth] SUPABASE_SERVICE_ROLE_KEY is not configured; cannot map OAuth users to API keys.",
    );
    return { ok: false, reason: "misconfigured" };
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(sub)}&select=api_key`;
    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    if (!response.ok) {
      console.error(
        `[supabase-auth] api_key lookup failed: ${response.status} ${response.statusText}`,
      );
      return { ok: false, reason: "lookup-failed" };
    }
    const rows = (await response.json()) as Array<{ api_key?: string | null }>;
    const apiKey = rows[0]?.api_key;
    if (!apiKey) {
      return { ok: false, reason: "no-api-key" };
    }
    apiKeyCache.set(sub, { apiKey, expires: Date.now() + API_KEY_CACHE_TTL_MS });
    return { ok: true, apiKey };
  } catch (error) {
    console.error("[supabase-auth] api_key lookup errored:", error);
    return { ok: false, reason: "lookup-failed" };
  }
}
