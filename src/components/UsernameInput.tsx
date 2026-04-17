import { createSignal, onCleanup, Show } from 'solid-js';
import { api } from '../lib/api';
import type { AvailabilityResponse } from '../lib/types';

interface UsernameInputProps {
  onSelect?: (username: string, available: boolean, priceSats?: number) => void;
  disabled?: boolean;
}

export function UsernameInput(props: UsernameInputProps) {
  const [username, setUsername] = createSignal('');
  const [checking, setChecking] = createSignal(false);
  const [result, setResult] = createSignal<AvailabilityResponse | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Username validation regex: 3-32 chars, alphanumeric + underscore
  const isValidFormat = (name: string) => /^[a-z0-9_]{3,32}$/.test(name.toLowerCase());

  const checkAvailability = async (name: string) => {
    if (!isValidFormat(name)) {
      setResult(null);
      setError(null);
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await api.checkAvailability(name.toLowerCase());
      setResult(response);
      props.onSelect?.(name.toLowerCase(), response.available, response.price_sats);
    } catch (err) {
      setError('Failed to check availability');
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  const handleInput = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(normalized);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Reset state
    setResult(null);
    setError(null);

    // Debounce the API call
    if (normalized.length >= 3) {
      debounceTimer = setTimeout(() => {
        checkAvailability(normalized);
      }, 300);
    }
  };

  onCleanup(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  const formatPrice = (sats: number) => {
    if (sats >= 1000) {
      return `${(sats / 1000).toFixed(0)}k sats`;
    }
    return `${sats} sats`;
  };

  const getStatusClass = () => {
    if (checking()) return 'checking';
    if (error()) return 'error';
    if (result()?.available === true) return 'available';
    if (result()?.available === false) return 'taken';
    return '';
  };

  return (
    <div class="username-input-container">
      <div class={`username-input-wrapper ${getStatusClass()}`}>
        <input
          type="text"
          class="username-input"
          placeholder="username"
          value={username()}
          onInput={(e) => handleInput(e.currentTarget.value)}
          disabled={props.disabled}
          maxLength={32}
        />
        <span class="domain-suffix">@cloistr.xyz</span>
      </div>

      <Show when={username().length > 0 && username().length < 3}>
        <p class="input-hint">Username must be at least 3 characters</p>
      </Show>

      <Show when={checking()}>
        <p class="input-status checking">Checking availability...</p>
      </Show>

      <Show when={error()}>
        <p class="input-status error">{error()}</p>
      </Show>

      <Show when={result()}>
        <Show when={result()!.available}>
          <div class="input-status available">
            <span class="status-icon">&#10003;</span>
            <span class="status-text">Available!</span>
            <Show when={result()!.price_sats}>
              <span class="price-badge">
                {formatPrice(result()!.price_sats!)}
                <Show when={result()!.tier}>
                  <span class="tier-label"> ({result()!.tier})</span>
                </Show>
              </span>
            </Show>
          </div>
        </Show>
        <Show when={!result()!.available}>
          <div class="input-status taken">
            <span class="status-icon">&#10007;</span>
            <span class="status-text">Already taken</span>
          </div>
        </Show>
      </Show>
    </div>
  );
}
