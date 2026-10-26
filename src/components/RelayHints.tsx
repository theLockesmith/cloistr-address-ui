import { hasRelays } from '../lib/validators'

interface RelayHintsProps {
  relays?: string[]
}

/**
 * Dashboard's "Relay Hints" section.
 *
 * ME-14: this section used to be omitted entirely when the address had no
 * relay hints, even though the product claims it "shows them, including when
 * there are none." An omitted section reads as a bug (the dashboard forgot
 * to render it), not as a deliberate "you have none yet" answer. This always
 * renders the heading, with an explicit empty state when hasRelays is false.
 */
export function RelayHints({ relays }: RelayHintsProps) {
  return (
    <section className="relays-section">
      <h3>Relay Hints</h3>
      {hasRelays(relays) ? (
        <>
          <p>These relays are included in your NIP-05 response:</p>
          <ul className="relay-list">
            {relays.map((relay, index) => (
              <li key={index} className="relay-item">{relay}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No relay hints yet.</p>
      )}
    </section>
  )
}
