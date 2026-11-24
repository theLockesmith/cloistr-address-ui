// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { StorageTopups } from './StorageTopups'

/**
 * Storage top-ups have been priced since migration 006 and invoiceable through
 * POST /purchase/product, but no screen sold them. Prices come from the
 * catalog (GET /products/storage), never from the component.
 */
const TOPUPS = [
  { id: 'storage_topup_10', display_name: 'Storage +10 GiB (30d)', description: '10 GiB added to your shared pool for 30 days', price_sats: 500, storage_bytes: 10737418240 },
  { id: 'storage_topup_50', display_name: 'Storage +50 GiB (30d)', description: '50 GiB added to your shared pool for 30 days', price_sats: 2250, storage_bytes: 53687091200 },
]
const INVOICE = { invoice_id: 'INV1', product_id: 'storage_topup_10', display_name: 'Storage +10 GiB (30d)', price_sats: 500, checkout_url: 'https://pay.example/i/INV1', status: 'invoiced' }

describe('StorageTopups', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const flush = async () => {
    await act(async () => {
      await Promise.resolve()
    })
  }
  const mount = async (over: Partial<Parameters<typeof StorageTopups>[0]> = {}) => {
    const props = {
      loadProducts: vi.fn().mockResolvedValue(TOPUPS),
      buy: vi.fn().mockResolvedValue(INVOICE),
      checkStatus: vi.fn().mockResolvedValue({ status: 'pending' }),
      ...over,
    }
    render(<StorageTopups {...props} />)
    await flush()
    return props
  }
  const buyFirst = async () => {
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /buy/i })[0])
    })
  }

  it('lists the top-ups on sale with the catalog price', async () => {
    await mount()
    expect(screen.getByText('Storage +10 GiB (30d)')).toBeTruthy()
    expect(screen.getByText(/500 sats/)).toBeTruthy()
    expect(screen.getByText(/2,250 sats/)).toBeTruthy()
  })

  it('says so when nothing is on sale', async () => {
    await mount({ loadProducts: vi.fn().mockResolvedValue([]) })
    expect(screen.getByText(/no storage top-ups/i)).toBeTruthy()
  })

  it('shows an error, not an empty or free list, when the catalog fails', async () => {
    await mount({ loadProducts: vi.fn().mockRejectedValue(new Error('API error: 500')) })
    expect(screen.getByText(/could not load/i)).toBeTruthy()
    expect(screen.queryAllByRole('button', { name: /buy/i })).toHaveLength(0)
  })

  it('buys the chosen product and links to its invoice', async () => {
    const props = await mount()
    await buyFirst()
    expect(props.buy).toHaveBeenCalledWith('storage_topup_10')
    const link = screen.getByRole('link', { name: /pay/i }) as HTMLAnchorElement
    expect(link.href).toBe('https://pay.example/i/INV1')
    expect(link.rel).toContain('noopener')
  })

  it('confirms once the purchase status says completed', async () => {
    const checkStatus = vi.fn()
      .mockResolvedValueOnce({ status: 'processing' })
      .mockResolvedValue({ status: 'completed' })
    await mount({ checkStatus })
    await buyFirst()
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(screen.queryByText(/storage added/i)).toBeNull()
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(checkStatus).toHaveBeenCalledWith('INV1')
    expect(screen.getByText(/storage added/i)).toBeTruthy()
  })

  it('stops and says so when the invoice expires', async () => {
    const checkStatus = vi.fn().mockResolvedValue({ status: 'expired' })
    await mount({ checkStatus })
    await buyFirst()
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(screen.getByText(/expired/i)).toBeTruthy()
    await act(async () => { await vi.advanceTimersByTimeAsync(9000) })
    expect(checkStatus).toHaveBeenCalledTimes(1)
  })

  it('shows why an invoice could not be created', async () => {
    await mount({ buy: vi.fn().mockRejectedValue(new Error('Payment system unavailable')) })
    await buyFirst()
    expect(screen.getByText(/payment system unavailable/i)).toBeTruthy()
  })
})
