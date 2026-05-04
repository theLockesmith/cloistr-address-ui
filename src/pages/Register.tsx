import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNostrAuth } from '@cloistr/ui/auth'
import { LoginModal } from '@cloistr/ui/components'
import { UsernameInput } from '../components'

export function Register() {
  const { authState } = useNostrAuth()
  const navigate = useNavigate()
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [priceSats, setPriceSats] = useState<number | undefined>()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleUsernameSelect = (username: string, available: boolean, price?: number) => {
    setSelectedUsername(username)
    setIsAvailable(available)
    setPriceSats(price)
  }

  const handleGetAddress = () => {
    if (!selectedUsername || !isAvailable) return

    if (!authState.pubkey) {
      setShowLoginPrompt(true)
      return
    }

    navigate(`/purchase/${selectedUsername}`)
  }

  return (
    <div className="page home-page">
      <section className="hero">
          <h1 className="hero-title">
            Welcome to Cloistr
          </h1>
          <p className="hero-subtitle">
            Your sovereign identity on Nostr. Own your name, control your data, receive payments — all with one address.
          </p>
        </section>

        {authState.pubkey && (
          <section className="welcome-back">
            <p>Welcome back! <a href="/dashboard">Go to your dashboard</a> to manage your address.</p>
          </section>
        )}

        <section className="signup-section">
          <div className="signup-card">
            <h2>Get Your @cloistr.xyz Address</h2>
            <UsernameInput onSelect={handleUsernameSelect} />

            {selectedUsername && isAvailable && (
              <button
                className="btn btn-primary btn-large"
                onClick={handleGetAddress}
              >
                Get {selectedUsername}@cloistr.xyz
                {priceSats && (
                  <span className="btn-price">for {priceSats.toLocaleString()} sats</span>
                )}
              </button>
            )}
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <h3>NIP-05 Verification</h3>
            <p>Verify your Nostr identity. Show up as alice@cloistr.xyz in all Nostr clients.</p>
          </div>
          <div className="feature">
            <h3>Lightning Address</h3>
            <p>Receive Bitcoin payments to your address. Forward to your existing wallet - non-custodial.</p>
          </div>
          <div className="feature">
            <h3>Future Email</h3>
            <p>Coming soon: Nostr-native email with end-to-end encryption.</p>
          </div>
        </section>

        <section className="pricing">
          <h2>Simple Pricing</h2>
          <div className="pricing-tiers">
            <div className="tier">
              <span className="tier-name">Ultra Premium</span>
              <span className="tier-length">1-2 characters</span>
              <span className="tier-price">50,000 sats</span>
            </div>
            <div className="tier">
              <span className="tier-name">Premium</span>
              <span className="tier-length">3 characters</span>
              <span className="tier-price">10,000 sats</span>
            </div>
            <div className="tier">
              <span className="tier-name">Short</span>
              <span className="tier-length">4-5 characters</span>
              <span className="tier-price">5,000 sats</span>
            </div>
            <div className="tier popular">
              <span className="tier-badge">Most Popular</span>
              <span className="tier-name">Standard</span>
              <span className="tier-length">6+ characters</span>
              <span className="tier-price">1,000 sats</span>
            </div>
          </div>
          <p className="pricing-note">One-time payment. Own your address forever.</p>
        </section>

      <LoginModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  )
}
