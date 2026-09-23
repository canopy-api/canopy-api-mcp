// Seller offers / Buy Box widget for get_amazon_product_offers.
import { boot, wireLinks } from "./bridge";
import { esc, priceText, priceHtml, emptyState, num, type Price } from "./format";

interface Offer {
  price?: Price | null;
  conditionIsNew?: boolean;
  title?: string;
  isPrime?: boolean;
  buyboxWinner?: boolean;
  delivery?: {
    fulfilledByAmazon?: boolean;
    comments?: string;
    countdown?: string;
    price?: Price | null;
  } | null;
  seller?: {
    name?: string;
    link?: string;
    ratingsPercentagePositive?: number;
    ratingsTotal?: number;
  } | null;
}

interface OffersOutput {
  data?: { amazonProduct?: { offersPaginated?: { offers?: Offer[] } | null } };
}

const root = document.getElementById("root")!;
wireLinks(root);

function offerRow(offer: Offer): string {
  const seller = offer.seller;
  const sellerName = seller?.link
    ? `<a href="${esc(seller.link)}" class="bold">${esc(seller?.name ?? "Unknown seller")}</a>`
    : `<span class="bold">${esc(seller?.name ?? "Unknown seller")}</span>`;
  const sellerStats =
    typeof seller?.ratingsPercentagePositive === "number"
      ? `<span class="small muted">${seller.ratingsPercentagePositive}% positive${
          typeof seller.ratingsTotal === "number" ? ` · ${num(seller.ratingsTotal)} ratings` : ""
        }</span>`
      : "";
  const chips: string[] = [];
  if (offer.buyboxWinner) chips.push(`<span class="chip deal">Buy Box</span>`);
  chips.push(`<span class="chip">${offer.conditionIsNew === false ? "Used" : "New"}</span>`);
  if (offer.isPrime) chips.push(`<span class="chip prime">✓ Prime</span>`);
  if (offer.delivery?.fulfilledByAmazon) chips.push(`<span class="chip">Fulfilled by Amazon</span>`);
  const shipPrice = priceText(offer.delivery?.price);
  const delivery = [offer.delivery?.comments, shipPrice ? `Shipping ${shipPrice}` : ""]
    .filter(Boolean)
    .map((part) => esc(part))
    .join(" · ");
  return `
    <div class="row" style="align-items:flex-start">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">${sellerName} ${sellerStats}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">${chips.join("")}</div>
        ${delivery ? `<div class="small muted">${delivery}</div>` : ""}
      </div>
      <div style="text-align:right">${priceHtml(offer.price)}</div>
    </div>`;
}

function render(output: unknown): void {
  const offers = (output as OffersOutput)?.data?.amazonProduct?.offersPaginated?.offers ?? [];
  if (offers.length === 0) {
    root.innerHTML = emptyState("No offers found for this product.");
    return;
  }
  const sorted = [...offers].sort((a, b) => Number(b.buyboxWinner ?? false) - Number(a.buyboxWinner ?? false));
  root.innerHTML = `
    <div class="header"><span class="h-title">Seller offers</span><span class="small muted">${offers.length} offer${
      offers.length === 1 ? "" : "s"
    }</span></div>
    <div class="rows">${sorted.map(offerRow).join("")}</div>`;
}

boot(render);
