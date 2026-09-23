// Search results carousel widget for search_amazon_products.
import { boot, refreshRails, wireLinks, wireRails } from "./bridge";
import { couponText, esc, imgHtml, num, priceHtml, skeletonHtml, starsHtml, emptyState, type Price } from "./format";

interface SearchResult {
  title?: string;
  url?: string;
  asin?: string;
  price?: Price | null;
  mainImageUrl?: string;
  rating?: number;
  ratingsTotal?: number;
  isPrime?: boolean;
  sponsored?: boolean;
  coupon?: { label?: string } | null;
}

interface SearchOutput {
  data?: {
    amazonProductSearchResults?: {
      productResults?: {
        results?: SearchResult[];
        pageInfo?: { totalResults?: number; currentPage?: number };
      };
    };
  };
}

const root = document.getElementById("root")!;
wireLinks(root);
wireRails(root);
root.innerHTML = skeletonHtml("rail");

function card(result: SearchResult): string {
  const badges: string[] = [];
  if (result.isPrime) badges.push(`<span class="chip prime">✓ Prime</span>`);
  const coupon = couponText(result.coupon?.label);
  if (coupon) badges.push(`<span class="chip coupon">${esc(coupon)}</span>`);
  if (result.sponsored) badges.push(`<span class="chip">Sponsored</span>`);
  const title = result.url
    ? `<a href="${esc(result.url)}">${esc(result.title ?? "")}</a>`
    : esc(result.title ?? "");
  return `
    <div class="card">
      <div class="thumb">${imgHtml(result.mainImageUrl, result.title, 160)}</div>
      <div class="title clamp2">${title}</div>
      <div class="small" style="min-height:17px">${starsHtml(result.rating, result.ratingsTotal, true)}</div>
      <div style="min-height:23px">${priceHtml(result.price)}</div>
      ${badges.length ? `<div class="foot" style="flex-direction:row;flex-wrap:wrap;gap:4px">${badges.join("")}</div>` : ""}
    </div>`;
}

function render(output: unknown): void {
  const productResults = (output as SearchOutput)?.data?.amazonProductSearchResults?.productResults;
  const results = productResults?.results ?? [];
  if (results.length === 0) {
    root.innerHTML = emptyState("No products matched this search.");
    return;
  }
  const total = productResults?.pageInfo?.totalResults;
  const header =
    typeof total === "number"
      ? `<div class="header small muted">${num(total)} results</div>`
      : "";
  root.innerHTML = `${header}<div class="rail">${results.map(card).join("")}</div>`;
  refreshRails(root);
}

boot(render);
