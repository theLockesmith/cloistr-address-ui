// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { nip19, generateSecretKey, getPublicKey } from 'nostr-tools'
import { AddressTransfer } from './AddressTransfer'

/**
 * POST /api/v1/addresses/transfer has been live since Phase 3, but nothing in
 * the UI called it: moving an address to another key needed a hand-built
 * NIP-98 request. Transfer gives the name away, so the form has to be strict
 * about the key and make the user confirm the name.
 */
const ME = getPublicKey(generateSecretKey())
const TARGET_SK = generateSecretKey()
const TARGET = getPublicKey(TARGET_SK)

describe('AddressTransfer', () => {
  afterEach(cleanup)

  const setup = (onTransfer = vi.fn().mockResolvedValue(undefined)) => {
    render(<AddressTransfer address="alice@cloistr.xyz" currentPubkey={ME} onTransfer={onTransfer} />)
    return onTransfer
  }
  const enterKey = (value: string) => {
    fireEvent.change(screen.getByLabelText(/new owner/i), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
  }
  const confirmAndTransfer = async (typed = 'alice') => {
    fireEvent.change(screen.getByLabelText(/type alice to confirm/i), { target: { value: typed } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^transfer/i }))
    })
  }

  it('offers to transfer the address', () => {
    setup()
    expect(screen.getByRole('heading', { name: /transfer/i })).toBeTruthy()
  })

  it('accepts an npub and sends the hex key after confirmation', async () => {
    const onTransfer = setup()
    enterKey(nip19.npubEncode(TARGET))
    await confirmAndTransfer()
    expect(onTransfer).toHaveBeenCalledWith(TARGET)
  })

  it('accepts a hex key in any case and sends it lowercased', async () => {
    const onTransfer = setup()
    enterKey(TARGET.toUpperCase())
    await confirmAndTransfer()
    expect(onTransfer).toHaveBeenCalledWith(TARGET)
  })

  it('rejects 64 characters that are not hex: the server only checks the length', () => {
    const onTransfer = setup()
    enterKey('z'.repeat(64))
    expect(screen.getByText(/not a valid public key/i)).toBeTruthy()
    expect(screen.queryByLabelText(/type alice to confirm/i)).toBeNull()
    expect(onTransfer).not.toHaveBeenCalled()
  })

  it('refuses a secret key and never sends it', () => {
    const onTransfer = setup()
    enterKey(nip19.nsecEncode(TARGET_SK))
    expect(screen.getByText(/secret key/i)).toBeTruthy()
    expect(screen.queryByLabelText(/type alice to confirm/i)).toBeNull()
    expect(onTransfer).not.toHaveBeenCalled()
  })

  it('refuses a transfer to your own key', () => {
    setup()
    enterKey(nip19.npubEncode(ME))
    expect(screen.getByText(/already yours/i)).toBeTruthy()
  })

  it('does not transfer until the name is typed exactly', async () => {
    const onTransfer = setup()
    enterKey(nip19.npubEncode(TARGET))
    fireEvent.change(screen.getByLabelText(/type alice to confirm/i), { target: { value: 'alic' } })
    expect((screen.getByRole('button', { name: /^transfer/i }) as HTMLButtonElement).disabled).toBe(true)
    expect(onTransfer).not.toHaveBeenCalled()
  })

  it('shows why the server refused', async () => {
    setup(vi.fn().mockRejectedValue(new Error('You can transfer this address again after 2026-11-20.')))
    enterKey(nip19.npubEncode(TARGET))
    await confirmAndTransfer()
    expect(screen.getByText(/again after 2026-11-20/i)).toBeTruthy()
  })
})
