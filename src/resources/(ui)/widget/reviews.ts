import { type ResourceMetadata } from "xmcp";
import { widgetResourceMeta, widgetResourceResult } from "../../../lib/widget-meta";
import { html } from "../../../widgets/reviews";

export const metadata: ResourceMetadata = {
  name: "amazon-reviews-widget",
  title: "Amazon Top Reviews",
  description: "Top customer reviews for an Amazon product with star ratings and review photos.",
  mimeType: "text/html;profile=mcp-app",
  _meta: widgetResourceMeta("Top customer reviews for an Amazon product with star ratings and review photos."),
};

export default function reviewsWidget() {
  return widgetResourceResult(html, "Top customer reviews for an Amazon product with star ratings and review photos.");
}
