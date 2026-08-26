import { describe, it, expect } from 'vitest'
import { formatPrice, hasPrice, purchaseCtaSuffix, formatTier } from './pricing'

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

describe('formatTier', () => {
  it('turns the database id into something a person reads', () => {
    // The badge showed "50k sats (ultra_premium)".
    expect(formatTier('ultra_premium')).toBe('Ultra Premium')
  })

  it('handles single-word tiers', () => {
    expect(formatTier('standard')).toBe('Standard')
    expect(formatTier('short')).toBe('Short')
  })

  it('title-cases an unknown tier rather than hiding it', () => {
    // A new pricing tier should be visible the day it ships, not invisible
    // until someone notices the UI never rendered it.
    expect(formatTier('mega_ultra_rare')).toBe('Mega Ultra Rare')
  })

  it('normalises shouty or mixed input', () => {
    expect(formatTier('ULTRA_PREMIUM')).toBe('Ultra Premium')
  })

  it('survives separators and empty segments', () => {
    expect(formatTier('ultra-premium')).toBe('Ultra Premium')
    expect(formatTier('')).toBe('')
  })
})
