// Seller offers / Buy Box widget for get_amazon_product_offers.
import { boot, wireLinks } from "./bridge";
import { esc, priceText, priceHtml, emptyState, num, skeletonHtml, type Price } from "./format";

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
root.innerHTML = skeletonHtml("rows");

const DATE_RE = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*[.,]?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})\b/;

/** "Tuesday. September 29" → "Tue, Sep 29". */
function shortDate(text: string | undefined): string {
  const m = text ? DATE_RE.exec(text) : null;
  return m ? `${m[1]}, ${m[2]} ${m[3]}` : "";
}

/**
 * Amazon's scraped delivery copy repeats itself ("Tuesday, September 29" plus
 * "FREE delivery Tuesday. September 29 on orders shipped by Amazon over $35 Or
 * fastest delivery Monday. September 28. Order within 3 hrs 42 mins"). Reduce
 * it to "Free delivery Tue, Sep 29 · Fastest Mon, Sep 28"; fall back to the
 * raw text (clamped) when it doesn't match the usual shape.
 */
function deliveryLine(delivery: Offer["delivery"]): string {
  const raw = [priceText(delivery?.price), delivery?.comments].filter(Boolean).join(" ");
  if (!raw) return "";
  const [standard, fastest] = raw.split(/\bor fastest delivery\b/i);
  const date = shortDate(standard) || shortDate(delivery?.comments);
  const cost = /\bfree\b/i.test(standard)
    ? "Free delivery"
    : /\$\d/.test(standard)
      ? `${standard.match(/\$\d[\d,.]*/)![0]} delivery`
      : date ? "Delivery" : "";
  const minimum = standard.match(/over (\$\d[\d,.]*)/i);
  const parts = [
    [cost, date].filter(Boolean).join(" ") + (minimum ? ` on ${minimum[1]}+ orders` : ""),
    shortDate(fastest) ? `Fastest ${shortDate(fastest)}` : "",
  ].filter(Boolean);
  return parts.length && cost ? esc(parts.join(" · ")) : esc(raw.replace(/\s+/g, " "));
}

function offerRow(offer: Offer): string {
  const seller = offer.seller;
  const name = esc(seller?.name ?? "Unknown seller");
  const sellerName = seller?.link ? `<a href="${esc(seller.link)}" class="o-seller">${name}</a>` : `<span class="o-seller">${name}</span>`;
  const sellerStats =
    typeof seller?.ratingsPercentagePositive === "number"
      ? `<span class="small muted">${seller.ratingsPercentagePositive}% positive${
          typeof seller.ratingsTotal === "number" ? ` · ${num(seller.ratingsTotal)} ratings` : ""
        }</span>`
      : "";
  const chips: string[] = [];
  if (offer.buyboxWinner) chips.push(`<span class="chip buybox">Buy Box</span>`);
  if (offer.conditionIsNew === false) chips.push(`<span class="chip">Used</span>`);
  if (offer.isPrime) chips.push(`<span class="chip prime">✓ Prime</span>`);
  if (offer.delivery?.fulfilledByAmazon) chips.push(`<span class="chip">Fulfilled by Amazon</span>`);
  const delivery = deliveryLine(offer.delivery);
  return `
    <div class="row offer">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">${sellerName} ${sellerStats}</div>
        ${chips.length ? `<div style="display:flex;gap:5px;flex-wrap:wrap">${chips.join("")}</div>` : ""}
        ${delivery ? `<div class="small muted clamp2">${delivery}</div>` : ""}
      </div>
      <div style="flex:0 0 auto;text-align:right">${priceHtml(offer.price)}</div>
    </div>`;
}

function render(output: unknown): void {
  const offers = (output as OffersOutput)?.data?.amazonProduct?.offersPaginated?.offers ?? [];
  if (offers.length === 0) {
    root.innerHTML = emptyState("No offers found for this product.");
    return;
  }
  // Buy Box winner first, then cheapest first.
  const sorted = [...offers].sort(
    (a, b) =>
      Number(b.buyboxWinner ?? false) - Number(a.buyboxWinner ?? false) ||
      (a.price?.value ?? Infinity) - (b.price?.value ?? Infinity),
  );
  root.innerHTML = `
    <div class="header"><span class="h-title">Seller offers</span><span class="small muted">${offers.length} offer${
      offers.length === 1 ? "" : "s"
    }</span></div>
    <div class="rows">${sorted.map(offerRow).join("")}</div>`;
}

boot(render);
