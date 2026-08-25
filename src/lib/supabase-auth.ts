import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload } from "jose";

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

export type JwtVerification =
  | { ok: true; payload: JWTPayload }
  | { ok: false; reason: "invalid" | "unavailable" };

// JOSE errors that mean the token itself is bad. Anything else thrown by
// jwtVerify (JWKS fetch timeout, network failure, non-200 from Supabase) is
// our infrastructure being unavailable and must not be reported to the
// client as an invalid token — that would make clients discard valid tokens
// and force a re-consent loop during a transient outage.
const TOKEN_ERRORS = [
  errors.JWTClaimValidationFailed, // includes JWTExpired
  errors.JWTInvalid,
  errors.JWSInvalid,
  errors.JWSSignatureVerificationFailed,
  errors.JWKSNoMatchingKey,
  errors.JOSENotSupported, // e.g. an HS256 token against an asymmetric JWKS
] as const;

export async function verifySupabaseJwt(
  token: string,
): Promise<JwtVerification> {
  try {
    jwks ??= createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: SUPABASE_ISSUER,
    });
    return { ok: true, payload };
  } catch (error) {
    if (TOKEN_ERRORS.some((kind) => error instanceof kind)) {
      return { ok: false, reason: "invalid" };
    }
    console.error("[supabase-auth] JWT verification unavailable:", error);
    return { ok: false, reason: "unavailable" };
  }
}

// Short-TTL cache of sub -> lookup result to avoid a Supabase round trip per
// tool call. Failed lookups are cached briefly too, so an account without an
// api_key (or a flapping Supabase REST endpoint) cannot drive one outbound
// fetch per MCP request. Per-isolate only; never persisted.
const API_KEY_CACHE_TTL_MS = 5 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 30 * 1000;
const API_KEY_CACHE_MAX_ENTRIES = 1000;
const apiKeyCache = new Map<string, { result: ApiKeyLookup; expires: number }>();

function cacheLookup(sub: string, result: ApiKeyLookup, ttlMs: number): void {
  if (apiKeyCache.size >= API_KEY_CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [key, entry] of apiKeyCache) {
      if (entry.expires <= now) apiKeyCache.delete(key);
    }
    if (apiKeyCache.size >= API_KEY_CACHE_MAX_ENTRIES) {
      // Still full of live entries: drop the oldest (Map is insertion-ordered).
      const oldest = apiKeyCache.keys().next().value;
      if (oldest !== undefined) apiKeyCache.delete(oldest);
    }
  }
  apiKeyCache.set(sub, { result, expires: Date.now() + ttlMs });
}

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
    return cached.result;
  }

  const serviceRoleKey = getWorkerEnv()["SUPABASE_SERVICE_ROLE_KEY"];
  if (typeof serviceRoleKey !== "string" || !serviceRoleKey) {
    console.error(
      "[supabase-auth] SUPABASE_SERVICE_ROLE_KEY is not configured; cannot map OAuth users to API keys.",
    );
    // Not cached: this branch does no I/O, and the env never changes mid-isolate.
    return { ok: false, reason: "misconfigured" };
  }

  let result: ApiKeyLookup;
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
      result = { ok: false, reason: "lookup-failed" };
    } else {
      const rows = (await response.json()) as Array<{ api_key?: string | null }>;
      const apiKey = rows[0]?.api_key;
      result = apiKey ? { ok: true, apiKey } : { ok: false, reason: "no-api-key" };
    }
  } catch (error) {
    console.error("[supabase-auth] api_key lookup errored:", error);
    result = { ok: false, reason: "lookup-failed" };
  }

  cacheLookup(sub, result, result.ok ? API_KEY_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS);
  return result;
}
