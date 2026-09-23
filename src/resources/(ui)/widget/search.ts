import { type ResourceMetadata } from "xmcp";
import { widgetResourceMeta, widgetResourceResult } from "../../../lib/widget-meta";
import { html } from "../../../widgets/search";

export const metadata: ResourceMetadata = {
  name: "amazon-search-widget",
  title: "Amazon Search Results Carousel",
  description: "Horizontal carousel of Amazon product search results with images, ratings, and prices.",
  mimeType: "text/html;profile=mcp-app",
  _meta: widgetResourceMeta("Horizontal carousel of Amazon product search results with images, ratings, and prices."),
};

export default function searchWidget() {
  return widgetResourceResult(html, "Horizontal carousel of Amazon product search results with images, ratings, and prices.");
}
