// Product card widget for get_amazon_product.
import { boot, wireLinks } from "./bridge";
import { couponText, esc, imgHtml, priceHtml, starsHtml, emptyState, type Price } from "./format";

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

function render(output: unknown): void {
  const product = (output as { data?: { amazonProduct?: Product } })?.data?.amazonProduct;
  if (!product) {
    root.innerHTML = emptyState("No product found.");
    return;
  }

  const chips: string[] = [];
  if (product.isPrime) chips.push(`<span class="chip prime">✓ Prime</span>`);
  if (product.isInStock === false) chips.push(`<span class="chip">Out of stock</span>`);
  const coupon = couponText(product.coupon?.label);
  if (coupon) chips.push(`<span class="chip coupon">${esc(coupon)}</span>`);

  const bullets = (product.featureBullets ?? [])
    .slice(0, 3)
    .map((b) => `<li>${esc(b)}</li>`)
    .join("");

  const titleHtml = product.url
    ? `<a href="${esc(product.url)}" class="bold">${esc(product.title ?? "Amazon product")}</a>`
    : `<span class="bold">${esc(product.title ?? "Amazon product")}</span>`;

  root.innerHTML = `
    <div style="display:flex;gap:14px;padding:2px">
      <div class="thumb" style="flex:0 0 140px;height:150px;border:1px solid var(--border);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${imgHtml(product.mainImageUrl, product.title)}
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px">
        <div style="font-size:15px;line-height:1.35" class="clamp2">${titleHtml}</div>
        ${product.brand ? `<div class="small muted">by ${esc(product.brand)}</div>` : ""}
        <div>${starsHtml(product.rating, product.ratingsTotal)}</div>
        <div>${priceHtml(product.price)}</div>
        ${chips.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${chips.join("")}</div>` : ""}
        ${bullets ? `<ul class="small muted" style="margin:2px 0 0;padding-left:16px">${bullets}</ul>` : ""}
        ${
          product.url
            ? `<div class="small" style="margin-top:auto"><a href="${esc(product.url)}">View on Amazon →</a></div>`
            : ""
        }
      </div>
    </div>`;
}

boot(render);
