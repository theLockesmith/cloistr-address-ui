/**
 * Source-level tests for the signer-resilience wiring in nip98.ts.
 *
 * The vitest environment is 'node' (no DOM), so these are NOT behavioural
 * component tests. They verify that createNip98Header routes the signEvent call
 * through withSignerRetry and propagates errors correctly.
 *
 * ASSERTION MODEL
 * - The test environment mocks @cloistr/ui so we can inspect withSignerRetry.
 * - "Routes through withSignerRetry" means: if withSignerRetry refuses to call
 *   the fn (e.g. it has exhausted retries and throws), createNip98Header
 *   propagates the rejection rather than calling signer.signEvent directly.
 * - "Transparent happy path" means: when withSignerRetry succeeds, the signed
 *   event is Base64-encoded and returned as expected.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Event as NostrEvent } from 'nostr-tools'

// Spy on withSignerRetry BEFORE importing the module under test so that the
// module-level import of withSignerRetry resolves to the mock.
const mockWithSignerRetry = vi.fn()

vi.mock('@cloistr/ui', () => ({
  withSignerRetry: (...args: Parameters<typeof mockWithSignerRetry>) =>
    mockWithSignerRetry(...args),
}))

// Import AFTER the mock is established.
const { createNip98Header } = await import('./nip98')

const FAKE_SIGNED_EVENT: NostrEvent = {
  id: 'abc123',
  pubkey: 'deadbeef',
  created_at: 1000000,
  kind: 27235,
  tags: [['u', 'https://example.com/api'], ['method', 'GET']],
  content: '',
  sig: 'fakesig',
}

function makeSigner() {
  return {
    getPublicKey: vi.fn().mockResolvedValue('deadbeef'),
    signEvent: vi.fn().mockResolvedValue(FAKE_SIGNED_EVENT),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createNip98Header', () => {
  it('calls withSignerRetry rather than signer.signEvent directly', async () => {
    const signer = makeSigner()
    // withSignerRetry is transparent: invokes the fn and returns its result
    mockWithSignerRetry.mockImplementation((fn: () => Promise<unknown>) => fn())

    await createNip98Header('https://example.com/api', 'GET', signer)

    expect(mockWithSignerRetry).toHaveBeenCalledOnce()
  })

  it('produces a valid Nostr Base64 header on success', async () => {
    const signer = makeSigner()
    mockWithSignerRetry.mockImplementation((fn: () => Promise<unknown>) => fn())

    const header = await createNip98Header('https://example.com/api', 'GET', signer)

    expect(header).toMatch(/^Nostr /)
    const b64 = header.slice('Nostr '.length)
    const decoded = JSON.parse(atob(b64))
    expect(decoded.kind).toBe(27235)
    expect(decoded.id).toBe('abc123')
  })

  it('propagates the error from withSignerRetry without swallowing it', async () => {
    const signer = makeSigner()
    const sentinelError = Object.assign(new Error('signer unavailable'), {
      code: 'NO_RELAYS',
      method: 'nip46',
    })
    // withSignerRetry exhausted retries and rethrows
    mockWithSignerRetry.mockRejectedValue(sentinelError)

    await expect(
      createNip98Header('https://example.com/api', 'POST', signer)
    ).rejects.toBe(sentinelError)
  })

  it('uppercases the HTTP method in the tag', async () => {
    const signer = makeSigner()
    mockWithSignerRetry.mockImplementation((fn: () => Promise<unknown>) => fn())

    await createNip98Header('https://example.com/api', 'post', signer)

    const callArg = signer.signEvent.mock.calls[0][0]
    const methodTag = callArg.tags.find((t: string[]) => t[0] === 'method')
    expect(methodTag?.[1]).toBe('POST')
  })
})
