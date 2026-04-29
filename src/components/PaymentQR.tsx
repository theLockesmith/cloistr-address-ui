import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface PaymentQRProps {
  paymentRequest: string
  amountSats: number
  expiresAt: string
  onExpired?: () => void
}

export function PaymentQR({ paymentRequest, amountSats, expiresAt, onExpired }: PaymentQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const generateQR = async () => {
    try {
      const url = await QRCode.toDataURL(paymentRequest.toUpperCase(), {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      setQrDataUrl(url)
    } catch (err) {
      console.error('Failed to generate QR code:', err)
    }
  }

  const updateCountdown = () => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) {
      setExpired(true)
      setTimeLeft('Expired')
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current)
      }
      onExpired?.()
      return
    }

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentRequest)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openInWallet = () => {
    window.location.href = `lightning:${paymentRequest}`
  }

  useEffect(() => {
    generateQR()
    updateCountdown()
    countdownTimer.current = setInterval(updateCountdown, 1000)

    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current)
      }
    }
  }, [])

  return (
    <div className="payment-qr">
      <div className="payment-amount">
        <span className="amount-value">{amountSats.toLocaleString()}</span>
        <span className="amount-unit">sats</span>
      </div>

      {qrDataUrl && (
        <div className="qr-container">
          <img src={qrDataUrl} alt="Lightning Invoice QR" className="qr-image" />
        </div>
      )}

      <div className={`payment-timer ${expired ? 'expired' : ''}`}>
        {expired ? (
          <span>Invoice expired</span>
        ) : (
          <span>Expires in {timeLeft}</span>
        )}
      </div>

      <div className="payment-actions">
        <button className="btn btn-primary" onClick={openInWallet} disabled={expired}>
          Open in Wallet
        </button>
        <button className="btn btn-secondary" onClick={copyToClipboard} disabled={expired}>
          {copied ? 'Copied!' : 'Copy Invoice'}
        </button>
      </div>

      <div className="payment-invoice">
        <code className="invoice-text">
          {paymentRequest.slice(0, 30)}...{paymentRequest.slice(-10)}
        </code>
      </div>
    </div>
  )
}
