// Ranked best sellers widget for get_amazon_bestsellers.
import { boot, wireLinks } from "./bridge";
import { esc, imgHtml, priceHtml, starsHtml, emptyState, type Price } from "./format";

interface BestSeller {
  title?: string;
  url?: string;
  asin?: string;
  price?: Price;
  mainImageUrl?: string;
  rating?: number;
  ratingsTotal?: number;
  bestSellersRank?: number;
}

interface BestSellersOutput {
  data?: {
    amazonBestSellers?: {
      productResults?: { results?: BestSeller[] };
      categoryInfo?: { currentCategory?: { name?: string } };
    };
  };
}

const root = document.getElementById("root")!;
wireLinks(root);

function rankedRow(product: BestSeller, index: number): string {
  const rank = product.bestSellersRank ?? index + 1;
  const title = product.url
    ? `<a href="${esc(product.url)}">${esc(product.title ?? "")}</a>`
    : esc(product.title ?? "");
  return `
    <div class="row" style="align-items:center">
      <div class="bold muted" style="flex:0 0 26px;font-size:15px;text-align:center">${rank}</div>
      <div style="flex:0 0 56px;height:56px;border:1px solid var(--border);border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${imgHtml(product.mainImageUrl, product.title)}
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
        <div class="clamp2" style="font-size:13px">${title}</div>
        <div class="small">${starsHtml(product.rating, product.ratingsTotal)}</div>
      </div>
      <div style="text-align:right">${priceHtml(product.price)}</div>
    </div>`;
}

function render(output: unknown): void {
  const bestSellers = (output as BestSellersOutput)?.data?.amazonBestSellers;
  const results = bestSellers?.productResults?.results ?? [];
  if (results.length === 0) {
    root.innerHTML = emptyState("No best sellers found for this category.");
    return;
  }
  const category = bestSellers?.categoryInfo?.currentCategory?.name;
  root.innerHTML = `
    <div class="header">
      <span class="h-title">Best sellers${category ? ` · ${esc(category)}` : ""}</span>
    </div>
    <div class="rows">${results.slice(0, 10).map(rankedRow).join("")}</div>`;
}

boot(render);
