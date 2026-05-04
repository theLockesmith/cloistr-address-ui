import { useNostrAuth } from '@cloistr/ui/auth'

export function Welcome() {
  const { authState } = useNostrAuth()

  return (
    <div className="page welcome-page">
      <section className="hero">
        <h1 className="hero-title">
          Cloistr Me
        </h1>
        <p className="hero-subtitle">
          Your identity on Nostr, simplified.
        </p>
      </section>

      <section className="welcome-content">
        {authState.pubkey ? (
            <div className="welcome-back-content">
              <p className="welcome-text">
                Welcome back! Manage your Cloistr identity from your dashboard.
              </p>
              <div className="action-buttons">
                <a href="/dashboard" className="btn btn-primary btn-large">
                  Go to Dashboard
                </a>
                <a href="/register" className="btn btn-secondary btn-large">
                  Get Another Address
                </a>
              </div>
            </div>
          ) : (
            <div className="welcome-actions">
              <p className="welcome-text">
                Cloistr Me is an identity service for the Nostr network.
                Get a human-readable address like <strong>you@cloistr.xyz</strong> that
                verifies your identity and lets you receive Lightning payments.
              </p>
              <div className="action-buttons">
                <a href="/register" className="btn btn-primary btn-large">
                  Get Your Address
                </a>
                <a href="/lookup" className="btn btn-secondary btn-large">
                  Look Up an Address
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="info-section">
          <h2>What is a Cloistr address?</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Identity Verification</h3>
              <p>
                Your address proves you are who you say you are on Nostr.
                When someone sees <em>alice@cloistr.xyz</em>, they know it's really you.
              </p>
            </div>
            <div className="info-card">
              <h3>Lightning Payments</h3>
              <p>
                Receive Bitcoin to your address. Payments forward to your existing wallet
                — we never hold your funds.
              </p>
            </div>
            <div className="info-card">
              <h3>Yours Forever</h3>
              <p>
                One payment, lifetime ownership. No subscriptions, no renewals,
                no risk of losing your identity.
              </p>
            </div>
          </div>
        </section>
    </div>
  )
}
