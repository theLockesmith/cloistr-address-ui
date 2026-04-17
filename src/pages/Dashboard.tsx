import { createSignal, onMount, Show } from 'solid-js';
import { useAuth } from '../lib/nostr';
import { api } from '../lib/api';
import { LoginButton, LightningConfig, CreditBalance } from '../components';
import type { AddressResponse, CreditBalanceResponse } from '../lib/types';

export function Dashboard() {
  const auth = useAuth();

  const [address, setAddress] = createSignal<AddressResponse | null>(null);
  const [credits, setCredits] = createSignal<CreditBalanceResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const loadData = async () => {
    if (!auth.state().pubkey || !auth.signer()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      api.setSigner(auth.signer());

      const [addressRes, creditsRes] = await Promise.all([
        api.getMyAddress(),
        api.getCredits(),
      ]);

      setAddress(addressRes);
      setCredits(creditsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLightning = async (config: any) => {
    api.setSigner(auth.signer());
    const updated = await api.updateLightningConfig(config);
    setAddress((prev) => prev ? { ...prev, lightning: updated } : null);
  };

  const handleWithdraw = async (amount: number, lightningAddress: string) => {
    api.setSigner(auth.signer());
    await api.withdrawCredits(amount, lightningAddress);
    // Reload credits after withdrawal
    const creditsRes = await api.getCredits();
    setCredits(creditsRes);
  };

  onMount(() => {
    loadData();
  });

  return (
    <div class="page dashboard-page">
      <header class="header">
        <div class="header-content">
          <a href="/" class="logo">cloistr</a>
          <nav class="nav">
            <a href="/" class="nav-link">Home</a>
            <LoginButton />
          </nav>
        </div>
      </header>

      <main class="main">
        <div class="dashboard-container">
          <h1>Dashboard</h1>

          <Show when={!auth.state().pubkey}>
            <div class="login-required">
              <p>Please login to view your dashboard.</p>
              <LoginButton />
            </div>
          </Show>

          <Show when={auth.state().pubkey && loading()}>
            <div class="loading">Loading...</div>
          </Show>

          <Show when={auth.state().pubkey && error()}>
            <div class="error-message">{error()}</div>
            <button class="btn btn-secondary" onClick={loadData}>
              Retry
            </button>
          </Show>

          <Show when={auth.state().pubkey && !loading() && !error()}>
            <Show
              when={address()}
              fallback={
                <div class="no-address">
                  <h2>No Address Found</h2>
                  <p>You don't own a @cloistr.xyz address yet.</p>
                  <a href="/" class="btn btn-primary">
                    Get Your Address
                  </a>
                </div>
              }
            >
              <div class="dashboard-content">
                <section class="address-section">
                  <h2>Your Address</h2>
                  <div class="address-card">
                    <span class="address-value">
                      {address()!.username}@{address()!.domain}
                    </span>
                    <span class={`address-status ${address()!.active ? 'active' : 'inactive'}`}>
                      {address()!.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div class="address-pubkey">
                    <span class="pubkey-label">Linked to:</span>
                    <code class="pubkey-value">
                      {address()!.pubkey.slice(0, 16)}...{address()!.pubkey.slice(-16)}
                    </code>
                  </div>
                </section>

                <section class="lightning-section">
                  <LightningConfig
                    config={address()!.lightning}
                    onSave={handleSaveLightning}
                  />
                </section>

                <Show when={credits()}>
                  <section class="credits-section">
                    <CreditBalance
                      balance={credits()!.balance_sats}
                      onWithdraw={handleWithdraw}
                    />
                  </section>
                </Show>

                <section class="relays-section">
                  <h3>Relay Hints</h3>
                  <p>These relays are included in your NIP-05 response:</p>
                  <ul class="relay-list">
                    {address()!.relays.map((relay) => (
                      <li class="relay-item">{relay}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </Show>
          </Show>
        </div>
      </main>
    </div>
  );
}
