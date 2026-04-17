// API Types

export interface AvailabilityResponse {
  available: boolean;
  price_sats?: number;
  tier?: string;
}

export interface PurchaseQuoteResponse {
  username: string;
  available: boolean;
  price_sats?: number;
  tier?: string;
  credits?: number;
}

export interface PurchaseInvoiceResponse {
  invoice_id: string;
  username: string;
  amount_sats: number;
  credits_applied?: number;
  payment_request?: string;
  expires_at: string;
}

export interface AddressResponse {
  username: string;
  domain: string;
  pubkey: string;
  active: boolean;
  lightning?: LightningConfig;
  relays: string[];
}

export interface LightningConfig {
  mode: 'disabled' | 'proxy' | 'nwc';
  proxy_address?: string;
  enabled: boolean;
}

export interface CreditBalanceResponse {
  balance_sats: number;
}

export interface CreditWithdrawResponse {
  withdrawal_id: number;
  amount_sats: number;
  status: string;
  message: string;
}

// Auth Types

export interface AuthState {
  pubkey: string | null;
  method: 'nip07' | 'nip46' | null;
}

export interface Signer {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedEvent): Promise<SignedEvent>;
}

export interface UnsignedEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

export interface SignedEvent extends UnsignedEvent {
  id: string;
  pubkey: string;
  sig: string;
}
