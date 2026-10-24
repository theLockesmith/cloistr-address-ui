import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RelayHints } from './RelayHints'

/**
 * ME-14: the Dashboard's "Relay Hints" section disappeared entirely for an
 * address with no relay hints, contradicting the product claim that it shows
 * them "including when there are none." These render RelayHints directly
 * with react-dom/server (no jsdom/testing-library available in this repo;
 * see validators.test.ts for the project's existing no-DOM test convention)
 * and assert the heading plus an explicit empty state are both present.
 */
describe('RelayHints', () => {
  it('shows an empty state and the heading when relays is undefined', () => {
    const html = renderToStaticMarkup(<RelayHints relays={undefined} />)
    expect(html).toContain('Relay Hints')
    expect(html).toContain('No relay hints yet')
  })

  it('shows an empty state for an empty relays array', () => {
    const html = renderToStaticMarkup(<RelayHints relays={[]} />)
    expect(html).toContain('No relay hints yet')
  })

  it('lists relay hints when present, and omits the empty state', () => {
    const html = renderToStaticMarkup(
      <RelayHints relays={['wss://relay.one', 'wss://relay.two']} />
    )
    expect(html).toContain('Relay Hints')
    expect(html).toContain('wss://relay.one')
    expect(html).toContain('wss://relay.two')
    expect(html).not.toContain('No relay hints yet')
  })
})
