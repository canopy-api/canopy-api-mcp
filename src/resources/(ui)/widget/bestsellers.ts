import { type ResourceMetadata } from "xmcp";
import { widgetResourceMeta, widgetResourceResult } from "../../../lib/widget-meta";
import { html } from "../../../widgets/bestsellers";

export const metadata: ResourceMetadata = {
  name: "amazon-bestsellers-widget",
  title: "Amazon Best Sellers List",
  description: "Ranked list of Amazon best-selling products for a category.",
  mimeType: "text/html;profile=mcp-app",
  _meta: widgetResourceMeta("Ranked list of Amazon best-selling products for a category."),
};

export default function bestsellersWidget() {
  return widgetResourceResult(html, "Ranked list of Amazon best-selling products for a category.");
}
