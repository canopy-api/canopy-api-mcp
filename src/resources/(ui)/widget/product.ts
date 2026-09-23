import { type ResourceMetadata } from "xmcp";
import { widgetResourceMeta, widgetResourceResult } from "../../../lib/widget-meta";
import { html } from "../../../widgets/product";

export const metadata: ResourceMetadata = {
  name: "amazon-product-widget",
  title: "Amazon Product Card",
  description: "Product card showing image, title, rating, price, and highlights for an Amazon product.",
  mimeType: "text/html;profile=mcp-app",
  _meta: widgetResourceMeta("Product card showing image, title, rating, price, and highlights for an Amazon product."),
};

export default function productWidget() {
  return widgetResourceResult(html, "Product card showing image, title, rating, price, and highlights for an Amazon product.");
}
