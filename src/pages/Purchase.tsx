import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { useAuth } from '../lib/nostr';
import { api } from '../lib/api';
import { LoginButton, PaymentQR } from '../components';
import type { PurchaseQuoteResponse, PurchaseInvoiceResponse } from '../lib/types';

export function Purchase() {
  const params = useParams<{ username: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [quote, setQuote] = createSignal<PurchaseQuoteResponse | null>(null);
  const [invoice, setInvoice] = createSignal<PurchaseInvoiceResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [useCredits, setUseCredits] = createSignal(true);
  const [paymentStatus, setPaymentStatus] = createSignal<string | null>(null);

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const loadQuote = async () => {
    if (!auth.state().pubkey || !auth.signer()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      api.setSigner(auth.signer());
      const response = await api.getPurchaseQuote(params.username);
      setQuote(response);

      if (!response.available) {
        setError(`${params.username}@cloistr.xyz is no longer available`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async () => {
    if (!auth.signer()) return;

    setLoading(true);
    setError(null);

    try {
      api.setSigner(auth.signer());
      const response = await api.createPurchaseInvoice(params.username, useCredits());
      setInvoice(response);
      startPaymentPolling(response.invoice_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (invoiceId: string) => {
    pollTimer = setInterval(async () => {
      try {
        const status = await api.getPaymentStatus(invoiceId);
        setPaymentStatus(status.status);

        if (status.status === 'completed') {
          if (pollTimer) clearInterval(pollTimer);
          navigate(`/success/${params.username}`);
        } else if (status.status === 'failed' || status.status === 'expired') {
          if (pollTimer) clearInterval(pollTimer);
          setError('Payment failed or expired. Please try again.');
          setInvoice(null);
        }
      } catch (err) {
        console.error('Failed to check payment status:', err);
      }
    }, 3000);
  };

  const handleExpired = () => {
    if (pollTimer) clearInterval(pollTimer);
    setInvoice(null);
    setError('Invoice expired. Click "Pay Now" to create a new one.');
  };

  onMount(() => {
    loadQuote();
  });

  onCleanup(() => {
    if (pollTimer) clearInterval(pollTimer);
  });

  // Note: Quote is already loaded in the first onMount.
  // A createEffect watching auth.state().pubkey could be added here
  // to reload the quote if the user logs in after page load.

  const effectivePrice = () => {
    if (!quote()) return 0;
    const price = quote()!.price_sats || 0;
    const credits = useCredits() ? (quote()!.credits || 0) : 0;
    return Math.max(0, price - credits);
  };

  return (
    <div class="page purchase-page">
      <header class="header">
        <div class="header-content">
          <a href="/" class="logo">cloistr</a>
          <nav class="nav">
            <LoginButton />
          </nav>
        </div>
      </header>

      <main class="main">
        <div class="purchase-card">
          <h1>Purchase {params.username}@cloistr.xyz</h1>

          <Show when={!auth.state().pubkey}>
            <div class="login-required">
              <p>Please login to continue with your purchase.</p>
              <LoginButton />
            </div>
          </Show>

          <Show when={auth.state().pubkey && loading()}>
            <div class="loading">Loading...</div>
          </Show>

          <Show when={auth.state().pubkey && error() && !invoice()}>
            <div class="error-message">{error()}</div>
            <button class="btn btn-secondary" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </Show>

          <Show when={auth.state().pubkey && quote() && !invoice() && !error()}>
            <div class="quote-details">
              <div class="quote-row">
                <span>Username</span>
                <span class="quote-value">{quote()!.username}@cloistr.xyz</span>
              </div>
              <div class="quote-row">
                <span>Tier</span>
                <span class="quote-value tier-badge">{quote()!.tier}</span>
              </div>
              <div class="quote-row">
                <span>Base Price</span>
                <span class="quote-value">{quote()!.price_sats?.toLocaleString()} sats</span>
              </div>

              <Show when={(quote()!.credits || 0) > 0}>
                <div class="credits-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={useCredits()}
                      onChange={(e) => setUseCredits(e.currentTarget.checked)}
                    />
                    Apply {quote()!.credits?.toLocaleString()} sats credit
                  </label>
                </div>
              </Show>

              <div class="quote-row total">
                <span>Total</span>
                <span class="quote-value">{effectivePrice().toLocaleString()} sats</span>
              </div>

              <button
                class="btn btn-primary btn-large"
                onClick={createInvoice}
                disabled={loading()}
              >
                {effectivePrice() > 0 ? 'Pay Now' : 'Claim Free'}
              </button>
            </div>
          </Show>

          <Show when={invoice()}>
            <Show when={effectivePrice() > 0}>
              <PaymentQR
                paymentRequest={invoice()!.payment_request!}
                amountSats={invoice()!.amount_sats}
                expiresAt={invoice()!.expires_at}
                onExpired={handleExpired}
              />
              <Show when={paymentStatus()}>
                <p class="payment-status">Status: {paymentStatus()}</p>
              </Show>
            </Show>
            <Show when={effectivePrice() === 0}>
              <div class="free-claim">
                <p>Processing your free claim...</p>
                <div class="loading-spinner"></div>
              </div>
            </Show>
          </Show>
        </div>
      </main>
    </div>
  );
}
