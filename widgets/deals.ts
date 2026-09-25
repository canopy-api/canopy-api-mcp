// Deals grid widget for get_amazon_deals.
import { boot, refreshRails, wireLinks, wireRails } from "./bridge";
import { esc, imgHtml, priceHtml, railNavHtml, skeletonHtml, emptyState, type Price } from "./format";

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
wireRails(root);
root.innerHTML = skeletonHtml("rail");

function dealCard(deal: Deal): string {
  const url = deal.dealUrl || deal.url;
  const title = url ? `<a href="${esc(url)}">${esc(deal.title ?? "")}</a>` : esc(deal.title ?? "");
  const current = deal.dealCurrentPrice ?? deal.dealPrice ?? deal.price;
  const was = deal.dealListPrice ?? deal.recommendedRetailPrice;
  const off =
    typeof deal.dealPercentOff === "number" && deal.dealPercentOff > 0
      ? `<span class="chip deal on-img">-${Math.round(deal.dealPercentOff)}%</span>`
      : "";
  const kind = deal.dealIsLightningDeal
    ? `<div class="deal-kind hot">⚡ Lightning deal</div>`
    : deal.dealBadge
      ? `<div class="deal-kind">${esc(deal.dealBadge)}</div>`
      : "";
  return `
    <div class="card">
      <div class="thumb">${imgHtml(deal.mainImageUrl, deal.title, 160)}${off}</div>
      ${kind}
      <div class="title clamp2">${title}</div>
      <div class="foot">${priceHtml(current, was)}</div>
    </div>`;
}

function render(output: unknown): void {
  const deals = (output as DealsOutput)?.data?.amazonDeals?.productResults?.results ?? [];
  if (deals.length === 0) {
    root.innerHTML = emptyState("No deals available right now.");
    return;
  }
  root.innerHTML = `
    <div class="header"><span class="h-title">Today’s deals</span>${railNavHtml()}</div>
    <div class="rail">${deals.map(dealCard).join("")}</div>`;
  refreshRails(root);
}

boot(render);
