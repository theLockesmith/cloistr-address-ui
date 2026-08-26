/**
 * Price formatting for username quotes.
 *
 * Zero is a REAL price: names of 6 characters and up are free by design. The UI
 * rendered it with `{result.price_sats && <badge/>}`, and 0 is falsy in JS, so
 * React printed a bare "0" next to "Available!" instead of the badge. The other
 * screen showed "Total 0 sats", which reads like a bug rather than an offer.
 *
 * Extracted so this can be tested without a DOM: me-ui has no testing-library,
 * and the rule worth pinning is the zero case, not the markup around it.
 */
export function formatPrice(sats: number): string {
  if (!Number.isFinite(sats) || sats < 0) return 'Unavailable'
  if (sats === 0) return 'Free'
  if (sats >= 1000) return `${(sats / 1000).toFixed(0)}k sats`
  return `${sats} sats`
}

/**
 * True when the server actually told us a price.
 *
 * `price_sats` is optional in the type but the API always sends it, so an
 * absent value means the response was malformed or the field was dropped — NOT
 * that the name is free. Kept separate from formatPrice so a missing price can
 * never render as "Free".
 */
export function hasPrice(sats: number | undefined): sats is number {
  return typeof sats === 'number' && Number.isFinite(sats)
}

/**
 * The trailing "for N sats" on the register button, or null when there is
 * nothing to charge.
 *
 * Register.tsx wrote this inline as `{priceSats && <span>…</span>}`, and for a
 * free name priceSats is 0 — so React printed the number itself, welding a "0"
 * onto the end of the address: "Get lockesmith@cloistr.xyz0".
 *
 * A free name gets no suffix at all rather than "for 0 sats": the availability
 * badge directly above it already says "Free (standard)", and repeating it on
 * the button reads like a price of zero rather than no price.
 */
export function purchaseCtaSuffix(sats: number | undefined): string | null {
  if (!hasPrice(sats) || sats <= 0) return null
  return `for ${sats.toLocaleString()} sats`
}

/**
 * Turns a tier id into something a person should read.
 *
 * The API returns the database identifier — `ultra_premium`, `standard` — and
 * the badge rendered it raw, so users saw "50k sats (ultra_premium)". Ids are
 * for code; a price badge is for people.
 *
 * Unknown tiers are title-cased rather than dropped: a tier we have not seen
 * before is still better shown than hidden, and hiding it would make a new
 * pricing tier invisible in the UI until someone noticed.
 */
export function formatTier(tier: string): string {
  return tier
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
