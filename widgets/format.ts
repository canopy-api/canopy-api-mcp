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

/** 49,280 → "49.3K" for tight layouts (search cards, bestseller rows). */
export function compactNum(value: number | undefined): string {
  if (typeof value !== "number") return "";
  if (value < 10_000) return value.toLocaleString();
  if (value < 1_000_000) return `${(value / 1_000).toFixed(value < 100_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function priceText(price: Price | null | undefined): string {
  if (!price) return "";
  if (price.display) return price.display;
  if (typeof price.value !== "number") return "";
  return `${price.symbol ?? "$"}${price.value.toFixed(2)}`;
}

/** One row of five stars as inline SVG (identical rendering across host fonts). */
function starRow(): string {
  const star =
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">` +
    `<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.2l-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>`;
  return star.repeat(5);
}

/** Fractional star rating, e.g. 4.3 → 86%-wide colored overlay over grey stars. */
export function starsHtml(rating: number | undefined, ratingsTotal?: number, compact = false): string {
  if (typeof rating !== "number") return "";
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const total = compact ? compactNum(ratingsTotal) : num(ratingsTotal);
  const count = total ? ` <span class="muted small">(${total})</span>` : "";
  return (
    `<span class="stars" role="img" aria-label="${rating.toFixed(1)} out of 5 stars">` +
    `<span style="display:inline-flex" aria-hidden="true">${starRow()}</span>` +
    `<span class="fill" aria-hidden="true" style="width:${pct}%">${starRow()}</span>` +
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

/**
 * Amazon CDN image URLs accept size modifiers before the extension
 * (`…/images/I/<id>._AC_SX320_.jpg`). Request one at ~2× the displayed size so
 * thumbnails load fast and stay crisp on retina screens. Only rewrites bare
 * `…/images/I/<id>.<ext>` URLs; anything else is left untouched.
 */
function sizedUrl(url: string, displayPx?: number): string {
  if (!displayPx) return url;
  return url.replace(
    /^(https:\/\/[^/]+\/images\/I\/[^._]+)\.(jpg|jpeg|png|webp)$/i,
    `$1._AC_SX${displayPx * 2}_.$2`,
  );
}

export function imgHtml(url: string | undefined, alt: string | undefined, displayPx?: number): string {
  if (!url || !/^https:\/\//.test(url)) return "";
  return `<img src="${esc(sizedUrl(url, displayPx))}" alt="${esc(alt ?? "")}" loading="lazy">`;
}

/**
 * Amazon feature bullets usually start with a label ("Speedy 30W Charging: …",
 * often shouty ALL-CAPS). Render the label as a bold lead-in (sentence-cased
 * when all caps) and clamp each bullet to two lines.
 */
export function bulletHtml(text: string): string {
  const match = /^([^:.!?]{3,48}):\s*(.+)$/s.exec(text.trim());
  if (!match) return `<li><span class="clamp2">${esc(text)}</span></li>`;
  let label = match[1].trim();
  if (label === label.toUpperCase()) label = label.charAt(0) + label.slice(1).toLowerCase();
  return `<li><span class="clamp2"><span class="lead">${esc(label)}.</span> ${esc(match[2])}</span></li>`;
}

/**
 * Amazon's best seller pages cut titles at a fixed length, usually mid-word
 * ("…Travel Ess"). When a title hits that cap, drop the partial last word and
 * any dangling separators, then add an ellipsis.
 */
export function cappedTitle(title: string | undefined, cap = 120): string {
  const text = (title ?? "").trim();
  if (text.length < cap) return text;
  const cut = text.slice(0, text.lastIndexOf(" ")).replace(/[\s|,;:&/([\-–—]+$/, "");
  return cut ? `${cut}…` : text;
}

/** ‹ › buttons for a card rail; wired and kept in sync by wireRails(). */
export function railNavHtml(): string {
  const icon = (d: string) =>
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  return `<div class="rail-nav">
    <button type="button" data-rail-nav="prev" aria-label="Scroll left" hidden>${icon("M15 18l-6-6 6-6")}</button>
    <button type="button" data-rail-nav="next" aria-label="Scroll right" hidden>${icon("M9 18l6-6-6-6")}</button>
  </div>`;
}

export function emptyState(message: string): string {
  return `<div class="empty">${esc(message)}</div>`;
}

/**
 * Placeholder shown between widget load and the host delivering the tool
 * result (which can take a moment on the MCP Apps bridge).
 */
export function skeletonHtml(kind: "hero" | "rail" | "rows"): string {
  if (kind === "hero") {
    return `
      <div class="hero" aria-hidden="true">
        <div class="skel" style="flex:0 0 140px;height:140px"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <div class="skel" style="height:16px;width:85%"></div>
          <div class="skel" style="height:12px;width:40%"></div>
          <div class="skel" style="height:14px;width:55%"></div>
          <div class="skel" style="height:12px;width:95%"></div>
          <div class="skel" style="height:12px;width:90%"></div>
        </div>
      </div>`;
  }
  if (kind === "rail") {
    const card = `
      <div class="card" aria-hidden="true">
        <div class="skel" style="height:128px"></div>
        <div class="skel" style="height:12px;width:90%"></div>
        <div class="skel" style="height:12px;width:60%"></div>
        <div class="skel" style="height:14px;width:45%"></div>
      </div>`;
    return `<div class="rail">${card.repeat(4)}</div>`;
  }
  const row = `
    <div class="row" aria-hidden="true">
      <div class="skel" style="flex:0 0 56px;height:56px"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;justify-content:center">
        <div class="skel" style="height:12px;width:80%"></div>
        <div class="skel" style="height:12px;width:45%"></div>
      </div>
    </div>`;
  return `<div class="rows">${row.repeat(3)}</div>`;
}
