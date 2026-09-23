import { type ResourceMetadata } from "xmcp";
import { widgetResourceMeta, widgetResourceResult } from "../../../lib/widget-meta";
import { html } from "../../../widgets/offers";

export const metadata: ResourceMetadata = {
  name: "amazon-offers-widget",
  title: "Amazon Offers Table",
  description: "List of seller offers for an Amazon product with the Buy Box winner highlighted.",
  mimeType: "text/html;profile=mcp-app",
  _meta: widgetResourceMeta("List of seller offers for an Amazon product with the Buy Box winner highlighted."),
};

export default function offersWidget() {
  return widgetResourceResult(html, "List of seller offers for an Amazon product with the Buy Box winner highlighted.");
}
