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
 * True when the value contains a character no username may contain, whatever
 * its length. Lets the field say "not allowed" for a lone "!" instead of only
 * "at least 2 characters".
 */
export function hasDisallowedUsernameChars(value: string): boolean {
  return /[^a-z0-9_-]/.test(value)
}

/**
 * Normalizes username-field input before it is validated, checked, or shown
 * back to the user. Case-folds only.
 *
 * It used to also strip every character outside [a-z0-9_-] as the user
 * typed, so a paste of "bad name!" silently became "badname" before
 * isValidUsername ever saw it -- a different, often AVAILABLE string -- and
 * the field reported "Available!" for an input that was never actually
 * valid (ME-7). Keeping the disallowed characters in place means
 * isValidUsername(normalizeUsernameInput(raw)) correctly rejects it.
 */
export function normalizeUsernameInput(value: string): string {
  return value.toLowerCase()
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
