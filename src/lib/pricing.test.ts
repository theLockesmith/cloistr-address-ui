import { describe, it, expect } from 'vitest'
import { formatPrice, hasPrice, purchaseCtaSuffix } from './pricing'

describe('formatPrice', () => {
  it('calls zero Free, not "0 sats" and not a bare 0', () => {
    // The shipped bug: `{price_sats && <badge/>}` printed "Available! 0".
    expect(formatPrice(0)).toBe('Free')
  })

  it('formats small amounts in sats', () => {
    expect(formatPrice(1)).toBe('1 sats')
    expect(formatPrice(999)).toBe('999 sats')
  })

  it('formats thousands compactly', () => {
    expect(formatPrice(1000)).toBe('1k sats')
    expect(formatPrice(21000)).toBe('21k sats')
  })

  it('never renders a nonsense price as free or as a number', () => {
    expect(formatPrice(-1)).toBe('Unavailable')
    expect(formatPrice(Number.NaN)).toBe('Unavailable')
  })
})

describe('hasPrice', () => {
  it('accepts zero — free is a price', () => {
    expect(hasPrice(0)).toBe(true)
  })

  it('rejects a missing price, which must never render as Free', () => {
    expect(hasPrice(undefined)).toBe(false)
    expect(hasPrice(Number.NaN)).toBe(false)
  })
})

describe('purchaseCtaSuffix', () => {
  it('adds nothing for a free name — no bare 0 welded onto the address', () => {
    // Operator's screenshot: the button read "Get lockesmith@cloistr.xyz0".
    expect(purchaseCtaSuffix(0)).toBeNull()
  })

  it('names the price when there is one', () => {
    expect(purchaseCtaSuffix(5000)).toBe('for 5,000 sats')
  })

  it('adds nothing when the price is missing', () => {
    expect(purchaseCtaSuffix(undefined)).toBeNull()
  })
})
