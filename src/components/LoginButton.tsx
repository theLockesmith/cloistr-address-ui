import { Show, createSignal } from 'solid-js';
import { useAuth } from '../lib/nostr';

export function LoginButton() {
  const auth = useAuth();
  const [showModal, setShowModal] = createSignal(false);
  const [loginMethod, setLoginMethod] = createSignal<'select' | 'nip46'>('select');
  const [bunkerUrl, setBunkerUrl] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  const truncatePubkey = (pubkey: string) => {
    return pubkey.slice(0, 8) + '...' + pubkey.slice(-8);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setLoginMethod('select');
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLoginMethod('select');
    setBunkerUrl('');
    setError(null);
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleNip07Login = async () => {
    setError(null);
    try {
      await auth.login();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleNip46Login = async () => {
    setError(null);
    const input = bunkerUrl().trim();
    if (!input) {
      setError('Please enter a bunker URL or NIP-05 identifier');
      return;
    }

    try {
      await auth.loginNip46(input);
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNip46Login();
    }
  };

  return (
    <>
      <Show
        when={auth.state().pubkey}
        fallback={
          <button
            class="btn btn-login"
            onClick={handleOpenModal}
            disabled={auth.isLoading()}
          >
            <Show when={auth.isLoading()} fallback="Login">
              Connecting...
            </Show>
          </button>
        }
      >
        <div class="user-info">
          <span class="user-pubkey">{truncatePubkey(auth.state().pubkey!)}</span>
          <span class="auth-method">
            {auth.state().method === 'nip07' ? 'Extension' : 'Remote'}
          </span>
          <button class="btn btn-logout" onClick={auth.logout}>
            Logout
          </button>
        </div>
      </Show>

      <Show when={showModal()}>
        <div class="modal-overlay" onClick={handleBackdropClick}>
          <div class="modal login-modal">
            <div class="modal-header">
              <h2>Login with Nostr</h2>
              <button class="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>

            <div class="modal-content">
              <Show when={loginMethod() === 'select'}>
                <p class="modal-question">Choose your login method:</p>
                <div class="login-options">
                  <button
                    class="login-option"
                    onClick={handleNip07Login}
                    disabled={auth.isLoading() || !auth.hasNip07()}
                    title={auth.hasNip07() ? 'Login with browser extension' : 'No extension detected'}
                  >
                    <span class="option-label">Browser Extension</span>
                    <span class="option-desc">
                      {auth.hasNip07() ? 'Use Alby, nos2x, or similar' : 'No extension detected'}
                    </span>
                  </button>
                  <button
                    class="login-option"
                    onClick={() => setLoginMethod('nip46')}
                    disabled={auth.isLoading()}
                  >
                    <span class="option-label">Remote Signer</span>
                    <span class="option-desc">Use nsec.app, Amber, or bunker URL</span>
                  </button>
                </div>
              </Show>

              <Show when={loginMethod() === 'nip46'}>
                <p class="modal-question">Enter your remote signer:</p>
                <div class="login-input-group">
                  <input
                    type="text"
                    class="login-input"
                    placeholder="bunker://... or user@nsec.app"
                    value={bunkerUrl()}
                    onInput={(e) => setBunkerUrl(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    disabled={auth.isLoading()}
                    autofocus
                  />
                  <div class="login-actions">
                    <button
                      class="btn btn-secondary"
                      onClick={() => {
                        setLoginMethod('select');
                        setBunkerUrl('');
                        setError(null);
                      }}
                      disabled={auth.isLoading()}
                    >
                      Back
                    </button>
                    <button
                      class="btn btn-primary"
                      onClick={handleNip46Login}
                      disabled={auth.isLoading() || !bunkerUrl().trim()}
                    >
                      <Show when={auth.isLoading()} fallback="Connect">
                        Connecting...
                      </Show>
                    </button>
                  </div>
                </div>
              </Show>

              <Show when={error()}>
                <div class="error-message">{error()}</div>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
