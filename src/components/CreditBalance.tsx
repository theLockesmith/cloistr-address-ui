import { useState } from 'react'

interface CreditBalanceProps {
  balance: number
  onWithdraw: (amount: number, address: string) => Promise<void>
}

export function CreditBalance({ balance, onWithdraw }: CreditBalanceProps) {
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [lightningAddress, setLightningAddress] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isValidLightningAddress = (addr: string) => {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addr)
  }

  const handleWithdraw = async () => {
    setError(null)
    setSuccess(null)

    const amountSats = parseInt(amount, 10)
    if (isNaN(amountSats) || amountSats <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amountSats > balance) {
      setError('Amount exceeds available balance')
      return
    }

    if (!lightningAddress.trim()) {
      setError('Please enter a Lightning Address')
      return
    }

    if (!isValidLightningAddress(lightningAddress.trim())) {
      setError('Invalid Lightning Address format')
      return
    }

    setWithdrawing(true)
    try {
      await onWithdraw(amountSats, lightningAddress.trim())
      setSuccess(`Withdrawal of ${amountSats.toLocaleString()} sats initiated!`)
      setAmount('')
      setLightningAddress('')
      setShowWithdraw(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const setMaxAmount = () => {
    setAmount(balance.toString())
  }

  return (
    <div className="credit-balance">
      <div className="balance-display">
        <span className="balance-label">Credit Balance</span>
        <span className="balance-amount">
          {balance.toLocaleString()} <span className="balance-unit">sats</span>
        </span>
      </div>

      <p className="balance-description">
        Credits are earned when a username you're purchasing gets claimed by someone else before your payment completes.
        You can withdraw credits to any Lightning Address.
      </p>

      {balance > 0 && (
        showWithdraw ? (
          <div className="withdraw-form">
            <div className="form-group">
              <label className="input-label">Amount (sats)</label>
              <div className="amount-input-wrapper">
                <input
                  type="number"
                  className="config-input"
                  placeholder="Amount in sats"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={balance}
                />
                <button className="btn-max" onClick={setMaxAmount}>Max</button>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Lightning Address</label>
              <input
                type="text"
                className="config-input"
                placeholder="you@getalby.com"
                value={lightningAddress}
                onChange={(e) => setLightningAddress(e.target.value)}
              />
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowWithdraw(false)
                  setError(null)
                }}
                disabled={withdrawing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setShowWithdraw(true)}>
            Withdraw Credits
          </button>
        )
      )}

      {success && (
        <div className="success-message">{success}</div>
      )}
    </div>
  )
}
