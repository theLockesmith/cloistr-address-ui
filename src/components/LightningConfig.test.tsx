// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { LightningConfig } from './LightningConfig'

/**
 * The backend has accepted mode "nwc" (NIP-47 Nostr Wallet Connect) since
 * Phase 4, but the settings panel offered only Disabled and Proxy. A user with
 * a wallet connected was shown as "Disabled", and nobody could connect one.
 */
const WALLET = 'a'.repeat(64)
const SECRET = 'b'.repeat(64)
const URI = `nostr+walletconnect://${WALLET}?relay=wss%3A%2F%2Frelay.example.com&secret=${SECRET}`

describe('LightningConfig wallet connect', () => {
  afterEach(cleanup)

  const save = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save settings/i }))
    })
  }

  it('offers a wallet connect option', () => {
    render(<LightningConfig config={undefined} onSave={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /wallet connect/i })).toBeTruthy()
  })

  it('shows a connected wallet as connected, not as disabled', () => {
    render(
      <LightningConfig
        config={{ mode: 'nwc', enabled: true, nwc_configured: true }}
        onSave={vi.fn()}
      />
    )
    expect((screen.getByRole('radio', { name: /wallet connect/i }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('radio', { name: /disabled/i }) as HTMLInputElement).checked).toBe(false)
    expect(screen.getByText(/wallet connected/i)).toBeTruthy()
  })

  it('sends the connection string when a wallet is connected', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<LightningConfig config={undefined} onSave={onSave} />)
    fireEvent.click(screen.getByRole('radio', { name: /wallet connect/i }))
    fireEvent.change(screen.getByLabelText(/connection string/i), { target: { value: ` ${URI} ` } })
    await save()
    expect(onSave).toHaveBeenCalledWith({ mode: 'nwc', nwc_connection_uri: URI })
  })

  it('hides the connection string, which carries the wallet secret', () => {
    render(<LightningConfig config={undefined} onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('radio', { name: /wallet connect/i }))
    expect((screen.getByLabelText(/connection string/i) as HTMLInputElement).type).toBe('password')
  })

  it('rejects a string that is not a wallet connect URI, without saving', async () => {
    const onSave = vi.fn()
    render(<LightningConfig config={undefined} onSave={onSave} />)
    fireEvent.click(screen.getByRole('radio', { name: /wallet connect/i }))
    fireEvent.change(screen.getByLabelText(/connection string/i), { target: { value: 'lnbc1xyz' } })
    await save()
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/nostr\+walletconnect:\/\//i)).toBeTruthy()
  })

  it('does not ask a connected user to resend the secret to keep the same wallet', () => {
    render(
      <LightningConfig
        config={{ mode: 'nwc', enabled: true, nwc_configured: true }}
        onSave={vi.fn()}
      />
    )
    expect((screen.getByRole('button', { name: /save settings/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('warns when the connected wallet has been failing', () => {
    render(
      <LightningConfig
        config={{ mode: 'nwc', enabled: true, nwc_configured: true, nwc_error_count: 3 }}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText(/failed/i)).toBeTruthy()
  })

  it('still saves a proxy address as before', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<LightningConfig config={undefined} onSave={onSave} />)
    fireEvent.click(screen.getByRole('radio', { name: /proxy/i }))
    fireEvent.change(screen.getByPlaceholderText('you@getalby.com'), { target: { value: 'me@getalby.com' } })
    await save()
    expect(onSave).toHaveBeenCalledWith({ mode: 'proxy', proxy_address: 'me@getalby.com' })
  })
})
