import { type ResourceMetadata } from "xmcp";
import { widgetResourceMeta, widgetResourceResult } from "../../../lib/widget-meta";
import { html } from "../../../widgets/deals";

export const metadata: ResourceMetadata = {
  name: "amazon-deals-widget",
  title: "Amazon Deals Grid",
  description: "Carousel of current Amazon deals with discount badges and prices.",
  mimeType: "text/html;profile=mcp-app",
  _meta: widgetResourceMeta("Carousel of current Amazon deals with discount badges and prices."),
};

export default function dealsWidget() {
  return widgetResourceResult(html, "Carousel of current Amazon deals with discount badges and prices.");
}
