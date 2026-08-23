import { withSignerRetry } from '@cloistr/ui'
import type { Signer } from './types';

/**
 * Create a NIP-98 HTTP Auth header.
 * Signs a kind:27235 event with the URL and method.
 *
 * SIGNER RESILIENCE: the signEvent call is routed through withSignerRetry so
 * that transient relay failures (NO_RELAYS, CONNECTION_FAILED, DISCONNECTED)
 * are retried automatically before the error surfaces to the caller.
 *
 * NOTE on current @cloistr/auth behavior (v0.6.0): both Nip46Signer and
 * Nip07Signer wrap ALL signEvent errors in a SIGN_EVENT_FAILED code, which
 * classifySignerError() treats as terminal (unknown codes default terminal to
 * avoid silent looping). The Nip46Signer also attempts one relay reconnect
 * internally in sendRequest() before throwing, so a retryable cause may have
 * already recovered by the time SIGN_EVENT_FAILED reaches withSignerRetry.
 * When @cloistr/auth is updated to preserve the original error code through
 * signEvent, the automatic retry will engage without any change here. For now
 * the wrapper is load-bearing for: (a) correct error classification via
 * signerFailureMessage, (b) future-proofing, and (c) NIP-07 paths where error
 * codes may differ.
 */
export async function createNip98Header(
  url: string,
  method: string,
  signer: Signer
): Promise<string> {
  const event = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', method.toUpperCase()],
    ],
    content: '',
  };

  const signed = await withSignerRetry(() => signer.signEvent(event));
  const json = JSON.stringify(signed);
  const base64 = btoa(json);
  return `Nostr ${base64}`;
}
