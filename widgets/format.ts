// Rendering helpers shared by all widgets. Every dynamic string must go
// through esc() before being interpolated into HTML.

export interface Price {
  symbol?: string;
  value?: number;
  currency?: string;
  display?: string;
}

export function esc(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function num(value: number | undefined): string {
  return typeof value === "number" ? value.toLocaleString() : "";
}

export function priceText(price: Price | null | undefined): string {
  if (!price) return "";
  if (price.display) return price.display;
  if (typeof price.value !== "number") return "";
  return `${price.symbol ?? "$"}${price.value.toFixed(2)}`;
}

/** Fractional star rating, e.g. 4.3 → 86%-filled overlay of ★★★★★. */
export function starsHtml(rating: number | undefined, ratingsTotal?: number): string {
  if (typeof rating !== "number") return "";
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const count = typeof ratingsTotal === "number" ? ` <span class="muted small">(${num(ratingsTotal)})</span>` : "";
  return (
    `<span class="stars" aria-label="${rating.toFixed(1)} out of 5 stars">` +
    `<span aria-hidden="true">★★★★★</span>` +
    `<span class="fill" aria-hidden="true" style="width:${pct}%">★★★★★</span>` +
    `</span> <span class="small muted">${rating.toFixed(1)}</span>${count}`
  );
}

/** Price with optional struck-through list price. */
export function priceHtml(current: Price | null | undefined, was?: Price | null): string {
  const now = priceText(current);
  if (!now) return "";
  const strike = priceText(was);
  const strikeHtml = strike && strike !== now ? `<span class="strike">${esc(strike)}</span>` : "";
  return `<span class="price">${esc(now)}${strikeHtml}</span>`;
}

/**
 * Coupon labels are scraped from Amazon and can concatenate the visible and
 * screen-reader copies of the same text ("You pay $44.99You pay $44.99 …").
 * Collapse duplicated leading text and normalize whitespace.
 */
export function couponText(label: string | null | undefined): string {
  if (!label) return "";
  let text = String(label).replace(/\s+/g, " ").trim();
  let prev;
  do {
    prev = text;
    text = text.replace(/^(.+) ?\1/, "$1");
  } while (text !== prev);
  const suffix = text.match(/^(.*coupon.*?)\s+with coupon$/i);
  if (suffix) text = suffix[1];
  return text;
}

export function imgHtml(url: string | undefined, alt: string | undefined): string {
  if (!url || !/^https:\/\//.test(url)) return "";
  return `<img src="${esc(url)}" alt="${esc(alt ?? "")}" loading="lazy">`;
}

export function emptyState(message: string): string {
  return `<div class="empty">${esc(message)}</div>`;
}
