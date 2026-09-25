// Host bridge shared by all widgets. Supports the ChatGPT Apps runtime
// (window.openai globals) and falls back to the open MCP Apps JSON-RPC
// postMessage bridge for other hosts.

type OpenAiGlobals = {
  toolOutput?: unknown;
  theme?: string;
  openExternal?: (opts: { href: string }) => void;
};

function openai(): OpenAiGlobals | undefined {
  return (window as unknown as { openai?: OpenAiGlobals }).openai;
}

/**
 * Apply the host-reported theme. This overrides the prefers-color-scheme
 * fallback in base.css — the chat surface's theme, not the OS appearance,
 * is what the widget must match.
 */
function applyTheme(theme: unknown): void {
  if (theme !== "dark" && theme !== "light") return;
  document.documentElement.dataset.theme = theme;
}

/** Pull a theme string out of loosely-shaped host payloads. */
function themeOf(value: unknown): unknown {
  if (value == null || typeof value !== "object") return undefined;
  const obj = value as { theme?: unknown; hostContext?: { theme?: unknown } };
  return obj.theme ?? obj.hostContext?.theme;
}

/**
 * Boot the widget: call `render` with the tool's structuredContent as soon as
 * it is available, and again whenever the host updates it.
 */
export function boot(render: (output: unknown) => void): void {
  const host = openai();
  if (host) {
    applyTheme(host.theme);
    if (host.toolOutput != null) render(host.toolOutput);
    window.addEventListener("openai:set_globals", (event) => {
      const globals = (event as CustomEvent<{ globals?: OpenAiGlobals }>).detail?.globals;
      if (!globals) return;
      applyTheme(globals.theme);
      if (globals.toolOutput != null) render(globals.toolOutput);
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
  let lastHeight = 0;
  const reportSize = (force = false): void => {
    const height = Math.ceil(document.documentElement.scrollHeight);
    if (!force && height === lastHeight) return;
    lastHeight = height;
    post({ method: "ui/notifications/size-changed", params: { height } });
  };
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const data = event.data as { id?: number; result?: unknown; method?: string; params?: unknown } | undefined;
    if (!data) return;
    if (data.id === INIT_ID && data.result != null) {
      applyTheme(themeOf(data.result));
      post({ method: "ui/notifications/initialized", params: {} });
      // Hosts may drop size reports sent before the handshake completes (the
      // skeleton's first report), leaving a default-height iframe that scrolls.
      reportSize(true);
      const initial =
        extract((data.result as Record<string, unknown>).toolResult) ?? extract(data.result);
      if (initial != null) render(initial);
      return;
    }
    if (data.method === "ui/notifications/tool-result") {
      const output = extract(data.params);
      if (output != null) render(output);
      return;
    }
    // Theme changes arrive as host-context notifications.
    if (typeof data.method === "string" && data.method.startsWith("ui/notifications/")) {
      applyTheme(themeOf(data.params));
    }
  });
  // Report content height so hosts size the iframe to fit instead of leaving
  // blank space or clipping. ResizeObserver fires once on observe, covering
  // the initial size too.
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => reportSize()).observe(document.body);
  }
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
 * Set a rail's edge-fade mask from its scroll position, and enable/disable the
 * ‹ › nav buttons (railNavHtml) that share its parent. Buttons are hidden
 * entirely when everything fits.
 */
function syncRailFade(rail: HTMLElement): void {
  const max = rail.scrollWidth - rail.clientWidth;
  const left = max > 8 && rail.scrollLeft > 8;
  const right = max > 8 && rail.scrollLeft < max - 8;
  if (max <= 8) delete rail.dataset.fade;
  else rail.dataset.fade = left && right ? "lr" : left ? "l" : right ? "r" : "";
  rail.parentElement?.querySelectorAll<HTMLButtonElement>("[data-rail-nav]").forEach((button) => {
    button.hidden = max <= 8;
    button.disabled = button.dataset.railNav === "prev" ? !left : !right;
  });
}

/**
 * Keep `.rail` edge fades in sync. Call once at startup; refreshRails() must
 * be called after each render since innerHTML replaces the rail element.
 * Scroll doesn't bubble, so the listener runs in the capture phase.
 */
export function wireRails(root: HTMLElement): void {
  root.addEventListener(
    "scroll",
    (event) => {
      const target = event.target as HTMLElement;
      if (target.classList?.contains("rail")) syncRailFade(target);
    },
    true,
  );
  root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-rail-nav]");
    const rail = root.querySelector<HTMLElement>(".rail"); // one rail per widget
    if (!button || !rail) return;
    const step = rail.clientWidth * 0.8 * (button.dataset.railNav === "prev" ? -1 : 1);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: step, behavior: smooth ? "smooth" : "auto" });
  });
  window.addEventListener("resize", () => refreshRails(root));
}

export function refreshRails(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".rail").forEach(syncRailFade);
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
