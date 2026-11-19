// Host bridge shared by all widgets. Supports the ChatGPT Apps runtime
// (window.openai globals) and falls back to the open MCP Apps JSON-RPC
// postMessage bridge for other hosts.

import { setLocale } from "./format";

type OpenAiGlobals = {
  toolOutput?: unknown;
  theme?: string;
  locale?: string;
  safeArea?: { insets?: unknown };
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

/** Send a JSON-RPC message to the MCP Apps host (the parent frame). */
function post(msg: Record<string, unknown>): void {
  window.parent.postMessage({ jsonrpc: "2.0", ...msg }, "*");
}

const INIT_ID = 1;
let nextRequestId = INIT_ID + 1;

/**
 * True once an MCP Apps host has advertised `hostCapabilities.openLinks` in
 * its `ui/initialize` result, i.e. it accepts `ui/open-link` requests.
 */
let hostOpensLinks = false;

/** The parts of the MCP Apps `HostContext` the widgets use. All optional. */
type HostContext = {
  theme?: unknown;
  styles?: { variables?: unknown; css?: { fonts?: unknown } };
  locale?: unknown;
  safeAreaInsets?: unknown;
};

/**
 * Pull the host context out of a host payload: the `ui/initialize` result
 * nests it under `hostContext`, while `host-context-changed` params are a
 * partial context themselves.
 */
function contextOf(value: unknown): HostContext {
  if (value == null || typeof value !== "object") return {};
  const obj = value as HostContext & { hostContext?: HostContext };
  return obj.hostContext && typeof obj.hostContext === "object" ? obj.hostContext : obj;
}

/**
 * Apply the host's standardized style variables (`--color-text-primary`,
 * `--font-sans`, …) to the document root. base.css reads them with the built-in
 * palette as the fallback, so a host that sends none changes nothing.
 */
function applyStyleVariables(variables: unknown): void {
  if (variables == null || typeof variables !== "object") return;
  for (const [name, value] of Object.entries(variables)) {
    if (typeof value === "string" && /^--[a-z0-9-]+$/.test(name)) {
      document.documentElement.style.setProperty(name, value);
    }
  }
}

/** Install the host's font CSS (`@font-face` / `@import` rules) so `--font-sans` resolves. */
function applyFonts(css: unknown): void {
  if (typeof css !== "string" || !css) return;
  let style = document.head.querySelector<HTMLStyleElement>("style[data-host-fonts]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-host-fonts", "");
    document.head.appendChild(style);
  }
  style.textContent = css;
}

/** Expose safe-area insets (pixels) as `--safe-*` variables; base.css pads #root with them. */
function applySafeArea(insets: unknown): void {
  if (insets == null || typeof insets !== "object") return;
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const px = (insets as Record<string, unknown>)[side];
    if (typeof px === "number" && px >= 0) {
      document.documentElement.style.setProperty(`--safe-${side}`, `${px}px`);
    }
  }
}

/**
 * Apply a (possibly partial) host context: theme, style variables, fonts,
 * locale and safe-area insets. Fields the host left out are left as they are.
 */
function applyHostContext(context: HostContext): void {
  applyTheme(context.theme);
  applyStyleVariables(context.styles?.variables);
  applyFonts(context.styles?.css?.fonts);
  applySafeArea(context.safeAreaInsets);
  if (typeof context.locale === "string") {
    setLocale(context.locale);
    document.documentElement.lang = context.locale;
  }
}

/** The ChatGPT globals that correspond to host-context fields. */
function openaiContext(globals: OpenAiGlobals): HostContext {
  return { theme: globals.theme, locale: globals.locale, safeAreaInsets: globals.safeArea?.insets };
}

/**
 * Boot the widget: call `renderOutput` once with the tool's structuredContent
 * as soon as it is available.
 */
export function boot(renderOutput: (output: unknown) => void): void {
  // Each widget instance belongs to exactly one tool call, so render only the
  // first result delivered. ChatGPT can broadcast a later call's toolOutput
  // (e.g. a second get_amazon_deals in the same turn) to earlier widgets via
  // openai:set_globals, which made cards pop into an already-rendered rail.
  let rendered = false;
  const render = (output: unknown): void => {
    if (rendered) return;
    rendered = true;
    renderOutput(output);
  };
  const host = openai();
  if (host) {
    applyHostContext(openaiContext(host));
    if (host.toolOutput != null) render(host.toolOutput);
    window.addEventListener("openai:set_globals", (event) => {
      const globals = (event as CustomEvent<{ globals?: OpenAiGlobals }>).detail?.globals;
      if (!globals) return;
      applyHostContext(openaiContext(globals));
      if (globals.toolOutput != null) render(globals.toolOutput);
    });
    return;
  }

  // MCP Apps standard bridge (JSON-RPC over postMessage with the parent frame).
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
      applyHostContext(contextOf(data.result));
      const capabilities = (data.result as { hostCapabilities?: { openLinks?: unknown } }).hostCapabilities;
      hostOpensLinks = capabilities?.openLinks != null;
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
    // Later changes (theme switch, new style variables) arrive as a partial context.
    if (data.method === "ui/notifications/host-context-changed") {
      applyHostContext(contextOf(data.params));
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

/**
 * Open an external URL through the host when possible: ChatGPT's
 * `openExternal`, or an MCP Apps `ui/open-link` request when the host
 * advertised support for it. `window.open` is only the last resort — it
 * depends on the host's iframe sandbox allowing popups.
 */
export function openLink(url: string): void {
  const host = openai();
  if (host?.openExternal) {
    host.openExternal({ href: url });
    return;
  }
  if (hostOpensLinks) {
    // The host may refuse (user denial, policy) with a JSON-RPC error. That
    // is its decision, so the reply is not awaited and there is no fallback.
    post({ id: nextRequestId++, method: "ui/open-link", params: { url } });
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
