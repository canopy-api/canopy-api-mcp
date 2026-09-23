// Product card widget for get_amazon_product.
import { boot, wireLinks } from "./bridge";
import { bulletHtml, couponText, esc, imgHtml, priceHtml, skeletonHtml, starsHtml, emptyState, type Price } from "./format";

interface Product {
  title?: string;
  subtitle?: string;
  brand?: string;
  url?: string;
  asin?: string;
  isPrime?: boolean;
  isInStock?: boolean;
  price?: Price | null;
  mainImageUrl?: string;
  rating?: number;
  ratingsTotal?: number;
  featureBullets?: string[];
  coupon?: { label?: string } | null;
  seller?: { name?: string };
}

const root = document.getElementById("root")!;
wireLinks(root);
root.innerHTML = skeletonHtml("hero");

function render(output: unknown): void {
  const product = (output as { data?: { amazonProduct?: Product } })?.data?.amazonProduct;
  if (!product) {
    root.innerHTML = emptyState("No product found.");
    return;
  }

  const chips: string[] = [];
  if (product.isPrime) chips.push(`<span class="chip prime">✓ Prime</span>`);
  if (product.isInStock === false) chips.push(`<span class="chip oos">Out of stock</span>`);
  const coupon = couponText(product.coupon?.label);
  if (coupon) chips.push(`<span class="chip coupon">${esc(coupon)}</span>`);

  const bullets = (product.featureBullets ?? []).slice(0, 3).map(bulletHtml).join("");

  const titleHtml = product.url
    ? `<a href="${esc(product.url)}" class="bold">${esc(product.title ?? "Amazon product")}</a>`
    : `<span class="bold">${esc(product.title ?? "Amazon product")}</span>`;

  root.innerHTML = `
    <div style="display:flex;gap:14px;padding:2px">
      <div class="thumb" style="flex:0 0 140px;height:160px;border-radius:10px">
        ${imgHtml(product.mainImageUrl, product.title, 160)}
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px">
        <div style="font-size:15px;line-height:1.35" class="clamp2">${titleHtml}</div>
        ${product.brand ? `<div class="small muted">by ${esc(product.brand)}</div>` : ""}
        <div>${starsHtml(product.rating, product.ratingsTotal)}</div>
        <div>${priceHtml(product.price)}</div>
        ${chips.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${chips.join("")}</div>` : ""}
        ${bullets ? `<ul class="small muted" style="margin:2px 0 0;padding-left:16px;display:flex;flex-direction:column;gap:3px">${bullets}</ul>` : ""}
        ${
          product.url
            ? `<div style="margin-top:8px"><a href="${esc(product.url)}" class="btn">View on Amazon →</a></div>`
            : ""
        }
      </div>
    </div>`;
}

boot(render);
