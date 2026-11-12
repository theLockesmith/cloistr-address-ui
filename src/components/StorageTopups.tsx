import { useState, useEffect, useRef } from 'react'
import type { StorageTopup, ProductInvoiceResponse } from '../lib/types'

interface StorageTopupsProps {
  loadProducts: () => Promise<StorageTopup[]>
  buy: (productId: string) => Promise<ProductInvoiceResponse>
  checkStatus: (invoiceId: string) => Promise<{ status: string }>
}

const POLL_MS = 3000

function formatGiB(bytes: number): string {
  return `${Math.round(bytes / 1024 ** 3)} GiB`
}

type Purchase =
  | { state: 'waiting'; invoice: ProductInvoiceResponse }
  | { state: 'done'; name: string }
  | { state: 'ended'; message: string }

export function StorageTopups({ loadProducts, buy, checkStatus }: StorageTopupsProps) {
  const [products, setProducts] = useState<StorageTopup[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current)
    pollTimer.current = null
  }

  useEffect(() => {
    // Prices come from the catalog only. A failed load is an error, never an
    // empty list, which would read as "nothing on sale".
    loadProducts()
      .then(setProducts)
      .catch(() => setLoadError(true))
    return stopPolling
  }, [])

  const poll = (invoice: ProductInvoiceResponse) => {
    stopPolling()
    pollTimer.current = setInterval(async () => {
      try {
        const { status } = await checkStatus(invoice.invoice_id)
        if (status === 'completed') {
          stopPolling()
          setPurchase({ state: 'done', name: invoice.display_name })
        } else if (status === 'expired') {
          stopPolling()
          setPurchase({ state: 'ended', message: 'The invoice expired before it was paid. Nothing was charged.' })
        } else if (status === 'failed') {
          stopPolling()
          setPurchase({ state: 'ended', message: 'The payment failed. If you were charged, contact support with the invoice ID.' })
        }
      } catch {
        // A missed poll is retried on the next tick.
      }
    }, POLL_MS)
  }

  const handleBuy = async (productId: string) => {
    setError(null)
    setPurchase(null)
    setBuying(productId)
    try {
      const invoice = await buy(productId)
      if (invoice.status === 'granted') {
        setPurchase({ state: 'done', name: invoice.display_name })
      } else {
        setPurchase({ state: 'waiting', invoice })
        poll(invoice)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the invoice')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="lightning-config">
      <h3>Storage</h3>
      <p className="config-description">
        Add storage to the pool shared by your Cloistr apps. Each top-up lasts 30 days.
      </p>

      {loadError && <div className="error-message">Could not load storage top-ups. Try again later.</div>}

      {products && products.length === 0 && (
        <p className="input-hint">No storage top-ups are on sale right now.</p>
      )}

      {products && products.length > 0 && (
        <div className="config-options">
          {products.map((p) => (
            <div className="config-option" key={p.id}>
              <div className="option-content">
                <span className="option-title">{p.display_name}</span>
                <span className="option-desc">
                  {p.description || formatGiB(p.storage_bytes)} · {p.price_sats.toLocaleString('en-US')} sats
                </span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleBuy(p.id)}
                disabled={buying !== null || purchase?.state === 'waiting'}
              >
                {buying === p.id ? 'Creating invoice...' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      )}

      {purchase?.state === 'waiting' && (
        <div className="proxy-config">
          <p className="input-hint">
            {purchase.invoice.checkout_url ? (
              <a href={purchase.invoice.checkout_url} target="_blank" rel="noopener noreferrer">
                Pay {purchase.invoice.price_sats.toLocaleString('en-US')} sats
              </a>
            ) : (
              'Invoice created.'
            )}{' '}
            This page updates once the payment is confirmed.
          </p>
        </div>
      )}

      {purchase?.state === 'done' && (
        <div className="success-message">Storage added: {purchase.name}.</div>
      )}

      {purchase?.state === 'ended' && <div className="error-message">{purchase.message}</div>}

      {error && <div className="error-message">{error}</div>}
    </div>
  )
}
