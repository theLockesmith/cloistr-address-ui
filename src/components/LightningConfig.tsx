import { useState } from 'react'
import type { LightningConfig as LightningConfigType } from '../lib/types'

interface LightningConfigProps {
  config: LightningConfigType | undefined
  onSave: (config: Partial<LightningConfigType>) => Promise<void>
}

export function LightningConfig({ config, onSave }: LightningConfigProps) {
  const [mode, setMode] = useState<'disabled' | 'proxy'>(config?.mode === 'proxy' ? 'proxy' : 'disabled')
  const [proxyAddress, setProxyAddress] = useState(config?.proxy_address || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validate Lightning Address format
  const isValidLightningAddress = (addr: string) => {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addr)
  }

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

    setSaving(true)
    try {
      await onSave({
        mode: mode,
        proxy_address: mode === 'proxy' ? proxyAddress.trim() : undefined,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = () => {
    const currentMode = config?.mode === 'proxy' ? 'proxy' : 'disabled'
    const currentAddr = config?.proxy_address || ''
    return mode !== currentMode || proxyAddress !== currentAddr
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
