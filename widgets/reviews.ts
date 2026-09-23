// Top reviews widget for get_amazon_product_top_reviews.
import { boot, wireLinks } from "./bridge";
import { esc, num, starsHtml, imgHtml, emptyState } from "./format";

interface Review {
  title?: string;
  body?: string;
  rating?: number;
  helpfulVotes?: number;
  verifiedPurchase?: boolean;
  reviewer?: { name?: string };
  imageUrls?: string[];
}

interface ReviewsOutput {
  data?: { amazonProduct?: { topReviews?: Review[] } };
}

const root = document.getElementById("root")!;
wireLinks(root);

function reviewRow(review: Review): string {
  const meta: string[] = [];
  if (review.reviewer?.name) meta.push(esc(review.reviewer.name));
  if (review.verifiedPurchase) meta.push(`<span style="color:#1d7a3e">Verified purchase</span>`);
  if (typeof review.helpfulVotes === "number" && review.helpfulVotes > 0) {
    meta.push(`${num(review.helpfulVotes)} found helpful`);
  }
  const images = (review.imageUrls ?? [])
    .slice(0, 4)
    .map(
      (url) =>
        `<span style="width:48px;height:48px;border-radius:6px;overflow:hidden;border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;background:#fff">${imgHtml(url, review.title)}</span>`,
    )
    .join("");
  return `
    <div class="row" style="flex-direction:column;gap:4px">
      <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
        ${starsHtml(review.rating)}
        ${review.title ? `<span class="bold">${esc(review.title)}</span>` : ""}
      </div>
      ${review.body ? `<div class="clamp3 small" style="font-size:13px">${esc(review.body)}</div>` : ""}
      ${images ? `<div style="display:flex;gap:6px">${images}</div>` : ""}
      ${meta.length ? `<div class="small muted">${meta.join(" · ")}</div>` : ""}
    </div>`;
}

function render(output: unknown): void {
  const reviews = (output as ReviewsOutput)?.data?.amazonProduct?.topReviews ?? [];
  if (reviews.length === 0) {
    root.innerHTML = emptyState("No reviews found for this product.");
    return;
  }
  const average =
    reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
    (reviews.filter((review) => typeof review.rating === "number").length || 1);
  root.innerHTML = `
    <div class="header">
      <span class="h-title">Top reviews</span>
      <span class="small muted">${reviews.length} shown · avg ${average.toFixed(1)}★</span>
    </div>
    <div class="rows">${reviews.map(reviewRow).join("")}</div>`;
}

boot(render);
