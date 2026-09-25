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
  const title = esc(product.title ?? "Amazon product");
  const titleHtml = product.url ? `<a href="${esc(product.url)}">${title}</a>` : title;

  root.innerHTML = `
    <div class="hero">
      <div class="thumb hero-img">${imgHtml(product.mainImageUrl, product.title, 140)}</div>
      <div class="hero-body">
        ${product.brand ? `<div class="eyebrow">${esc(product.brand)}</div>` : ""}
        <div class="hero-title clamp2">${titleHtml}</div>
        <div class="small">${starsHtml(product.rating, product.ratingsTotal)}</div>
        <div class="hero-price">
          ${priceHtml(product.price)}
          ${chips.join("")}
        </div>
        ${product.url ? `<div class="hero-cta"><a href="${esc(product.url)}" class="btn">View on Amazon →</a></div>` : ""}
      </div>
    </div>
    ${
      bullets
        ? `<div class="about">
            <div class="about-h">About this item</div>
            <ul class="bullets">${bullets}</ul>
          </div>`
        : ""
    }`;
}

boot(render);
