import { apiService } from '@/services/api';
import { APP_CONFIG } from '@/constants';
import type {
  ItemTenantDto,
  EventCheckoutPayload,
  ItemCheckoutPayload,
  PlanCheckoutPayload,
  GetPaymentIntentPayload,
  CheckoutPaymentPayload,
} from '@/types/checkout';

const baseUrl = APP_CONFIG.apiBaseUrl || 'https://api.wajooba.me';

/** Response shape from getItemTenant */
export interface ItemTenantResponse {
  dto: ItemTenantDto;
}

/** Public checkout APIs (no auth required). Uses fetch for public routes to avoid auth interceptors. */
async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = (errBody as { errors?: { message?: string } })?.errors?.message || res.statusText;
    throw new Error(message || `Checkout API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const checkoutService = {
  /** Get tenant-level item config (tax, card fees, payment keys). */
  async getItemTenant(tenantId: string): Promise<ItemTenantResponse> {
    return publicFetch<ItemTenantResponse>(`/item/tenant/public/${tenantId}`);
  },

  /** Get membership/item details for checkout (course or event membership). */
  async getMembershipDetails(orgId: string, guId: string): Promise<Record<string, unknown>> {
    const result = await publicFetch<Record<string, unknown>>(
      `/public/pitem/${guId}?tenant=${orgId}`
    );
    if (result && (result as Record<string, unknown>).donationCategory) {
      (result as Record<string, unknown>).category = (result as Record<string, unknown>).donationCategory;
      (result as Record<string, unknown>).donation_type = 'donation';
    }
    return result as Record<string, unknown>;
  },

  /** Validate offer code and get offer data. */
  async getOfferItem(
    offerCode: string,
    tenantId: string,
    _isOtherPrice: boolean,
    _categoryGuId: string,
    _itemGuId: string
  ): Promise<{ data?: Record<string, unknown>; error?: { errors?: { message?: string } } }> {
    const code = offerCode?.toLowerCase?.() || '';
    if (!code) return {};
    return publicFetch(
      `/item/offercode/${encodeURIComponent(code)}/public?tenantId=${encodeURIComponent(tenantId)}`
    );
  },

  /** Validate checkout payload before payment. */
  async validationCheckoutPayload(payload: Record<string, unknown>): Promise<unknown> {
    return publicFetch('/item/checkout/public/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Submit product/event checkout. */
  async productCheckout(
    payload: EventCheckoutPayload | ItemCheckoutPayload
  ): Promise<Record<string, unknown>> {
    return publicFetch<Record<string, unknown>>('/snode/product/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Submit multi-enroll checkout. */
  async multiCheckout(payload: ItemCheckoutPayload): Promise<Record<string, unknown>> {
    return publicFetch<Record<string, unknown>>('/snode/product/multicheckout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Get payment intent for Stripe/Razorpay/Phonepe (redirect flows). */
  async getPaymentIntent(payload: GetPaymentIntentPayload): Promise<Record<string, unknown>> {
    return publicFetch<Record<string, unknown>>('/item/payment/public/paymentintent', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Plan checkout (membership plan subscription). */
  async membershipPlanCheckout(payload: PlanCheckoutPayload): Promise<Record<string, unknown>> {
    return publicFetch<Record<string, unknown>>('/snode/product/plan/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export default checkoutService;
