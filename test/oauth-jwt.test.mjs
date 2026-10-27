// OAuth bearer tokens: invalid/expired tokens must be a 401 challenge so MCP
// clients refresh, and only a JWKS outage may be a 503. Runs against the
// built worker (npm test builds worker.js first) with the Supabase JWKS
// fetched through Miniflare's outbound hook — no live Supabase dependency.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { Miniflare, Response, convertV4MiniflareOptions } from "miniflare";

const ISSUER = "https://tboibfpbpdexvgroofuz.supabase.co/auth/v1";
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
const KID = "test-key-1";

let signingKey;
let otherSigningKey;
let jwksBody;

before(async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256", { extractable: true });
  signingKey = privateKey;
  const jwk = await exportJWK(publicKey);
  jwk.kid = KID;
  jwk.alg = "ES256";
  jwk.use = "sig";
  jwksBody = { keys: [jwk] };
  otherSigningKey = (await generateKeyPair("ES256")).privateKey;
});

function sign(privateKey, exp) {
  // iss must be the real Supabase issuer: claim checks run before exp, so a
  // wrong issuer would 401 as JWTClaimValidationFailed and hide a JWTExpired miss.
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "ES256", kid: KID, typ: "JWT" })
    .setIssuer(ISSUER)
    .setSubject("user-123")
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(privateKey);
}

function workerWith(outbound) {
  return new Miniflare(convertV4MiniflareOptions({
    modules: true,
    scriptPath: "worker.js",
    compatibilityDate: "2025-06-17",
    compatibilityFlags: ["nodejs_compat"],
    cf: false,
    outboundService(request) {
      assert.equal(request.url, JWKS_URL, `unexpected outbound ${request.method} ${request.url}`);
      return outbound(request);
    },
  }));
}

function bearerInitialize(worker, token) {
  return worker.dispatchFetch("http://localhost/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "oauth-jwt-test", version: "1.0.0" },
      },
    }),
  });
}

async function assertInvalidToken(res) {
  assert.equal(res.status, 401);
  const header = res.headers.get("www-authenticate") ?? "";
  assert.match(header, /error="invalid_token"/);
  assert.match(
    header,
    /resource_metadata="http:\/\/localhost\/\.well-known\/oauth-protected-resource\/mcp"/,
  );
  const body = await res.json();
  assert.equal(body.error.code, -32001);
  assert.match(body.error.message, /Invalid or expired OAuth access token/);
}

describe("Supabase access token verification", { concurrency: 1 }, () => {
  test("an expired token is a 401 invalid_token challenge", async () => {
    // Signature must verify. jose checks it before exp, and a bad signature
    // is already a 401 — that would not exercise JWTExpired.
    const token = await sign(signingKey, Math.floor(Date.now() / 1000) - 120);
    const worker = workerWith(() => Response.json(jwksBody));
    try {
      await assertInvalidToken(await bearerInitialize(worker, token));
    } finally {
      await worker.dispose();
    }
  });

  test("a bad-signature token is a 401 invalid_token challenge", async () => {
    const token = await sign(otherSigningKey, Math.floor(Date.now() / 1000) + 3600);
    const worker = workerWith(() => Response.json(jwksBody));
    try {
      await assertInvalidToken(await bearerInitialize(worker, token));
    } finally {
      await worker.dispose();
    }
  });

  test("a JWKS outage is a 503 without a token challenge", async () => {
    // Otherwise-valid token, so a 401 here would mean the outage was reported
    // as an invalid token. Non-200 is the failure jose raises as a generic
    // JOSEError (same branch as a network error or JWKS timeout).
    const token = await sign(signingKey, Math.floor(Date.now() / 1000) + 3600);
    const worker = workerWith(
      () => new Response("jwks unavailable", { status: 502 }),
    );
    try {
      const res = await bearerInitialize(worker, token);
      assert.equal(res.status, 503);
      assert.equal(res.headers.get("www-authenticate"), null);
      const body = await res.json();
      assert.equal(body.error.code, -32603);
      assert.match(body.error.message, /Unable to verify OAuth access tokens/);
    } finally {
      await worker.dispose();
    }
  });
});
