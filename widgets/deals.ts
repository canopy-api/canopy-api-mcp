// Deals grid widget for get_amazon_deals.
import { boot, wireLinks } from "./bridge";
import { esc, imgHtml, priceHtml, emptyState, type Price } from "./format";

interface Deal {
  title?: string;
  url?: string;
  dealUrl?: string;
  price?: Price;
  recommendedRetailPrice?: Price;
  mainImageUrl?: string;
  dealPrice?: Price;
  dealCurrentPrice?: Price;
  dealListPrice?: Price;
  dealPercentOff?: number;
  dealBadge?: string;
  dealIsLightningDeal?: boolean;
}

interface DealsOutput {
  data?: { amazonDeals?: { productResults?: { results?: Deal[] } } };
}

const root = document.getElementById("root")!;
wireLinks(root);

function dealCard(deal: Deal): string {
  const url = deal.dealUrl || deal.url;
  const title = url ? `<a href="${esc(url)}">${esc(deal.title ?? "")}</a>` : esc(deal.title ?? "");
  const current = deal.dealCurrentPrice ?? deal.dealPrice ?? deal.price;
  const was = deal.dealListPrice ?? deal.recommendedRetailPrice;
  const badges: string[] = [];
  if (typeof deal.dealPercentOff === "number" && deal.dealPercentOff > 0) {
    badges.push(`<span class="chip deal">-${Math.round(deal.dealPercentOff)}%</span>`);
  }
  if (deal.dealIsLightningDeal) badges.push(`<span class="chip">⚡ Lightning</span>`);
  else if (deal.dealBadge) badges.push(`<span class="chip">${esc(deal.dealBadge)}</span>`);
  return `
    <div class="card">
      <div class="thumb">${imgHtml(deal.mainImageUrl, deal.title)}</div>
      ${badges.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${badges.join("")}</div>` : ""}
      <div class="title clamp2">${title}</div>
      <div>${priceHtml(current, was)}</div>
    </div>`;
}

function render(output: unknown): void {
  const deals = (output as DealsOutput)?.data?.amazonDeals?.productResults?.results ?? [];
  if (deals.length === 0) {
    root.innerHTML = emptyState("No deals available right now.");
    return;
  }
  root.innerHTML = `
    <div class="header"><span class="h-title">Today’s deals</span></div>
    <div class="rail">${deals.map(dealCard).join("")}</div>`;
}

boot(render);
