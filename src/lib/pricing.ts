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
