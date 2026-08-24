/**
 * Shared input validation helpers.
 *
 * Extracted here so they can be imported by both the components that use them
 * at runtime and the unit tests that verify their behaviour. Having the logic
 * in a single place means a test failure proves the production path is wrong,
 * not a copy of it.
 */

/**
 * Canonical username format rule: 2-50 characters, lowercase letters, digits,
 * underscores, and hyphens only.
 *
 * TODO: switch callers to @cloistr/ui isValid once it ships (the regex there
 * mirrors this one exactly — see the TODO in UsernameInput.tsx).
 */
export function isValidUsername(name: string): boolean {
  return /^[a-z0-9_-]{2,50}$/.test(name)
}

/**
 * Lightning Address format: local@domain.tld
 * Accepts letters, digits, dots, underscores, and hyphens in the local part.
 */
export function isValidLightningAddress(addr: string): boolean {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addr)
}

/**
 * Returns true when a relays array is present AND non-empty.
 * The guard is the canonical one used in Dashboard and Lookup: the field is
 * optional on AddressResponse, so calling .map() without this check crashes.
 */
export function hasRelays(relays: string[] | undefined): relays is string[] {
  return Array.isArray(relays) && relays.length > 0
}
