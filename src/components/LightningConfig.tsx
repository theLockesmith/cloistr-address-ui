import { useState } from 'react'
import { isValidLightningAddress, isValidNWCConnectionURI } from '../lib/validators'
import type { LightningConfig as LightningConfigType } from '../lib/types'

interface LightningConfigProps {
  config: LightningConfigType | undefined
  onSave: (config: Partial<LightningConfigType>) => Promise<void>
}

type Mode = 'disabled' | 'proxy' | 'nwc'

function currentMode(config: LightningConfigType | undefined): Mode {
  return config?.mode === 'proxy' || config?.mode === 'nwc' ? config.mode : 'disabled'
}

export function LightningConfig({ config, onSave }: LightningConfigProps) {
  const [mode, setMode] = useState<Mode>(currentMode(config))
  const [proxyAddress, setProxyAddress] = useState(config?.proxy_address || '')
  // Never prefilled: the server does not return the connection string.
  const [nwcURI, setNwcURI] = useState('')
  const walletConnected = config?.mode === 'nwc' && !!config.nwc_configured
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    if (mode === 'proxy' && !proxyAddress.trim()) {
      setError('Please enter a Lightning Address')
      return
    }

    if (mode === 'proxy' && !isValidLightningAddress(proxyAddress.trim())) {
      setError('Invalid Lightning Address format (e.g., name@wallet.com)')
      return
    }

    if (mode === 'nwc' && !isValidNWCConnectionURI(nwcURI.trim())) {
      setError('Paste the connection string from your wallet. It starts with nostr+walletconnect://')
      return
    }

    setSaving(true)
    try {
      if (mode === 'nwc') {
        await onSave({ mode, nwc_connection_uri: nwcURI.trim() })
        setNwcURI('')
      } else {
        await onSave({
          mode: mode,
          proxy_address: mode === 'proxy' ? proxyAddress.trim() : undefined,
        })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = () => {
    // Choosing wallet connect only means something with a connection string:
    // a connected user keeps their wallet without pasting the secret again.
    if (mode === 'nwc') return nwcURI.trim() !== ''
    const currentAddr = config?.proxy_address || ''
    return mode !== currentMode(config) || proxyAddress !== currentAddr
  }

  return (
    <div className="lightning-config">
      <h3>Lightning Address Settings</h3>
      <p className="config-description">
        Configure how payments to your @cloistr.xyz Lightning Address are handled.
      </p>

      <div className="config-options">
        <label className="config-option">
          <input
            type="radio"
            name="lightning-mode"
            value="disabled"
            checked={mode === 'disabled'}
            onChange={() => setMode('disabled')}
          />
          <div className="option-content">
            <span className="option-title">Disabled</span>
            <span className="option-desc">Lightning Address not active</span>
          </div>
        </label>

        <label className="config-option">
          <input
            type="radio"
            name="lightning-mode"
            value="proxy"
            checked={mode === 'proxy'}
            onChange={() => setMode('proxy')}
          />
          <div className="option-content">
            <span className="option-title">Proxy to External Address</span>
            <span className="option-desc">Forward payments to another Lightning Address</span>
          </div>
        </label>

        <label className="config-option">
          <input
            type="radio"
            name="lightning-mode"
            value="nwc"
            checked={mode === 'nwc'}
            onChange={() => setMode('nwc')}
          />
          <div className="option-content">
            <span className="option-title">Nostr Wallet Connect</span>
            <span className="option-desc">Create invoices directly from your own wallet</span>
          </div>
        </label>
      </div>

      {mode === 'proxy' && (
        <div className="proxy-config">
          <label className="input-label">
            Forward payments to:
          </label>
          <input
            type="text"
            className="config-input"
            placeholder="you@getalby.com"
            value={proxyAddress}
            onChange={(e) => setProxyAddress(e.target.value)}
          />
          <p className="input-hint">
            Payments to your @cloistr.xyz address will be forwarded to this Lightning Address.
            You receive payments directly - we never hold your funds.
          </p>
        </div>
      )}

      {mode === 'nwc' && (
        <div className="proxy-config">
          {walletConnected && (
            <p className="input-hint">
              Wallet connected. Paste a new connection string only to switch wallets.
            </p>
          )}
          {walletConnected && (config?.nwc_error_count ?? 0) > 0 && (
            <div className="error-message">
              Your wallet has failed to create {config?.nwc_error_count} invoice(s) recently.
              Check that it is online, or connect it again.
            </div>
          )}
          <label className="input-label" htmlFor="nwc-connection-uri">
            Wallet connection string:
          </label>
          <input
            id="nwc-connection-uri"
            type="password"
            autoComplete="off"
            className="config-input"
            placeholder="nostr+walletconnect://..."
            value={nwcURI}
            onChange={(e) => setNwcURI(e.target.value)}
          />
          <p className="input-hint">
            Find this under Nostr Wallet Connect in your wallet (Alby, Mutiny, Coinos and others).
            It is stored encrypted, and payments go straight to your wallet - we never hold your funds.
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {success && (
        <div className="success-message">Settings saved successfully!</div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving || !hasChanges()}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
