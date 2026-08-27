import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNostrAuth } from '@cloistr/ui/auth'
import { LoginModal } from '@cloistr/ui/components'
import { UsernameInput } from '../components'
import {
  purchaseCtaSuffix,
  formatTier,
  formatTierLength,
  formatTierPrice,
  freeAllowanceNote,
} from '../lib/pricing'
import { api } from '../lib/api'
import type { PricingTiersResponse } from '../lib/types'

export function Register() {
  const { authState } = useNostrAuth()
  const navigate = useNavigate()
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [priceSats, setPriceSats] = useState<number | undefined>()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  // undefined = still loading, null = the price list could not be read.
  // Distinguished so a failed fetch renders NOTHING rather than an empty or
  // half-populated table, which reads as a complete price list.
  const [pricing, setPricing] = useState<PricingTiersResponse | null | undefined>()

  useEffect(() => {
    let cancelled = false
    api
      .getPricingTiers()
      .then((data) => {
        if (!cancelled) setPricing(data)
      })
      .catch(() => {
        // No fallback literals here on purpose. Hardcoded prices are the bug
        // this replaced: the table claimed 1,000 sats for a name the catalog
        // gives away free. Showing nothing is honest; showing a stale guess is
        // how a user meets a different number at checkout.
        if (!cancelled) setPricing(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
                {/* Never `{priceSats && …}`: 0 is a real price here (free
                    names) and JSX renders the number, which welded a "0" onto
                    the end of the address. */}
                {purchaseCtaSuffix(priceSats) && (
                  <span className="btn-price">{purchaseCtaSuffix(priceSats)}</span>
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

        {/* Rendered from the catalog, never from literals.
            This table was four blocks of hardcoded JSX asserting that a 6+
            character name costs 1,000 sats. Migration 006 set
            username_tiers.standard to 0 -- the first 6+ name is FREE -- and
            1,000 sats is address_standard_additional, i.e. a SECOND name. So
            the signup page overcharged every new visitor in its own marketing
            copy, and nothing would ever have corrected it: a literal cannot
            track a products table.
            The whole section is withheld while loading or on error rather than
            falling back to defaults, because a wrong price shown confidently is
            worse than no price at all. */}
        {pricing && pricing.tiers.length > 0 && (
          <section className="pricing">
            <h2>Simple Pricing</h2>
            <div className="pricing-tiers">
              {pricing.tiers.map((tier) => (
                <div key={tier.tier} className="tier">
                  <span className="tier-name">{formatTier(tier.tier)}</span>
                  <span className="tier-length">
                    {formatTierLength(tier.min_length, tier.max_length)}
                  </span>
                  <span className="tier-price">{formatTierPrice(tier.price_sats)}</span>
                </div>
              ))}
            </div>
            {freeAllowanceNote(pricing.tiers, pricing.additional_address_sats) && (
              <p className="pricing-note">
                {freeAllowanceNote(pricing.tiers, pricing.additional_address_sats)}
              </p>
            )}
            <p className="pricing-note">One-time payment. Own your address forever.</p>
          </section>
        )}

      <LoginModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        signerUrl="https://signer.cloistr.xyz"
      />
    </div>
  )
}
