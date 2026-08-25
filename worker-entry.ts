// Wrapper around the xmcp-built worker (worker.js). It exists because xmcp's
// Cloudflare runtime (1) 404s unknown paths, so the OAuth well-known metadata
// route must be answered before delegating, and (2) never passes `env` to
// WebMiddleware, so the env is stashed on globalThis for src/middleware.ts.
// Kept outside tsconfig's rootDir; all real logic lives (type-checked) in src/lib.
import worker from "./worker.js";
import { handleWellKnown } from "./src/lib/oauth-metadata";

interface Env {
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    (globalThis as Record<string, unknown>).__CANOPY_WORKER_ENV = env;
    return handleWellKnown(request) ?? worker.fetch(request, env, ctx);
  },
};
