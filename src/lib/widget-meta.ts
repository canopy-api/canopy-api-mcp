// Shared _meta builders for the ChatGPT / MCP Apps widget wiring.
//
// Tool metadata uses the flat `ui/resourceUri` key (the MCP Apps wire format)
// plus the ChatGPT-specific `openai/outputTemplate` alias. It deliberately
// avoids xmcp's nested `_meta.ui` object: that triggers xmcp's built-in widget
// mode, which auto-registers a `ui://app/<tool>.html` resource backed by the
// tool handler itself — reading it would invoke the Canopy client without an
// API key and throw.

/** Amazon image CDNs the widget iframes must be allowed to load images from. */
export const WIDGET_IMAGE_DOMAINS = [
  "https://m.media-amazon.com",
  "https://images-na.ssl-images-amazon.com",
  "https://images-eu.ssl-images-amazon.com",
  "https://images-fe.ssl-images-amazon.com",
];

/** `_meta` for a tool that renders through the widget resource `ui://widget/<widget>.html`. */
export function widgetToolMeta(widget: string, invoking: string, invoked: string) {
  const uri = `ui://widget/${widget}.html`;
  return {
    "ui/resourceUri": uri,
    "openai/outputTemplate": uri,
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

/**
 * Full resources/read result for a widget document. Returned (rather than a
 * bare string) so the contents carry the mcp-app mimeType and CSP `_meta` —
 * xmcp wraps plain string returns without either.
 */
export function widgetResourceResult(html: string, description: string) {
  return {
    contents: [
      {
        mimeType: "text/html;profile=mcp-app",
        text: html,
        _meta: widgetResourceMeta(description),
      },
    ],
  };
}

/** `_meta` for a widget resource: CSP (image CDNs, no network calls) in both spellings. */
export function widgetResourceMeta(description: string) {
  return {
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: [],
        resourceDomains: WIDGET_IMAGE_DOMAINS,
      },
    },
    "openai/widgetDescription": description,
    "openai/widgetPrefersBorder": true,
    "openai/widgetCSP": {
      connect_domains: [],
      resource_domains: WIDGET_IMAGE_DOMAINS,
    },
  };
}
