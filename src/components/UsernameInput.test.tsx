// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'

vi.mock('@cloistr/ui/auth', () => ({
  useNostrAuth: () => ({ signer: null }),
}))

const checkAvailability = vi.fn()
vi.mock('../lib/api', () => ({
  api: {
    setSigner: vi.fn(),
    checkAvailability: (name: string) => checkAvailability(name),
  },
}))

import { UsernameInput } from './UsernameInput'

/**
 * ME-7: Register.tsx shows "Get <name>@cloistr.xyz" for the last name
 * UsernameInput reported through onSelect. Typing "bob" (available) and then
 * "bob!" left that report standing, because an invalid value never called
 * onSelect(name, false), so the button still offered bob@cloistr.xyz and went
 * to /purchase/bob. A single disallowed character also showed only the length
 * hint, not that the character itself is not allowed.
 */
describe('UsernameInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    checkAvailability.mockReset()
    checkAvailability.mockResolvedValue({ username: 'bob', available: true, price_sats: 0 })
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const type = async (value: string) => {
    fireEvent.change(screen.getByPlaceholderText('username'), { target: { value } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
  }

  // The last thing onSelect reported is what Register offers to buy.
  const lastSelect = (onSelect: ReturnType<typeof vi.fn>) => onSelect.mock.calls.at(-1)

  it('withdraws an available name when the field becomes invalid', async () => {
    const onSelect = vi.fn()
    render(<UsernameInput onSelect={onSelect} />)

    await type('bob')
    expect(lastSelect(onSelect)).toEqual(['bob', true, 0])

    await type('bob!')
    expect(lastSelect(onSelect)?.[1]).toBe(false)
    expect(checkAvailability).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Available!')).toBeNull()
    expect(screen.getByText(/Invalid username/)).toBeTruthy()
  })

  it('withdraws an available name while the next check is pending', async () => {
    const onSelect = vi.fn()
    render(<UsernameInput onSelect={onSelect} />)

    await type('bob')
    expect(lastSelect(onSelect)?.[1]).toBe(true)

    // Before the debounce fires, the old answer must not still be offered.
    fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'bobb' } })
    expect(lastSelect(onSelect)?.[1]).toBe(false)
  })

  it('withdraws an available name when the field is shortened below 2', async () => {
    const onSelect = vi.fn()
    render(<UsernameInput onSelect={onSelect} />)

    await type('bob')
    await type('b')
    expect(lastSelect(onSelect)?.[1]).toBe(false)
  })

  it('says a single disallowed character is not allowed, not only that it is short', async () => {
    render(<UsernameInput onSelect={vi.fn()} />)

    await type('!')
    expect(screen.getByText(/Invalid username/)).toBeTruthy()
    expect(checkAvailability).not.toHaveBeenCalled()
  })

  it('still checks and reports a valid name', async () => {
    const onSelect = vi.fn()
    render(<UsernameInput onSelect={onSelect} />)

    await type('Bob')
    expect(checkAvailability).toHaveBeenCalledWith('bob')
    expect(lastSelect(onSelect)).toEqual(['bob', true, 0])
    expect(screen.getByText('Available!')).toBeTruthy()
  })
})
