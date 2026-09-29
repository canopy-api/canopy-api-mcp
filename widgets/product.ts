// Product card widget for get_amazon_product.
import { boot, wireLinks } from "./bridge";
import { bulletHtml, couponText, esc, imgHtml, priceHtml, skeletonHtml, starsHtml, emptyState, failedLoad, type Price } from "./format";

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

const BULLETS_SHOWN = 4;

const root = document.getElementById("root")!;
wireLinks(root);
root.innerHTML = skeletonHtml("hero");

// Show all / fewer highlights (local toggle, no network needed).
root.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>("[data-expand]");
  const about = button?.closest(".about");
  if (!button || !about) return;
  const expanded = about.classList.toggle("expanded");
  button.textContent = expanded ? "Show less" : button.dataset.expand!;
  button.setAttribute("aria-expanded", String(expanded));
});

function render(output: unknown): void {
  if (failedLoad(output, "amazonProduct")) {
    root.innerHTML = emptyState("Couldn’t load this product from Amazon. Try again in a moment.");
    return;
  }
  const product = (output as { data?: { amazonProduct?: Product } })?.data?.amazonProduct;
  if (!product) {
    root.innerHTML = emptyState("No product found.");
    return;
  }

  const chips: string[] = [];
  if (product.isPrime) chips.push(`<span class="chip prime">✓ Prime</span>`);
  const coupon = couponText(product.coupon?.label);
  if (coupon) chips.push(`<span class="chip coupon">${esc(coupon)}</span>`);

  const availability: string[] = [];
  if (product.isInStock === false) availability.push(`<span class="oos-text">Out of stock</span>`);
  else if (product.isInStock) availability.push(`<span class="in-stock">In stock</span>`);
  if (product.seller?.name) availability.push(`Sold by ${esc(product.seller.name)}`);

  const allBullets = product.featureBullets ?? [];
  const bullets = allBullets.slice(0, 8).map(bulletHtml).join("");
  const hidden = Math.min(allBullets.length, 8) - BULLETS_SHOWN;
  const title = esc(product.title ?? "Amazon product");
  const titleHtml = product.url ? `<a href="${esc(product.url)}">${title}</a>` : title;
  const label = hidden > 0 ? `Show ${hidden} more` : "";

  root.innerHTML = `
    <div class="hero">
      <div class="thumb hero-img">${imgHtml(product.mainImageUrl, product.title, 132)}</div>
      <div class="hero-body">
        ${product.brand ? `<div class="eyebrow">${esc(product.brand)}</div>` : ""}
        <div class="hero-title clamp2">${titleHtml}</div>
        <div class="small">${starsHtml(product.rating, product.ratingsTotal)}</div>
        <div class="hero-price">
          ${priceHtml(product.price)}
          ${chips.join("")}
        </div>
        ${availability.length ? `<div class="small muted clamp1">${availability.join(" · ")}</div>` : ""}
        ${product.url ? `<div class="hero-cta"><a href="${esc(product.url)}" class="btn primary">View on Amazon<span aria-hidden="true">↗</span></a></div>` : ""}
      </div>
    </div>
    ${
      bullets
        ? `<div class="about">
            <div class="about-h">Highlights</div>
            <ul class="bullets">${bullets}</ul>
            ${label ? `<button class="more" type="button" data-expand="${label}" aria-expanded="false">${label}</button>` : ""}
          </div>`
        : ""
    }`;
}

boot(render);
