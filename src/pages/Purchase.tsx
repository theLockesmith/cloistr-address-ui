import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNostrAuth } from '@cloistr/ui/auth'
import { LoginPrompt, SignerRecovery } from '@cloistr/ui/components'
import { api } from '../lib/api'
import { PaymentQR } from '../components'
import { useVisibilityRetry } from '../hooks/useVisibilityRetry'
import type { PurchaseQuoteResponse, PurchaseInvoiceResponse } from '../lib/types'

/** True when `err` is a signing error (AuthError subclass). */
function isSignerError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as Record<string, unknown>).method === 'string' &&
    ['nip07', 'nip46'].includes((err as Record<string, unknown>).method as string)
  )
}

export function Purchase() {
  const params = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { authState, signer } = useNostrAuth()

  const [quote, setQuote] = useState<PurchaseQuoteResponse | null>(null)
  const [invoice, setInvoice] = useState<PurchaseInvoiceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // Signer errors: shown via SignerRecovery (session intact, never a login redirect).
  const [signerError, setSignerError] = useState<unknown>(null)
  // Non-signing errors: shown as a plain string.
  const [apiError, setApiError] = useState<string | null>(null)
  const [useCredits, setUseCredits] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadQuote = useCallback(async () => {
    if (!authState.pubkey || !signer) {
      setLoading(false)
      return
    }

    setLoading(true)
    setSignerError(null)
    setApiError(null)

    try {
      api.setSigner(signer)
      const response = await api.getPurchaseQuote(params.username!)
      setQuote(response)

      if (!response.available) {
        setApiError(`${params.username}@cloistr.xyz is no longer available`)
      }
    } catch (err) {
      if (isSignerError(err)) {
        setSignerError(err)
      } else {
        setApiError(err instanceof Error ? err.message : 'Failed to load quote')
      }
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [authState.pubkey, signer, params.username])

  const handleRetryQuote = useCallback(async () => {
    setRetrying(true)
    await loadQuote()
  }, [loadQuote])

  const createInvoice = async () => {
    if (!signer) return

    setLoading(true)
    setSignerError(null)
    setApiError(null)

    try {
      api.setSigner(signer)
      const response = await api.createPurchaseInvoice(params.username!, useCredits)
      setInvoice(response)
      startPaymentPolling(response.invoice_id)
    } catch (err) {
      if (isSignerError(err)) {
        setSignerError(err)
      } else {
        setApiError(err instanceof Error ? err.message : 'Failed to create invoice')
      }
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
          setApiError('Payment failed or expired. Please try again.')
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
    setApiError('Invoice expired. Click "Pay Now" to create a new one.')
  }

  useEffect(() => {
    loadQuote()
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [authState.pubkey])

  // Part 4 – visibilitychange reconnect.
  // Enable only while there is a signing error to recover from.
  useVisibilityRetry(loadQuote, signerError !== null)

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

          {/* Signing errors: SignerRecovery — session intact, never a login redirect. */}
          {authState.pubkey && !loading && signerError && (
            <SignerRecovery
              error={signerError}
              onRetry={handleRetryQuote}
              retrying={retrying}
              onGoBack={() => navigate('/')}
            />
          )}

          {authState.pubkey && !loading && !signerError && apiError && !invoice && (
            <>
              <div className="error-message">{apiError}</div>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </>
          )}

          {authState.pubkey && !loading && !signerError && quote && !invoice && !apiError && (
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

          {invoice && !signerError && (
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
