import type { Signer } from './types';

/**
 * Create a NIP-98 HTTP Auth header
 * Signs a kind:27235 event with the URL and method
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

  const signed = await signer.signEvent(event);
  const json = JSON.stringify(signed);
  const base64 = btoa(json);
  return `Nostr ${base64}`;
}
