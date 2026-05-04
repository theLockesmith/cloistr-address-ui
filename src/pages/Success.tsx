import { useParams } from 'react-router-dom'

export function Success() {
  const params = useParams<{ username: string }>()

  return (
    <div className="page success-page">
      <div className="success-card">
        <div className="success-icon">&#10003;</div>
        <h1>Congratulations!</h1>
        <p className="success-message">
          You are now the proud owner of
        </p>
        <p className="address-display">
          {params.username}@cloistr.xyz
        </p>

        <div className="success-features">
          <h3>What's Next?</h3>
          <ul>
            <li>
              <strong>NIP-05 Active:</strong> Your address is now verifiable in all Nostr clients.
            </li>
            <li>
              <strong>Lightning Address:</strong> Configure forwarding to receive payments.
            </li>
            <li>
              <strong>Update Profile:</strong> Add <code>{params.username}@cloistr.xyz</code> to your Nostr profile.
            </li>
          </ul>
        </div>

        <div className="success-actions">
          <a href="/dashboard" className="btn btn-primary">
            Configure Lightning
          </a>
          <a href="/" className="btn btn-secondary">
            Back to Home
          </a>
        </div>

        <div className="nip05-instructions">
          <h4>How to verify in clients:</h4>
          <p>
            In your Nostr client profile settings, set your NIP-05 identifier to:
          </p>
          <code className="nip05-code">{params.username}@cloistr.xyz</code>
        </div>
      </div>
    </div>
  )
}
