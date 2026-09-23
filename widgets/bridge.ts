// Host bridge shared by all widgets. Supports the ChatGPT Apps runtime
// (window.openai globals) and falls back to the open MCP Apps JSON-RPC
// postMessage bridge for other hosts.

type OpenAiGlobals = {
  toolOutput?: unknown;
  openExternal?: (opts: { href: string }) => void;
};

function openai(): OpenAiGlobals | undefined {
  return (window as unknown as { openai?: OpenAiGlobals }).openai;
}

/**
 * Boot the widget: call `render` with the tool's structuredContent as soon as
 * it is available, and again whenever the host updates it.
 */
export function boot(render: (output: unknown) => void): void {
  const host = openai();
  if (host) {
    if (host.toolOutput != null) render(host.toolOutput);
    window.addEventListener("openai:set_globals", (event) => {
      const globals = (event as CustomEvent<{ globals?: OpenAiGlobals }>).detail?.globals;
      if (globals && globals.toolOutput != null) render(globals.toolOutput);
    });
    return;
  }

  // MCP Apps standard bridge (JSON-RPC over postMessage with the parent frame).
  const INIT_ID = 1;
  const post = (msg: Record<string, unknown>) => window.parent.postMessage({ jsonrpc: "2.0", ...msg }, "*");
  const extract = (value: unknown): unknown => {
    if (value == null || typeof value !== "object") return undefined;
    const obj = value as Record<string, unknown>;
    return obj.structuredContent ?? (obj.result as Record<string, unknown> | undefined)?.structuredContent;
  };
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const data = event.data as { id?: number; result?: unknown; method?: string; params?: unknown } | undefined;
    if (!data) return;
    if (data.id === INIT_ID && data.result != null) {
      post({ method: "ui/notifications/initialized", params: {} });
      const initial =
        extract((data.result as Record<string, unknown>).toolResult) ?? extract(data.result);
      if (initial != null) render(initial);
      return;
    }
    if (data.method === "ui/notifications/tool-result") {
      const output = extract(data.params);
      if (output != null) render(output);
    }
  });
  post({
    id: INIT_ID,
    method: "ui/initialize",
    params: {
      appCapabilities: { availableDisplayModes: ["inline"] },
      appInfo: { name: "Canopy Amazon Widget", version: "1.0.0" },
      protocolVersion: "2026-01-26",
    },
  });
}

/** Open an external URL through the host when possible. */
export function openLink(url: string): void {
  const host = openai();
  if (host?.openExternal) {
    host.openExternal({ href: url });
    return;
  }
  window.open(url, "_blank", "noopener");
}

/**
 * Delegate clicks on `a[href]` inside root to openLink, so links work in
 * sandboxed iframes that block default navigation.
 */
export function wireLinks(root: HTMLElement): void {
  root.addEventListener("click", (event) => {
    const anchor = (event.target as HTMLElement).closest("a[href]");
    if (!anchor) return;
    event.preventDefault();
    openLink((anchor as HTMLAnchorElement).href);
  });
}
