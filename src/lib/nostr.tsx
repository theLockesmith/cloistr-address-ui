/**
 * Auth module - wraps @cloistr/collab-common auth
 * Provides NIP-07 and NIP-46 authentication with circuit breaker,
 * adaptive rate limiting, and session persistence.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  AuthProvider as CollabAuthProvider,
  useNostrAuth,
  type SignerInterface,
} from '@cloistr/collab-common/auth'
import type { AuthState, Signer, UnsignedEvent, SignedEvent } from './types'

// Adapter to convert collab-common SignerInterface to our Signer type
function adaptSigner(signer: SignerInterface | null): Signer | null {
  if (!signer) return null
  return {
    getPublicKey: () => signer.getPublicKey(),
    signEvent: async (event: UnsignedEvent) => {
      // Add pubkey to the event before signing
      const pubkey = await signer.getPublicKey()
      const fullEvent = { ...event, pubkey }
      const signed = await signer.signEvent(fullEvent)
      return signed as unknown as SignedEvent
    },
  }
}

// Auth context type - maintains API compatibility
interface AuthContextType {
  state: AuthState
  signer: Signer | null
  login: () => Promise<void>
  loginNip46: (bunkerInput: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  hasNip07: () => boolean
}

// Auth context
const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Inner component that creates the auth context value
function AuthProviderInner({ children }: AuthProviderProps) {
  const collabAuth = useNostrAuth()

  // Map collab-common state to our state format
  const state: AuthState = useMemo(() => ({
    pubkey: collabAuth.authState.pubkey,
    method: collabAuth.authState.method as 'nip07' | 'nip46' | null,
  }), [collabAuth.authState.pubkey, collabAuth.authState.method])

  const signer = useMemo(() => adaptSigner(collabAuth.signer), [collabAuth.signer])

  const hasNip07 = (): boolean => {
    return typeof window !== 'undefined' && !!(window as { nostr?: unknown }).nostr
  }

  const login = async (): Promise<void> => {
    await collabAuth.connectNip07()
  }

  const loginNip46 = async (bunkerInput: string): Promise<void> => {
    await collabAuth.connectNip46({ bunkerUrl: bunkerInput })
  }

  const logout = (): void => {
    collabAuth.disconnect()
  }

  const value = useMemo<AuthContextType>(() => ({
    state,
    signer,
    login,
    loginNip46,
    logout,
    isLoading: collabAuth.authState.isConnecting ?? false,
    hasNip07,
  }), [state, signer, collabAuth.authState.isConnecting])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Main AuthProvider - wraps with collab-common's AuthProvider
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <CollabAuthProvider>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </CollabAuthProvider>
  )
}

export { AuthContext }
