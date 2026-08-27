import { describe, it, expect } from 'vitest'
import { formatPrice, hasPrice, purchaseCtaSuffix, formatTier, formatTierLength, formatTierPrice, freeAllowanceNote } from './pricing'

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

// formatTierLength
// ---------------------------------------------------------------------------
// max_length is null for the open-ended tier. Interpolating it directly is how
// "6-undefined characters" reaches the signup page.

describe('formatTierLength', () => {
  it('renders an open-ended tier with a plus', () => {
    expect(formatTierLength(6, null)).toBe('6+ characters')
  })

  it('renders a single-length tier in the singular', () => {
    expect(formatTierLength(3, 3)).toBe('3 characters')
    expect(formatTierLength(1, 1)).toBe('1 character')
  })

  it('renders a range', () => {
    expect(formatTierLength(4, 5)).toBe('4-5 characters')
    expect(formatTierLength(1, 2)).toBe('1-2 characters')
  })
})

// formatTierPrice
// ---------------------------------------------------------------------------

describe('formatTierPrice', () => {
  // THE BUG, in one assertion. The hardcoded table said "1,000 sats" for a 6+
  // name; the catalog prices the first one at 0.
  it('renders zero as Free, not "0 sats"', () => {
    expect(formatTierPrice(0)).toBe('Free')
  })

  it('renders full digits rather than formatPrice shorthand', () => {
    // "50k sats" hides the gap between 1,000 and 10,000 on the one page where
    // someone is comparing tiers.
    expect(formatTierPrice(50000)).toBe('50,000 sats')
    expect(formatTierPrice(1000)).toBe('1,000 sats')
  })

  it('never renders a negative or non-finite price as a number', () => {
    expect(formatTierPrice(-1)).toBe('Unavailable')
    expect(formatTierPrice(NaN)).toBe('Unavailable')
  })
})

// freeAllowanceNote
// ---------------------------------------------------------------------------

describe('freeAllowanceNote', () => {
  it('explains the allowance when a tier is genuinely free', () => {
    const note = freeAllowanceNote([{ price_sats: 0 }, { price_sats: 5000 }], 1000)
    expect(note).toContain('1,000 sats')
    expect(note).toContain('first')
  })

  // The note must not outlive the rule it describes. If the free tier is ever
  // priced above zero, a stale sentence saying "your first is free" contradicts
  // the table directly above it.
  it('returns null when no tier is free', () => {
    expect(freeAllowanceNote([{ price_sats: 1000 }, { price_sats: 5000 }], 1000)).toBeNull()
  })

  it('returns null when there is no additional price to quote', () => {
    expect(freeAllowanceNote([{ price_sats: 0 }], 0)).toBeNull()
    expect(freeAllowanceNote([{ price_sats: 0 }], NaN)).toBeNull()
  })
})
