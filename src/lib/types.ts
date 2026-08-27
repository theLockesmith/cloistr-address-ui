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
  // Optional: an address with no relay hints omits the field entirely rather
  // than returning []. Declaring it required made the compiler vouch for a
  // guarantee the API does not give, so `address.relays.map(...)` in Dashboard
  // type-checked and then crashed the page at runtime. Keeping it optional is
  // what makes TypeScript enforce the guard at every call site.
  relays?: string[];
}

export interface LightningConfig {
  mode: 'disabled' | 'proxy' | 'nwc';
  proxy_address?: string;
  enabled: boolean;
}

// One length-based price, straight from the username_tiers catalog.
export interface PricingTier {
  tier: string;
  min_length: number;
  // null means "and up" — the standard tier is 6+ with no upper bound. Declared
  // nullable so a range renderer has to handle the open end explicitly rather
  // than printing "6-undefined".
  max_length: number | null;
  // 0 is a REAL price: the first 6+ character name is free by design.
  price_sats: number;
}

export interface PricingTiersResponse {
  tiers: PricingTier[];
  // What a SECOND or later free-tier name costs. Without it a "Free" row is
  // only half the truth, which is the bug this endpoint exists to fix.
  additional_address_sats: number;
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
