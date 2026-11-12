import { useState } from 'react'
import { nip19 } from 'nostr-tools'

interface AddressTransferProps {
  // username@domain, as shown on the dashboard
  address: string
  currentPubkey: string
  // Receives the new owner's lowercase hex pubkey.
  onTransfer: (newPubkey: string) => Promise<void>
}

type Parsed = { pubkey: string } | { error: string }

// The server checks only that the key is 64 characters, so anything that
// reaches it is taken as a key. A typo would give the name to a key nobody
// holds, so the form accepts only a real npub or real hex.
export function parsePubkeyInput(raw: string): Parsed {
  const value = raw.trim()
  if (/^nsec1/i.test(value)) {
    return { error: 'That is a secret key. Never share it: ask the new owner for their npub.' }
  }
  if (/^npub1/i.test(value)) {
    try {
      const decoded = nip19.decode(value.toLowerCase())
      if (decoded.type === 'npub') return { pubkey: decoded.data }
    } catch {
      // fall through to the generic error
    }
    return { error: 'That is not a valid public key. Paste an npub or a 64-character hex key.' }
  }
  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return { pubkey: value.toLowerCase() }
  }
  return { error: 'That is not a valid public key. Paste an npub or a 64-character hex key.' }
}

export function AddressTransfer({ address, currentPubkey, onTransfer }: AddressTransferProps) {
  const username = address.split('@')[0]
  const [input, setInput] = useState('')
  const [target, setTarget] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    setError(null)
    const parsed = parsePubkeyInput(input)
    if ('error' in parsed) {
      setError(parsed.error)
      return
    }
    if (parsed.pubkey === currentPubkey.toLowerCase()) {
      setError('That key is already yours.')
      return
    }
    setTarget(parsed.pubkey)
  }

  const handleCancel = () => {
    setTarget(null)
    setTyped('')
    setError(null)
  }

  const handleTransfer = async () => {
    if (!target || typed !== username) return
    setError(null)
    setTransferring(true)
    try {
      await onTransfer(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="lightning-config">
      <h3>Transfer Address</h3>
      <p className="config-description">
        Give {address} to another Nostr key. The new owner gets the name, its Lightning
        Address and email. You can transfer an address once every 7 days.
      </p>

      {!target && (
        <div className="proxy-config">
          <label className="input-label" htmlFor="transfer-new-owner">
            New owner (npub or hex public key):
          </label>
          <input
            id="transfer-new-owner"
            type="text"
            autoComplete="off"
            className="config-input"
            placeholder="npub1..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={handleContinue} disabled={!input.trim()}>
            Continue
          </button>
        </div>
      )}

      {target && (
        <div className="proxy-config">
          <p className="input-hint">
            {address} will belong to <code>{nip19.npubEncode(target)}</code>. Only that key
            can transfer it back.
          </p>
          <label className="input-label" htmlFor="transfer-confirm">
            Type {username} to confirm:
          </label>
          <input
            id="transfer-confirm"
            type="text"
            autoComplete="off"
            className="config-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleTransfer}
            disabled={transferring || typed !== username}
          >
            {transferring ? 'Transferring...' : `Transfer ${address}`}
          </button>
          <button className="btn btn-secondary" onClick={handleCancel} disabled={transferring}>
            Cancel
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  )
}
