import { Show } from 'solid-js';
import { useAuth } from '../lib/nostr';
import { LoginButton } from '../components';

export function Welcome() {
  const auth = useAuth();

  return (
    <div class="page welcome-page">
      <header class="header">
        <div class="header-content">
          <a href="/" class="logo">
            <img src="/cloistr-logo.svg" alt="Cloistr" class="logo-img" />
          </a>
          <nav class="nav">
            <Show when={auth.state().pubkey}>
              <a href="/dashboard" class="nav-link">Dashboard</a>
            </Show>
            <LoginButton />
          </nav>
        </div>
      </header>

      <main class="main">
        <section class="hero">
          <h1 class="hero-title">
            Cloistr Me
          </h1>
          <p class="hero-subtitle">
            Your identity on Nostr, simplified.
          </p>
        </section>

        <section class="welcome-content">
          <Show
            when={auth.state().pubkey}
            fallback={
              <div class="welcome-actions">
                <p class="welcome-text">
                  Cloistr Me is an identity service for the Nostr network.
                  Get a human-readable address like <strong>you@cloistr.xyz</strong> that
                  verifies your identity and lets you receive Lightning payments.
                </p>
                <div class="action-buttons">
                  <a href="/register" class="btn btn-primary btn-large">
                    Get Your Address
                  </a>
                  <a href="/lookup" class="btn btn-secondary btn-large">
                    Look Up an Address
                  </a>
                </div>
              </div>
            }
          >
            <div class="welcome-back-content">
              <p class="welcome-text">
                Welcome back! Manage your Cloistr identity from your dashboard.
              </p>
              <div class="action-buttons">
                <a href="/dashboard" class="btn btn-primary btn-large">
                  Go to Dashboard
                </a>
                <a href="/register" class="btn btn-secondary btn-large">
                  Get Another Address
                </a>
              </div>
            </div>
          </Show>
        </section>

        <section class="info-section">
          <h2>What is a Cloistr address?</h2>
          <div class="info-grid">
            <div class="info-card">
              <h3>Identity Verification</h3>
              <p>
                Your address proves you are who you say you are on Nostr.
                When someone sees <em>alice@cloistr.xyz</em>, they know it's really you.
              </p>
            </div>
            <div class="info-card">
              <h3>Lightning Payments</h3>
              <p>
                Receive Bitcoin to your address. Payments forward to your existing wallet
                — we never hold your funds.
              </p>
            </div>
            <div class="info-card">
              <h3>Yours Forever</h3>
              <p>
                One payment, lifetime ownership. No subscriptions, no renewals,
                no risk of losing your identity.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer class="footer">
        <p>Part of the <a href="https://cloistr.xyz">Cloistr</a> ecosystem</p>
      </footer>
    </div>
  );
}
