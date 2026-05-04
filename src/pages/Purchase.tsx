import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNostrAuth } from '@cloistr/ui/auth'
import { LoginPrompt } from '@cloistr/ui/components'
import { api } from '../lib/api'
import { PaymentQR } from '../components'
import type { PurchaseQuoteResponse, PurchaseInvoiceResponse } from '../lib/types'

export function Purchase() {
  const params = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { authState, signer } = useNostrAuth()

  const [quote, setQuote] = useState<PurchaseQuoteResponse | null>(null)
  const [invoice, setInvoice] = useState<PurchaseInvoiceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useCredits, setUseCredits] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadQuote = async () => {
    if (!authState.pubkey || !signer) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      api.setSigner(signer)
      const response = await api.getPurchaseQuote(params.username!)
      setQuote(response)

      if (!response.available) {
        setError(`${params.username}@cloistr.xyz is no longer available`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async () => {
    if (!signer) return

    setLoading(true)
    setError(null)

    try {
      api.setSigner(signer)
      const response = await api.createPurchaseInvoice(params.username!, useCredits)
      setInvoice(response)
      startPaymentPolling(response.invoice_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const startPaymentPolling = (invoiceId: string) => {
    pollTimer.current = setInterval(async () => {
      try {
        const status = await api.getPaymentStatus(invoiceId)
        setPaymentStatus(status.status)

        if (status.status === 'completed') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          navigate(`/success/${params.username}`)
        } else if (status.status === 'failed' || status.status === 'expired') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setError('Payment failed or expired. Please try again.')
          setInvoice(null)
        }
      } catch (err) {
        console.error('Failed to check payment status:', err)
      }
    }, 3000)
  }

  const handleExpired = () => {
    if (pollTimer.current) clearInterval(pollTimer.current)
    setInvoice(null)
    setError('Invoice expired. Click "Pay Now" to create a new one.')
  }

  useEffect(() => {
    loadQuote()
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [authState.pubkey])

  const effectivePrice = () => {
    if (!quote) return 0
    const price = quote.price_sats || 0
    const credits = useCredits ? (quote.credits || 0) : 0
    return Math.max(0, price - credits)
  }

  return (
    <div className="page purchase-page">
      <div className="purchase-card">
        <h1>Purchase {params.username}@cloistr.xyz</h1>

        {!authState.pubkey && (
          <LoginPrompt
            title="Purchase"
            callToAction="Please sign in to continue with your purchase."
          />
        )}

          {authState.pubkey && loading && (
            <div className="loading">Loading...</div>
          )}

          {authState.pubkey && error && !invoice && (
            <>
              <div className="error-message">{error}</div>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </>
          )}

          {authState.pubkey && quote && !invoice && !error && (
            <div className="quote-details">
              <div className="quote-row">
                <span>Username</span>
                <span className="quote-value">{quote.username}@cloistr.xyz</span>
              </div>
              <div className="quote-row">
                <span>Tier</span>
                <span className="quote-value tier-badge">{quote.tier}</span>
              </div>
              <div className="quote-row">
                <span>Base Price</span>
                <span className="quote-value">{quote.price_sats?.toLocaleString()} sats</span>
              </div>

              {(quote.credits || 0) > 0 && (
                <div className="credits-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                    />
                    Apply {quote.credits?.toLocaleString()} sats credit
                  </label>
                </div>
              )}

              <div className="quote-row total">
                <span>Total</span>
                <span className="quote-value">{effectivePrice().toLocaleString()} sats</span>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={createInvoice}
                disabled={loading}
              >
                {effectivePrice() > 0 ? 'Pay Now' : 'Claim Free'}
              </button>
            </div>
          )}

          {invoice && (
            <>
              {effectivePrice() > 0 ? (
                <>
                  <PaymentQR
                    paymentRequest={invoice.payment_request!}
                    amountSats={invoice.amount_sats}
                    expiresAt={invoice.expires_at}
                    onExpired={handleExpired}
                  />
                  {paymentStatus && (
                    <p className="payment-status">Status: {paymentStatus}</p>
                  )}
                </>
              ) : (
                <div className="free-claim">
                  <p>Processing your free claim...</p>
                  <div className="loading-spinner"></div>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  )
}
