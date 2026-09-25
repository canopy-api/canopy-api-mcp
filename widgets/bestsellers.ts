// Ranked best sellers widget for get_amazon_bestsellers.
import { boot, wireLinks } from "./bridge";
import { cappedTitle, esc, imgHtml, priceHtml, skeletonHtml, starsHtml, emptyState, type Price } from "./format";

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
root.innerHTML = skeletonHtml("rows");

// The whole row is the link (bigger hit target, row hover state).
function rankedRow(product: BestSeller, index: number): string {
  const rank = product.bestSellersRank ?? index + 1;
  const tag = product.url ? "a" : "div";
  const href = product.url ? ` href="${esc(product.url)}"` : "";
  return `
    <${tag} class="row ranked"${href}>
      <div class="rank${rank <= 3 ? " top" : ""}">${rank}</div>
      <div class="thumb" style="flex:0 0 56px;height:56px">
        ${imgHtml(product.mainImageUrl, product.title, 56)}
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
        <div class="r-title clamp2">${esc(cappedTitle(product.title))}</div>
        <div class="small">${starsHtml(product.rating, product.ratingsTotal, true)}</div>
      </div>
      <div class="r-price">${priceHtml(product.price)}</div>
    </${tag}>`;
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
