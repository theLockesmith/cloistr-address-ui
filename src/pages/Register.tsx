import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../lib/nostr';
import { LoginButton, UsernameInput } from '../components';

export function Register() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [selectedUsername, setSelectedUsername] = createSignal<string | null>(null);
  const [isAvailable, setIsAvailable] = createSignal(false);
  const [priceSats, setPriceSats] = createSignal<number | undefined>();
  const [showLoginPrompt, setShowLoginPrompt] = createSignal(false);

  const handleUsernameSelect = (username: string, available: boolean, price?: number) => {
    setSelectedUsername(username);
    setIsAvailable(available);
    setPriceSats(price);
  };

  const handleGetAddress = () => {
    if (!selectedUsername() || !isAvailable()) return;

    if (!auth.state().pubkey) {
      setShowLoginPrompt(true);
      return;
    }

    navigate(`/purchase/${selectedUsername()}`);
  };

  return (
    <div class="page home-page">
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
            Welcome to Cloistr
          </h1>
          <p class="hero-subtitle">
            Your sovereign identity on Nostr. Own your name, control your data, receive payments — all with one address.
          </p>
        </section>

        <Show when={auth.state().pubkey}>
          <section class="welcome-back">
            <p>Welcome back! <a href="/dashboard">Go to your dashboard</a> to manage your address.</p>
          </section>
        </Show>

        <section class="signup-section">
          <div class="signup-card">
            <h2>Get Your @cloistr.xyz Address</h2>
            <UsernameInput onSelect={handleUsernameSelect} />

            <Show when={selectedUsername() && isAvailable()}>
              <button
                class="btn btn-primary btn-large"
                onClick={handleGetAddress}
              >
                Get {selectedUsername()}@cloistr.xyz
                <Show when={priceSats()}>
                  <span class="btn-price">for {priceSats()!.toLocaleString()} sats</span>
                </Show>
              </button>
            </Show>
          </div>
        </section>

        <section class="features">
          <div class="feature">
            <h3>NIP-05 Verification</h3>
            <p>Verify your Nostr identity. Show up as alice@cloistr.xyz in all Nostr clients.</p>
          </div>
          <div class="feature">
            <h3>Lightning Address</h3>
            <p>Receive Bitcoin payments to your address. Forward to your existing wallet - non-custodial.</p>
          </div>
          <div class="feature">
            <h3>Future Email</h3>
            <p>Coming soon: Nostr-native email with end-to-end encryption.</p>
          </div>
        </section>

        <section class="pricing">
          <h2>Simple Pricing</h2>
          <div class="pricing-tiers">
            <div class="tier">
              <span class="tier-name">Ultra Premium</span>
              <span class="tier-length">1-2 characters</span>
              <span class="tier-price">50,000 sats</span>
            </div>
            <div class="tier">
              <span class="tier-name">Premium</span>
              <span class="tier-length">3 characters</span>
              <span class="tier-price">10,000 sats</span>
            </div>
            <div class="tier">
              <span class="tier-name">Short</span>
              <span class="tier-length">4-5 characters</span>
              <span class="tier-price">5,000 sats</span>
            </div>
            <div class="tier popular">
              <span class="tier-badge">Most Popular</span>
              <span class="tier-name">Standard</span>
              <span class="tier-length">6+ characters</span>
              <span class="tier-price">1,000 sats</span>
            </div>
          </div>
          <p class="pricing-note">One-time payment. Own your address forever.</p>
        </section>
      </main>

      <footer class="footer">
        <p>An identity service from <a href="https://cloistr.xyz">Cloistr</a> — Freedom as a Service</p>
      </footer>

      {/* Login prompt modal */}
      <Show when={showLoginPrompt()}>
        <div class="modal-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2>Login Required</h2>
              <button class="modal-close" onClick={() => setShowLoginPrompt(false)}>&times;</button>
            </div>
            <div class="modal-content">
              <p>Please login with Nostr to purchase your address.</p>
              <div class="modal-actions">
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
