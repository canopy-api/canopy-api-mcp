import type { ToolExtraArguments } from "xmcp";

export function getApiKey(extra: ToolExtraArguments): string {
  const token = extra.authInfo?.token;
  if (!token) {
    throw new Error(
      "Internal: API key was not present on the request context. The middleware should have rejected this request.",
    );
  }
  return token;
}
