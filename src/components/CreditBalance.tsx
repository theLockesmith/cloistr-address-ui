import { createSignal, Show } from 'solid-js';

interface CreditBalanceProps {
  balance: number;
  onWithdraw: (amount: number, address: string) => Promise<void>;
}

export function CreditBalance(props: CreditBalanceProps) {
  const [showWithdraw, setShowWithdraw] = createSignal(false);
  const [amount, setAmount] = createSignal('');
  const [lightningAddress, setLightningAddress] = createSignal('');
  const [withdrawing, setWithdrawing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);

  const isValidLightningAddress = (addr: string) => {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addr);
  };

  const handleWithdraw = async () => {
    setError(null);
    setSuccess(null);

    const amountSats = parseInt(amount(), 10);
    if (isNaN(amountSats) || amountSats <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountSats > props.balance) {
      setError('Amount exceeds available balance');
      return;
    }

    if (!lightningAddress().trim()) {
      setError('Please enter a Lightning Address');
      return;
    }

    if (!isValidLightningAddress(lightningAddress().trim())) {
      setError('Invalid Lightning Address format');
      return;
    }

    setWithdrawing(true);
    try {
      await props.onWithdraw(amountSats, lightningAddress().trim());
      setSuccess(`Withdrawal of ${amountSats.toLocaleString()} sats initiated!`);
      setAmount('');
      setLightningAddress('');
      setShowWithdraw(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const setMaxAmount = () => {
    setAmount(props.balance.toString());
  };

  return (
    <div class="credit-balance">
      <div class="balance-display">
        <span class="balance-label">Credit Balance</span>
        <span class="balance-amount">
          {props.balance.toLocaleString()} <span class="balance-unit">sats</span>
        </span>
      </div>

      <p class="balance-description">
        Credits are earned when a username you're purchasing gets claimed by someone else before your payment completes.
        You can withdraw credits to any Lightning Address.
      </p>

      <Show when={props.balance > 0}>
        <Show
          when={showWithdraw()}
          fallback={
            <button class="btn btn-secondary" onClick={() => setShowWithdraw(true)}>
              Withdraw Credits
            </button>
          }
        >
          <div class="withdraw-form">
            <div class="form-group">
              <label class="input-label">Amount (sats)</label>
              <div class="amount-input-wrapper">
                <input
                  type="number"
                  class="config-input"
                  placeholder="Amount in sats"
                  value={amount()}
                  onInput={(e) => setAmount(e.currentTarget.value)}
                  min="1"
                  max={props.balance}
                />
                <button class="btn-max" onClick={setMaxAmount}>Max</button>
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">Lightning Address</label>
              <input
                type="text"
                class="config-input"
                placeholder="you@getalby.com"
                value={lightningAddress()}
                onInput={(e) => setLightningAddress(e.currentTarget.value)}
              />
            </div>

            <Show when={error()}>
              <div class="error-message">{error()}</div>
            </Show>

            <div class="form-actions">
              <button
                class="btn btn-secondary"
                onClick={() => {
                  setShowWithdraw(false);
                  setError(null);
                }}
                disabled={withdrawing()}
              >
                Cancel
              </button>
              <button
                class="btn btn-primary"
                onClick={handleWithdraw}
                disabled={withdrawing()}
              >
                {withdrawing() ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </Show>
      </Show>

      <Show when={success()}>
        <div class="success-message">{success()}</div>
      </Show>
    </div>
  );
}
