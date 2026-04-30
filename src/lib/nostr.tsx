/**
 * Auth module - wraps @cloistr/ui SharedAuthProvider
 *
 * Provides NIP-07 and NIP-46 authentication with:
 * - Cross-subdomain SSO cookies
 * - Session persistence
 * - Circuit breaker and rate limiting (via collab-common)
 *
 * This module maintains API compatibility with existing components
 * while using the unified @cloistr/ui auth system.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { SharedAuthProvider } from '@cloistr/ui/components'
import {
  useNostrAuth,
  isNip07Supported,
  type SignerInterface,
} from '@cloistr/ui/auth'
import type { UnsignedEvent as NostrUnsignedEvent, Event as NostrEvent } from 'nostr-tools'

// ============================================
// Types (maintained for API compatibility)
// ============================================

export interface AuthState {
  pubkey: string | null
  method: 'nip07' | 'nip46' | null
}

export interface UnsignedEvent {
  kind: number
  created_at: number
  tags: string[][]
  content: string
  pubkey?: string
}

export interface Signer {
  getPublicKey: () => Promise<string>
  signEvent: (event: UnsignedEvent) => Promise<NostrEvent>
}

export interface SignedEvent extends NostrEvent {}

// ============================================
// Adapter functions
// ============================================

/**
 * Adapt SignerInterface from collab-common to our Signer type
 */
function adaptSigner(signer: SignerInterface | null): Signer | null {
  if (!signer) return null
  return {
    getPublicKey: () => signer.getPublicKey(),
    signEvent: async (event: UnsignedEvent) => {
      const pubkey = await signer.getPublicKey()
      const fullEvent: NostrUnsignedEvent = { ...event, pubkey }
      return signer.signEvent(fullEvent)
    },
  }
}

// ============================================
// Auth Context (API compatible)
// ============================================

interface AuthContextType {
  state: AuthState
  signer: Signer | null
  login: () => Promise<void>
  loginNip46: (bunkerInput: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  hasNip07: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ============================================
// Inner Provider
// ============================================

interface AuthProviderInnerProps {
  children: ReactNode
}

function AuthProviderInner({ children }: AuthProviderInnerProps) {
  const nostrAuth = useNostrAuth()

  // Map to our state format
  const state: AuthState = useMemo(
    () => ({
      pubkey: nostrAuth.authState.pubkey,
      method: nostrAuth.authState.method as 'nip07' | 'nip46' | null,
    }),
    [nostrAuth.authState.pubkey, nostrAuth.authState.method]
  )

  const signer = useMemo(() => adaptSigner(nostrAuth.signer), [nostrAuth.signer])

  const hasNip07 = (): boolean => isNip07Supported()

  const login = async (): Promise<void> => {
    await nostrAuth.connectNip07()
  }

  const loginNip46 = async (bunkerInput: string): Promise<void> => {
    await nostrAuth.connectNip46({ bunkerUrl: bunkerInput })
  }

  const logout = (): void => {
    nostrAuth.disconnect()
  }

  const value = useMemo<AuthContextType>(
    () => ({
      state,
      signer,
      login,
      loginNip46,
      logout,
      isLoading: nostrAuth.authState.isConnecting ?? false,
      hasNip07,
    }),
    [state, signer, nostrAuth.authState.isConnecting]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================
// Main Provider (uses SharedAuthProvider for SSO)
// ============================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SharedAuthProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SharedAuthProvider>
  )
}
