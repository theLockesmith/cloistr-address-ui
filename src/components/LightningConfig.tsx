import { createSignal, Show } from 'solid-js';
import type { LightningConfig as LightningConfigType } from '../lib/types';

interface LightningConfigProps {
  config: LightningConfigType | undefined;
  onSave: (config: Partial<LightningConfigType>) => Promise<void>;
}

export function LightningConfig(props: LightningConfigProps) {
  const [mode, setMode] = createSignal<'disabled' | 'proxy'>(props.config?.mode === 'proxy' ? 'proxy' : 'disabled');
  const [proxyAddress, setProxyAddress] = createSignal(props.config?.proxy_address || '');
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);

  // Validate Lightning Address format
  const isValidLightningAddress = (addr: string) => {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addr);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (mode() === 'proxy' && !proxyAddress().trim()) {
      setError('Please enter a Lightning Address');
      return;
    }

    if (mode() === 'proxy' && !isValidLightningAddress(proxyAddress().trim())) {
      setError('Invalid Lightning Address format (e.g., name@wallet.com)');
      return;
    }

    setSaving(true);
    try {
      await props.onSave({
        mode: mode(),
        proxy_address: mode() === 'proxy' ? proxyAddress().trim() : undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentMode = props.config?.mode === 'proxy' ? 'proxy' : 'disabled';
    const currentAddr = props.config?.proxy_address || '';
    return mode() !== currentMode || proxyAddress() !== currentAddr;
  };

  return (
    <div class="lightning-config">
      <h3>Lightning Address Settings</h3>
      <p class="config-description">
        Configure how payments to your @cloistr.xyz Lightning Address are handled.
      </p>

      <div class="config-options">
        <label class="config-option">
          <input
            type="radio"
            name="lightning-mode"
            value="disabled"
            checked={mode() === 'disabled'}
            onChange={() => setMode('disabled')}
          />
          <div class="option-content">
            <span class="option-title">Disabled</span>
            <span class="option-desc">Lightning Address not active</span>
          </div>
        </label>

        <label class="config-option">
          <input
            type="radio"
            name="lightning-mode"
            value="proxy"
            checked={mode() === 'proxy'}
            onChange={() => setMode('proxy')}
          />
          <div class="option-content">
            <span class="option-title">Proxy to External Address</span>
            <span class="option-desc">Forward payments to another Lightning Address</span>
          </div>
        </label>
      </div>

      <Show when={mode() === 'proxy'}>
        <div class="proxy-config">
          <label class="input-label">
            Forward payments to:
          </label>
          <input
            type="text"
            class="config-input"
            placeholder="you@getalby.com"
            value={proxyAddress()}
            onInput={(e) => setProxyAddress(e.currentTarget.value)}
          />
          <p class="input-hint">
            Payments to your @cloistr.xyz address will be forwarded to this Lightning Address.
            You receive payments directly - we never hold your funds.
          </p>
        </div>
      </Show>

      <Show when={error()}>
        <div class="error-message">{error()}</div>
      </Show>

      <Show when={success()}>
        <div class="success-message">Settings saved successfully!</div>
      </Show>

      <button
        class="btn btn-primary"
        onClick={handleSave}
        disabled={saving() || !hasChanges()}
      >
        {saving() ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
