// Checkout and payment types aligned with v5 getFinalPayload (event-checkout, item-checkout)

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  PSPRING: 'pspring',
  RAZORPAY: 'razorpay',
  PHONEPE: 'phonepe',
  SWIREPAY: 'swirepay',
  NONE: 'none',
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export interface PaymentKey {
  provider: string;
  apiKey?: string;
  clientId?: string;
  isTestMode?: boolean;
  testApiKey?: string;
}

export interface ItemTenantDto {
  tax?: number;
  taxPercent?: number;
  cardFees?: number;
  bankFees?: number;
  currency?: string;
  paymentKeys?: PaymentKey[];
}

export interface CartSummary {
  totalPrice: number;
  totalTax: number;
  cardFees: number;
  cardPercent: number;
  taxPercent: number;
  showCardFees: boolean;
  showTaxable: boolean;
  itemDiscount: number;
  bankFees?: number;
  bankPercent?: number;
  showBankFees?: boolean;
  recurringInfo?: {
    billingFreqText?: string;
    nextBillingPeriod?: string;
    processingFees?: number;
  };
}

export interface CheckoutUserForm {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  note?: string;
  address?: string | { line1: string };
  otherPrice?: number;
  guardians?: unknown[];
  customFields?: CustomFieldValue[];
}

export interface CustomFieldValue {
  guId: string;
  value: string;
  name?: string;
  type?: string;
  tag?: string;
}

export interface CustomFieldConfig {
  customField: {
    guId: string;
    name: string;
    type?: string;
    tag?: string;
    isMandatory?: boolean;
    isDisabled?: boolean;
    value?: string;
    isError?: boolean;
  };
}

/** Transaction info returned by payment component after provider flow (Stripe/Razorpay/etc.) */
export interface PaymentTransactionInfo {
  nonce?: string;
  methodId?: string;
  methodType?: string;
  paymentType?: string;
  paymentIntent?: string;
  setupIntent?: string;
}

export interface CheckoutPaymentPayload {
  amount: number | string;
  currency: string;
  nonce?: string;
  methodId?: string;
  methodType?: string;
  paymentType?: string;
  paymentIntent?: string;
  setupIntent?: string;
  isSaveCard: boolean;
  isPayLater: boolean;
  zipCode?: string;
  cvv?: string;
  paymentDate?: string;
  notes?: string;
}

/** Event checkout final payload (productCheckout) */
export interface EventCheckoutPayload {
  tenantId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customFields?: CustomFieldValue[];
  guardians?: unknown[];
  offerCode: string;
  discountTotal: number;
  total: string;
  notes?: string;
  currency: string;
  membershipList: MembershipListItem[];
  payment: CheckoutPaymentPayload;
  event: {
    scheduleId?: string;
    classStartTime?: number;
    guId: string;
  };
}

/** Course/item checkout final payload (productCheckout) */
export interface ItemCheckoutPayload {
  tenantId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customFields?: CustomFieldValue[];
  registrationFormId?: string;
  offerCode: string;
  discountTotal?: number | string;
  total: string;
  notes?: string;
  currency: string;
  membershipList: MembershipListItem[];
  attendeeList?: unknown[];
  payment: CheckoutPaymentPayload;
}

/** Plan checkout payload (membershipPlanCheckout) */
export interface PlanCheckoutPayload {
  tenantId: string;
  orgId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  planId: string;
  pricingId: string;
  productId: string;
  productName: string;
  isChangePlan?: boolean;
  currency: string;
  payment: CheckoutPaymentPayload & {
    amount: number;
    zipCode?: string;
    cvv?: string;
    paymentDate?: string;
  };
}

export interface MembershipListItem {
  guId: string;
  name?: string;
  price?: number;
  currency?: string;
  qty?: number;
  isOtherPrice?: boolean;
  membershipTypeStr?: string;
  membershipDetails?: {
    membershipType?: string;
    billingFreqText?: string;
    numberOfBillingCycles?: string;
    registrationFees?: number;
    subscriptionPlanId?: string;
  };
  discount?: number;
  offerId?: string;
  priceToDiscount?: number;
  subscriptionPrice?: number;
  finalSubscriptionAmount?: number;
  finalOneTimePayment?: number;
  [key: string]: unknown;
}

export interface CheckoutLineItem {
  guId: string;
  name?: string;
  price: number;
  currency: string;
  qty: number;
  subscriptionPrice?: number;
  membershipDetails?: MembershipListItem['membershipDetails'];
  discount?: number;
  priceToDiscount?: number;
  offerId?: string;
  isOtherPrice?: boolean;
  category?: { guId: string; name?: string; registrationFormId?: string };
  donationCategory?: { guId: string };
  itemType?: string;
  [key: string]: unknown;
}

export interface OfferToApply {
  guId: string;
  _id?: string;
  offerCode: string;
  discountType?: 'amount' | 'percentage';
  discount?: number;
  [key: string]: unknown;
}

export interface GetPaymentIntentPayload {
  contactId?: string;
  contactEmail: string;
  currency: string;
  amount: string;
  paymentType: string;
  contactPhone?: string;
  notes?: string;
  firstName: string;
  tenantId: string;
  redirectUrl?: string;
}
