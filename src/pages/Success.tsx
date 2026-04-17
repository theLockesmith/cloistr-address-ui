import { useParams } from '@solidjs/router';
import { LoginButton } from '../components';

export function Success() {
  const params = useParams<{ username: string }>();

  return (
    <div class="page success-page">
      <header class="header">
        <div class="header-content">
          <a href="/" class="logo">cloistr</a>
          <nav class="nav">
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <LoginButton />
          </nav>
        </div>
      </header>

      <main class="main">
        <div class="success-card">
          <div class="success-icon">&#10003;</div>
          <h1>Congratulations!</h1>
          <p class="success-message">
            You are now the proud owner of
          </p>
          <p class="address-display">
            {params.username}@cloistr.xyz
          </p>

          <div class="success-features">
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

          <div class="success-actions">
            <a href="/dashboard" class="btn btn-primary">
              Configure Lightning
            </a>
            <a href="/" class="btn btn-secondary">
              Back to Home
            </a>
          </div>

          <div class="nip05-instructions">
            <h4>How to verify in clients:</h4>
            <p>
              In your Nostr client profile settings, set your NIP-05 identifier to:
            </p>
            <code class="nip05-code">{params.username}@cloistr.xyz</code>
          </div>
        </div>
      </main>
    </div>
  );
}
