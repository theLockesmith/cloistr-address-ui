import { useState, useEffect, useCallback } from 'react'
import { useNostrAuth } from '@cloistr/ui/auth'
import { LoginPrompt, SignerRecovery } from '@cloistr/ui/components'
import { api } from '../lib/api'
import { hasRelays } from '../lib/validators'
import { LightningConfig, CreditBalance } from '../components'
import { useVisibilityRetry } from '../hooks/useVisibilityRetry'
import type { AddressResponse, CreditBalanceResponse } from '../lib/types'

export function Dashboard() {
  const { authState, signer } = useNostrAuth()

  const [address, setAddress] = useState<AddressResponse | null>(null)
  const [credits, setCredits] = useState<CreditBalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // Signer errors (from NIP-46/NIP-07 signing failures): shown via SignerRecovery.
  // Keeping the raw error object allows signerFailureMessage() to produce
  // accurate human-facing copy (relay unreachable vs. denied vs. timed out).
  const [signerError, setSignerError] = useState<unknown>(null)
  // Non-signing errors (API HTTP failures, network errors on the fetch itself):
  // shown as a simple string — these are not signer issues.
  const [apiError, setApiError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const loadData = useCallback(async () => {
    if (!authState.pubkey || !signer) {
      setLoading(false)
      return
    }

    setLoading(true)
    setSignerError(null)
    setApiError(null)

    try {
      api.setSigner(signer)

      const [addressRes, creditsRes] = await Promise.all([
        api.getMyAddress(),
        api.getCredits(),
      ])

      setAddress(addressRes)
      setCredits(creditsRes)
    } catch (err) {
      // Distinguish signing errors (AuthError subclasses have a .method property)
      // from plain API/network errors. Signing errors go to SignerRecovery; API
      // errors go to the generic string display. NEITHER path clears the session.
      const isSignerErr =
        typeof err === 'object' &&
        err !== null &&
        typeof (err as Record<string, unknown>).method === 'string' &&
        ['nip07', 'nip46'].includes((err as Record<string, unknown>).method as string)

      if (isSignerErr) {
        setSignerError(err)
      } else {
        setApiError(err instanceof Error ? err.message : 'Failed to load data')
      }
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [authState.pubkey, signer])

  const handleRetry = useCallback(async () => {
    setRetrying(true)
    await loadData()
  }, [loadData])

  const handleSaveLightning = async (config: any) => {
    if (!signer) return
    api.setSigner(signer)
    const updated = await api.updateLightningConfig(config)
    setAddress((prev) => prev ? { ...prev, lightning: updated } : null)
  }

  const handleWithdraw = async (amount: number, lightningAddress: string) => {
    if (!signer) return
    api.setSigner(signer)
    await api.withdrawCredits(amount, lightningAddress)
    // Reload credits after withdrawal
    const creditsRes = await api.getCredits()
    setCredits(creditsRes)
  }

  useEffect(() => {
    loadData()
  }, [authState.pubkey])

  // Part 4 – visibilitychange reconnect.
  //
  // @cloistr/auth reconnects the NIP-46 relay when the page becomes visible.
  // Once that relay reconnect completes, a retry of loadData() will succeed
  // where it previously hit NO_RELAYS/CONNECTION_FAILED. Enable the retry only
  // while there is a signing error worth recovering from automatically; disable
  // for terminal errors (user denied) to avoid hammering the signer.
  useVisibilityRetry(loadData, signerError !== null)

  return (
    <div className="page dashboard-page">
      <div className="dashboard-container">
        <h1>Dashboard</h1>

        {!authState.pubkey && (
          <LoginPrompt
            title="Dashboard"
            callToAction="Please sign in to view your dashboard."
          />
        )}

        {authState.pubkey && loading && (
            <div className="loading">Loading...</div>
          )}

          {/* Signing errors: use SignerRecovery so the user sees a recovery
              screen rather than a generic message, and cannot be confused into
              thinking they need to re-authenticate. The session is intact. */}
          {authState.pubkey && !loading && signerError && (
            <SignerRecovery
              error={signerError}
              onRetry={handleRetry}
              retrying={retrying}
              onGoBack={() => setSignerError(null)}
            />
          )}

          {/* Non-signing API errors: plain message with a retry button. */}
          {authState.pubkey && !loading && apiError && (
            <>
              <div className="error-message">{apiError}</div>
              <button className="btn btn-secondary" onClick={loadData}>
                Retry
              </button>
            </>
          )}

          {authState.pubkey && !loading && !signerError && !apiError && (
            address ? (
              <div className="dashboard-content">
                <section className="address-section">
                  <h2>Your Address</h2>
                  <div className="address-card">
                    <span className="address-value">
                      {address.username}@{address.domain}
                    </span>
                    <span className="address-badges">
                      <span className={`address-status ${address.active ? 'active' : 'inactive'}`}>
                        {address.active ? 'Active' : 'Inactive'}
                      </span>
                      {/* No lifetime/expiry badge here, deliberately.
                          One was rendered UNCONDITIONALLY on every address
                          card, telling every user their address is "Lifetime"
                          regardless of plan or expiry. AddressResponse carries
                          no expiry field at all, so the frontend cannot know
                          this — while the addresses table does have expires_at
                          and grace_period_ends, which makes the claim actively
                          wrong for anyone whose address DOES expire. On a paid
                          product that is a promise we might not keep.
                          Restore only when the API returns the expiry and the
                          badge can be rendered from real data. */}
                    </span>
                  </div>
                  <div className="address-pubkey">
                    <span className="pubkey-label">Linked to:</span>
                    <code className="pubkey-value">
                      {address.pubkey.slice(0, 16)}...{address.pubkey.slice(-16)}
                    </code>
                  </div>
                </section>

                <section className="lightning-section">
                  <LightningConfig
                    config={address.lightning}
                    onSave={handleSaveLightning}
                  />
                </section>

                {credits && (
                  <section className="credits-section">
                    <CreditBalance
                      balance={credits.balance_sats}
                      onWithdraw={handleWithdraw}
                    />
                  </section>
                )}

                {/*
                  `relays` is optional on the address payload -- an address with
                  no relay hints comes back without the field at all, not as an
                  empty array. Calling .map() on it unguarded threw
                  "TypeError: can't access property 'map', i.relays is undefined"
                  during render, which React escalates to unmounting the whole
                  tree: the entire dashboard went blank, not just this section.
                  hasRelays() from validators.ts guards this; Lookup.tsx mirrors
                  the same check inline.
                */}
                {hasRelays(address.relays) && (
                  <section className="relays-section">
                    <h3>Relay Hints</h3>
                    <p>These relays are included in your NIP-05 response:</p>
                    <ul className="relay-list">
                      {address.relays.map((relay, index) => (
                        <li key={index} className="relay-item">{relay}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ) : (
              <div className="no-address">
                <h2>No Address Found</h2>
                <p>You don't own a @cloistr.xyz address yet.</p>
                <a href="/" className="btn btn-primary">
                  Get Your Address
                </a>
              </div>
            )
        )}
      </div>
    </div>
  )
}
