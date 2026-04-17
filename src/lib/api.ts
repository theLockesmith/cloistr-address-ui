import type {
  AvailabilityResponse,
  PurchaseQuoteResponse,
  PurchaseInvoiceResponse,
  AddressResponse,
  LightningConfig,
  CreditBalanceResponse,
  CreditWithdrawResponse,
  Signer,
} from './types';
import { createNip98Header } from './nip98';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class AddressAPI {
  private baseUrl: string;
  private signer: Signer | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  setSigner(signer: Signer | null) {
    this.signer = signer;
  }

  private async authHeaders(url: string, method: string): Promise<HeadersInit> {
    if (!this.signer) {
      throw new Error('Not authenticated');
    }
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    const authHeader = await createNip98Header(fullUrl, method, this.signer);
    return {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };
  }

  // Public endpoint - check username availability
  async checkAvailability(username: string): Promise<AvailabilityResponse> {
    const response = await fetch(`${this.baseUrl}/addresses/check/${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - get purchase quote
  async getPurchaseQuote(username: string): Promise<PurchaseQuoteResponse> {
    const url = `${this.baseUrl}/purchase/quote`;
    const headers = await this.authHeaders(url, 'POST');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - create purchase invoice
  async createPurchaseInvoice(username: string, useCredits = false): Promise<PurchaseInvoiceResponse> {
    const url = `${this.baseUrl}/purchase/invoice`;
    const headers = await this.authHeaders(url, 'POST');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, use_credits: useCredits }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - get payment status
  async getPaymentStatus(invoiceId: string): Promise<{ status: string; username?: string }> {
    const url = `${this.baseUrl}/purchase/status/${invoiceId}`;
    const headers = await this.authHeaders(url, 'GET');
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - get my address
  async getMyAddress(): Promise<AddressResponse | null> {
    const url = `${this.baseUrl}/addresses/me`;
    const headers = await this.authHeaders(url, 'GET');
    const response = await fetch(url, { headers });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - update Lightning config
  async updateLightningConfig(config: Partial<LightningConfig>): Promise<LightningConfig> {
    const url = `${this.baseUrl}/addresses/lightning`;
    const headers = await this.authHeaders(url, 'PUT');
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - get credits
  async getCredits(): Promise<CreditBalanceResponse> {
    const url = `${this.baseUrl}/credits`;
    const headers = await this.authHeaders(url, 'GET');
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  // Authenticated - withdraw credits
  async withdrawCredits(amountSats: number, lightningAddress: string): Promise<CreditWithdrawResponse> {
    const url = `${this.baseUrl}/credits/withdraw`;
    const headers = await this.authHeaders(url, 'POST');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount_sats: amountSats,
        lightning_address: lightningAddress,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
  }
}

// Default instance
export const api = new AddressAPI();
