import { useEffect, useRef } from 'react'

/**
 * Part 4 of the signer-resilience design: fire `callback` once each time the
 * document transitions from hidden to visible, but only while `enabled` is
 * true.
 *
 * WHY THIS EXISTS
 *
 * @cloistr/auth reconnects its NIP-46 relay sockets on visibilitychange — that
 * is handled inside Nip46Signer. What is NOT handled automatically is the
 * downstream consequence for app-level state: if a signing call failed while
 * the page was hidden, the app sits in an error state with stale (or absent)
 * data, even after the relay is healthy again.
 *
 * Enabling this hook for a page's error state means: the moment the user
 * switches back to the tab, the app retries the failed load. The signer has
 * just finished reconnecting its relay, so the retry is likely to succeed.
 *
 * `enabled` should be true when there is a recoverable error worth retrying
 * automatically (e.g. a signing failure during initial data load). Disable it
 * for terminal errors (user-denied the request) to avoid hammering the signer.
 *
 * The callback ref pattern means callers do not need to stabilize the callback
 * identity with useCallback — a fresh function each render is fine.
 */
export function useVisibilityRetry(callback: () => void, enabled: boolean): void {
  // Keep the ref up to date with the latest callback without re-subscribing the
  // event listener on every render.
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!enabled) return
    const handler = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [enabled])
}
