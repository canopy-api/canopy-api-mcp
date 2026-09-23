// Public domain-ownership challenge for the Canopy API submission in OpenAI.
// This is a publicly served verification value, not an authentication secret.
const VERIFICATION_TOKEN = "IVL1AzAIjTLSWDMFGMN0nMy4eMwuz1KE1Dr1jL1azyo";

export function handleOpenAiVerification(request: Request): Response | null {
  if (new URL(request.url).pathname !== "/.well-known/openai-apps-challenge") {
    return null;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  return new Response(request.method === "HEAD" ? null : VERIFICATION_TOKEN, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
