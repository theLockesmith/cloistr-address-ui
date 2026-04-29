import { useState, useEffect } from 'react'
import { useAuth } from '../lib/nostr'
import { api } from '../lib/api'
import { LoginButton, LightningConfig, CreditBalance } from '../components'
import type { AddressResponse, CreditBalanceResponse } from '../lib/types'

export function Dashboard() {
  const auth = useAuth()

  const [address, setAddress] = useState<AddressResponse | null>(null)
  const [credits, setCredits] = useState<CreditBalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!auth.state.pubkey || !auth.signer) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      api.setSigner(auth.signer)

      const [addressRes, creditsRes] = await Promise.all([
        api.getMyAddress(),
        api.getCredits(),
      ])

      setAddress(addressRes)
      setCredits(creditsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLightning = async (config: any) => {
    api.setSigner(auth.signer!)
    const updated = await api.updateLightningConfig(config)
    setAddress((prev) => prev ? { ...prev, lightning: updated } : null)
  }

  const handleWithdraw = async (amount: number, lightningAddress: string) => {
    api.setSigner(auth.signer!)
    await api.withdrawCredits(amount, lightningAddress)
    // Reload credits after withdrawal
    const creditsRes = await api.getCredits()
    setCredits(creditsRes)
  }

  useEffect(() => {
    loadData()
  }, [auth.state.pubkey])

  return (
    <div className="page dashboard-page">
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo">cloistr</a>
          <nav className="nav">
            <a href="/" className="nav-link">Home</a>
            <LoginButton />
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="dashboard-container">
          <h1>Dashboard</h1>

          {!auth.state.pubkey && (
            <div className="login-required">
              <p>Please login to view your dashboard.</p>
              <LoginButton />
            </div>
          )}

          {auth.state.pubkey && loading && (
            <div className="loading">Loading...</div>
          )}

          {auth.state.pubkey && error && (
            <>
              <div className="error-message">{error}</div>
              <button className="btn btn-secondary" onClick={loadData}>
                Retry
              </button>
            </>
          )}

          {auth.state.pubkey && !loading && !error && (
            address ? (
              <div className="dashboard-content">
                <section className="address-section">
                  <h2>Your Address</h2>
                  <div className="address-card">
                    <span className="address-value">
                      {address.username}@{address.domain}
                    </span>
                    <span className={`address-status ${address.active ? 'active' : 'inactive'}`}>
                      {address.active ? 'Active' : 'Inactive'}
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

                <section className="relays-section">
                  <h3>Relay Hints</h3>
                  <p>These relays are included in your NIP-05 response:</p>
                  <ul className="relay-list">
                    {address.relays.map((relay, index) => (
                      <li key={index} className="relay-item">{relay}</li>
                    ))}
                  </ul>
                </section>
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
      </main>
    </div>
  )
}
