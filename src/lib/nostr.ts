import { createSignal, createContext, useContext } from 'solid-js';
import { SimplePool, type Event, type EventTemplate, generateSecretKey } from 'nostr-tools';
import { BunkerSigner, parseBunkerInput } from 'nostr-tools/nip46';
import type { AuthState, Signer, UnsignedEvent, SignedEvent } from './types';

// NIP-07 window.nostr interface
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: object): Promise<Event>;
    };
  }
}

// NIP-07 adapter to match Signer interface
class Nip07Signer implements Signer {
  async getPublicKey(): Promise<string> {
    if (!window.nostr) throw new Error('No Nostr extension found');
    return window.nostr.getPublicKey();
  }

  async signEvent(event: UnsignedEvent): Promise<SignedEvent> {
    if (!window.nostr) throw new Error('No Nostr extension found');
    return window.nostr.signEvent(event) as Promise<SignedEvent>;
  }
}

// NIP-46 adapter
class Nip46SignerAdapter implements Signer {
  private bunker: BunkerSigner;

  constructor(bunker: BunkerSigner) {
    this.bunker = bunker;
  }

  async getPublicKey(): Promise<string> {
    return this.bunker.getPublicKey();
  }

  async signEvent(event: UnsignedEvent): Promise<SignedEvent> {
    return this.bunker.signEvent(event as EventTemplate) as Promise<SignedEvent>;
  }
}

// Auth context
const AuthContext = createContext<{
  state: () => AuthState;
  signer: () => Signer | null;
  login: () => Promise<void>;
  loginNip46: (bunkerInput: string) => Promise<void>;
  logout: () => void;
  isLoading: () => boolean;
  hasNip07: () => boolean;
}>();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function createAuthStore() {
  const [state, setState] = createSignal<AuthState>({
    pubkey: null,
    method: null,
  });
  const [isLoading, setIsLoading] = createSignal(false);
  const [currentSigner, setCurrentSigner] = createSignal<Signer | null>(null);

  const pool = new SimplePool();
  let bunkerSigner: BunkerSigner | null = null;

  function hasNip07(): boolean {
    return typeof window !== 'undefined' && !!window.nostr;
  }

  // Login with NIP-07
  async function login(): Promise<void> {
    if (!hasNip07()) {
      throw new Error('No Nostr extension found. Please install nos2x, Alby, or similar.');
    }

    setIsLoading(true);
    try {
      const signer = new Nip07Signer();
      const pubkey = await signer.getPublicKey();

      setCurrentSigner(signer);
      setState({
        pubkey,
        method: 'nip07',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Login with NIP-46 (remote signer)
  async function loginNip46(bunkerInput: string): Promise<void> {
    setIsLoading(true);
    try {
      const bp = await parseBunkerInput(bunkerInput);
      if (!bp) {
        throw new Error('Invalid bunker URL or NIP-05 identifier');
      }

      const clientSecretKey = generateSecretKey();
      bunkerSigner = BunkerSigner.fromBunker(clientSecretKey, bp, { pool });

      await bunkerSigner.connect();
      const pubkey = await bunkerSigner.getPublicKey();

      const signer = new Nip46SignerAdapter(bunkerSigner);
      setCurrentSigner(signer);

      setState({
        pubkey,
        method: 'nip46',
      });
    } catch (err) {
      if (bunkerSigner) {
        await bunkerSigner.close().catch(() => {});
        bunkerSigner = null;
      }
      setCurrentSigner(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    if (bunkerSigner) {
      await bunkerSigner.close().catch(() => {});
      bunkerSigner = null;
    }
    setCurrentSigner(null);
    setState({
      pubkey: null,
      method: null,
    });
  }

  return {
    state,
    signer: currentSigner,
    login,
    loginNip46,
    logout,
    isLoading,
    hasNip07,
  };
}

export { AuthContext };
