import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import type { AvailabilityResponse } from '../lib/types'

interface UsernameInputProps {
  onSelect?: (username: string, available: boolean, priceSats?: number) => void
  disabled?: boolean
}

export function UsernameInput({ onSelect, disabled }: UsernameInputProps) {
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<AvailabilityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // TODO: switch to @cloistr/ui isValid once released (mirrors ^[a-z0-9_-]{2,50}$)
  // Username validation regex: canonical rule — 2-50 chars, lowercase letters/digits/underscore/hyphen
  const isValidFormat = (name: string) => /^[a-z0-9_-]{2,50}$/.test(name)

  const checkAvailability = async (name: string) => {
    if (!isValidFormat(name)) {
      setResult(null)
      setError(null)
      return
    }

    setChecking(true)
    setError(null)

    try {
      const response = await api.checkAvailability(name.toLowerCase())
      setResult(response)
      onSelect?.(name.toLowerCase(), response.available, response.price_sats)
    } catch (err) {
      setError('Failed to check availability')
      setResult(null)
    } finally {
      setChecking(false)
    }
  }

  const handleInput = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(normalized)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Reset state
    setResult(null)
    setError(null)

    // Debounce the API call
    if (normalized.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        checkAvailability(normalized)
      }, 300)
    }
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const formatPrice = (sats: number) => {
    if (sats >= 1000) {
      return `${(sats / 1000).toFixed(0)}k sats`
    }
    return `${sats} sats`
  }

  const getStatusClass = () => {
    if (checking) return 'checking'
    if (error) return 'error'
    if (result?.available === true) return 'available'
    if (result?.available === false) return 'taken'
    return ''
  }

  return (
    <div className="username-input-container">
      <div className={`username-input-wrapper ${getStatusClass()}`}>
        <input
          type="text"
          className="username-input"
          placeholder="username"
          value={username}
          onChange={(e) => handleInput(e.target.value)}
          disabled={disabled}
          maxLength={50}
        />
        <span className="domain-suffix">@cloistr.xyz</span>
      </div>

      {username.length > 0 && username.length < 2 && (
        <p className="input-hint">Username must be at least 2 characters</p>
      )}

      {checking && (
        <p className="input-status checking">Checking availability...</p>
      )}

      {error && (
        <p className="input-status error">{error}</p>
      )}

      {result && (
        result.available ? (
          <div className="input-status available">
            <span className="status-icon">&#10003;</span>
            <span className="status-text">Available!</span>
            {result.price_sats && (
              <span className="price-badge">
                {formatPrice(result.price_sats)}
                {result.tier && (
                  <span className="tier-label"> ({result.tier})</span>
                )}
              </span>
            )}
          </div>
        ) : (
          <div className="input-status taken">
            <span className="status-icon">&#10007;</span>
            <span className="status-text">Already taken</span>
          </div>
        )
      )}
    </div>
  )
}
