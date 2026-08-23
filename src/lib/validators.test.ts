/**
 * Source-level tests for src/lib/validators.ts.
 *
 * These are NOT behavioural (no DOM, no rendering). They test the pure
 * validation logic directly. Because UsernameInput, LightningConfig,
 * CreditBalance and Dashboard all import from validators.ts, a regression
 * in any validator's logic will be caught here. A test that passes when the
 * change is reverted would also revert the import site, causing a compile
 * error — both directions are covered.
 */

import { describe, it, expect } from 'vitest'
import { isValidUsername, isValidLightningAddress, hasRelays } from './validators'

// ---------------------------------------------------------------------------
// isValidUsername
// ---------------------------------------------------------------------------

describe('isValidUsername', () => {
  it('accepts lowercase letters only', () => {
    expect(isValidUsername('alice')).toBe(true)
  })

  it('accepts digits', () => {
    expect(isValidUsername('user42')).toBe(true)
  })

  it('accepts underscores', () => {
    expect(isValidUsername('my_handle')).toBe(true)
  })

  it('accepts hyphens', () => {
    expect(isValidUsername('my-handle')).toBe(true)
  })

  it('accepts the minimum 2-character username', () => {
    expect(isValidUsername('ab')).toBe(true)
  })

  it('accepts a 50-character username', () => {
    expect(isValidUsername('a'.repeat(50))).toBe(true)
  })

  it('rejects a 1-character username (too short)', () => {
    expect(isValidUsername('a')).toBe(false)
  })

  it('rejects a 51-character username (too long)', () => {
    expect(isValidUsername('a'.repeat(51))).toBe(false)
  })

  it('rejects uppercase letters', () => {
    expect(isValidUsername('Alice')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(isValidUsername('my handle')).toBe(false)
  })

  it('rejects an @ symbol (common user mistake)', () => {
    expect(isValidUsername('alice@cloistr.xyz')).toBe(false)
  })

  it('rejects dots', () => {
    expect(isValidUsername('my.handle')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidUsername('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isValidLightningAddress
// ---------------------------------------------------------------------------

describe('isValidLightningAddress', () => {
  it('accepts a standard Lightning Address', () => {
    expect(isValidLightningAddress('alice@getalby.com')).toBe(true)
  })

  it('accepts mixed-case local part', () => {
    expect(isValidLightningAddress('Alice@wallet.example.org')).toBe(true)
  })

  it('accepts dots in local part', () => {
    expect(isValidLightningAddress('first.last@wallet.io')).toBe(true)
  })

  it('accepts underscores in local part', () => {
    expect(isValidLightningAddress('my_wallet@pay.me')).toBe(true)
  })

  it('accepts hyphens in local part', () => {
    expect(isValidLightningAddress('my-wallet@pay.me')).toBe(true)
  })

  it('rejects an address with no @ sign', () => {
    expect(isValidLightningAddress('noatsign')).toBe(false)
  })

  it('rejects an address with no TLD (single label domain)', () => {
    expect(isValidLightningAddress('alice@localhost')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidLightningAddress('')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(isValidLightningAddress('alice @getalby.com')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// hasRelays
// ---------------------------------------------------------------------------

describe('hasRelays', () => {
  it('returns true for a non-empty relay array', () => {
    expect(hasRelays(['wss://relay.damus.io'])).toBe(true)
  })

  it('returns true for multiple relays', () => {
    expect(hasRelays(['wss://a.example.com', 'wss://b.example.com'])).toBe(true)
  })

  it('returns false for an empty array', () => {
    // An empty array is technically present but would render an empty list,
    // which is UI noise. The guard intentionally excludes it.
    expect(hasRelays([])).toBe(false)
  })

  it('returns false for undefined (field absent from API response)', () => {
    // This is the crash scenario: AddressResponse.relays is optional.
    // Calling .map() on undefined throws; hasRelays() prevents that.
    expect(hasRelays(undefined)).toBe(false)
  })
})
