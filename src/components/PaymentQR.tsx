import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import QRCode from 'qrcode';

interface PaymentQRProps {
  paymentRequest: string;
  amountSats: number;
  expiresAt: string;
  onExpired?: () => void;
}

export function PaymentQR(props: PaymentQRProps) {
  const [qrDataUrl, setQrDataUrl] = createSignal<string | null>(null);
  const [copied, setCopied] = createSignal(false);
  const [timeLeft, setTimeLeft] = createSignal('');
  const [expired, setExpired] = createSignal(false);

  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  const generateQR = async () => {
    try {
      const url = await QRCode.toDataURL(props.paymentRequest.toUpperCase(), {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const updateCountdown = () => {
    const now = new Date().getTime();
    const expiry = new Date(props.expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      setExpired(true);
      setTimeLeft('Expired');
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      props.onExpired?.();
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(props.paymentRequest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInWallet = () => {
    window.location.href = `lightning:${props.paymentRequest}`;
  };

  onMount(() => {
    generateQR();
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
  });

  onCleanup(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });

  return (
    <div class="payment-qr">
      <div class="payment-amount">
        <span class="amount-value">{props.amountSats.toLocaleString()}</span>
        <span class="amount-unit">sats</span>
      </div>

      <Show when={qrDataUrl()}>
        <div class="qr-container">
          <img src={qrDataUrl()!} alt="Lightning Invoice QR" class="qr-image" />
        </div>
      </Show>

      <div class={`payment-timer ${expired() ? 'expired' : ''}`}>
        <Show when={!expired()} fallback={<span>Invoice expired</span>}>
          <span>Expires in {timeLeft()}</span>
        </Show>
      </div>

      <div class="payment-actions">
        <button class="btn btn-primary" onClick={openInWallet} disabled={expired()}>
          Open in Wallet
        </button>
        <button class="btn btn-secondary" onClick={copyToClipboard} disabled={expired()}>
          {copied() ? 'Copied!' : 'Copy Invoice'}
        </button>
      </div>

      <div class="payment-invoice">
        <code class="invoice-text">
          {props.paymentRequest.slice(0, 30)}...{props.paymentRequest.slice(-10)}
        </code>
      </div>
    </div>
  );
}
