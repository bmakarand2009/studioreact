/**
 * Checkout cart and offer logic ported from v5 checkout.util.service.
 * Used by event and course checkout pages.
 */
import type { CartSummary, CheckoutUserForm, MembershipListItem, OfferToApply } from '@/types/checkout';

const MEMBERSHIP_TYPE_RECURRING = 'recurring';
const PERCENTAGE = 'percentage';

function getPercentageVal(base: number, pct: number): number {
  return Number((((base * pct) / 100) as number).toFixed(2));
}

function enrichRecurringInfo(
  item: Record<string, unknown>,
  membership: Record<string, unknown>
): Record<string, unknown> {
  const billingFreqText = (membership.billingFreqText as string) || '';
  const nextBillingPeriod = membership.billingDayOfMonth
    ? `On ${membership.billingDayOfMonth} day of Month`
    : 'Today';
  return {
    isFirstMonthFees: false,
    isLastMonthFees: false,
    processingFees: Number(membership.registrationFees) || 0,
    nextBillingPeriod,
    hasTrialPeriod: '',
    trialDuration: '',
    billingFreqText,
    billingEndsAfter: Number(membership.numberOfBillingCycles) > 0 ? `${membership.numberOfBillingCycles} billing cycles` : 'Manual Request',
  };
}

export interface CalculateCartSummaryInput {
  item: Record<string, unknown>;
  user: Record<string, unknown>;
  recurringMembership: Record<string, unknown> | null;
  offerToApply: OfferToApply | null;
  taxPercent: number;
  cardFeesPercent: number;
  isDonationItem?: boolean;
  bankFeesPercent?: number;
  applyCardFees?: boolean;
}

export function calculateCartSummary({
  item,
  user,
  recurringMembership,
  offerToApply,
  taxPercent = 0,
  cardFeesPercent = 0,
  bankFeesPercent = 0,
  applyCardFees = true,
}: CalculateCartSummaryInput): CartSummary & { totalTaxSub?: number; totalTaxReg?: number; cardFeesOnPriceAmt?: number; cardFeesOnAmt?: number } {
  const membershipDetails = (item.membershipDetails || {}) as Record<string, unknown>;
  let totalPrice: number = Number(item.price) || 0;
  (item as Record<string, unknown>).subscriptionPrice = 0;

  if (item.isOtherPrice && user.otherPrice != null) {
    totalPrice = Number(user.otherPrice) || totalPrice;
  }

  const result: CartSummary & {
    totalTaxSub?: number;
    totalTaxReg?: number;
    cardFeesOnPriceAmt?: number;
    cardFeesOnAmt?: number;
  } = {
    totalPrice,
    totalTax: 0,
    cardFees: 0,
    totalTaxSub: 0,
    totalTaxReg: 0,
    cardFeesOnPriceAmt: 0,
    cardFeesOnAmt: 0,
    recurringInfo: {},
    itemDiscount: 0,
    showTaxable: false,
    showCardFees: false,
    taxPercent: taxPercent || 0,
    cardPercent: cardFeesPercent,
    bankPercent: bankFeesPercent,
    bankFees: 0,
    showBankFees: false,
  };

  if (membershipDetails.membershipType === MEMBERSHIP_TYPE_RECURRING && recurringMembership) {
    (item as Record<string, unknown>).subscriptionPrice = item.price;
    result.recurringInfo = enrichRecurringInfo(item as Record<string, unknown>, recurringMembership) as CartSummary['recurringInfo'];
    (result.recurringInfo as Record<string, unknown>).processingFees = Number(membershipDetails.registrationFees) || 0;
    result.totalPrice = (result.recurringInfo as Record<string, unknown>).processingFees as number;
    result.totalPrice += Number((item as Record<string, unknown>).subscriptionPrice) || 0;
  }

  let registrationFees = parseFloat(String(membershipDetails.registrationFees || 0));
  let itemPrice = parseFloat(String(item.price || 0));

  if (offerToApply && (item as Record<string, unknown>).discount != null) {
    const discount = Number((item as Record<string, unknown>).discount) || 0;
    if (membershipDetails.membershipType === MEMBERSHIP_TYPE_RECURRING) {
      registrationFees -= discount;
    } else {
      itemPrice -= discount;
    }
    result.totalPrice -= discount;
  }

  if (applyCardFees && (item as Record<string, unknown>).isChargeCreditCardFees) {
    result.showCardFees = true;
    result.cardPercent = cardFeesPercent;
    result.cardFeesOnPriceAmt = getPercentageVal(itemPrice, cardFeesPercent);
    result.cardFeesOnAmt = getPercentageVal(registrationFees, cardFeesPercent);
    result.cardFees = getPercentageVal(result.totalPrice, cardFeesPercent);
    result.totalPrice = Number((result.totalPrice + result.cardFees).toFixed(2));
  }

  if ((item as Record<string, unknown>).isTaxable) {
    result.showTaxable = true;
    result.taxPercent = taxPercent;
    result.totalTaxSub = getPercentageVal(itemPrice + (result.cardFeesOnPriceAmt || 0), taxPercent);
    result.totalTaxReg = getPercentageVal(registrationFees + (result.cardFeesOnAmt || 0), taxPercent);
    result.totalTax = getPercentageVal(result.totalPrice, taxPercent);
    result.totalPrice = Number((result.totalPrice + result.totalTax).toFixed(2));
  }

  const qty = Number((item as Record<string, unknown>).qty) || 1;
  if (qty > 1) {
    result.totalPrice = Number((result.totalPrice * qty).toFixed(2));
  }

  if (typeof result.totalPrice === 'number') {
    result.totalPrice = Number(result.totalPrice.toFixed(2)) as unknown as number;
  }

  return result;
}

export function processOffer(
  offerToApply: OfferToApply,
  recurringMembership: Record<string, unknown> | null,
  item: Record<string, unknown>,
  _offerAppliedOnSecondItemsCount: number
): { discount: number; priceToDiscount: number; offerId: string; isOfferProcessed: boolean } {
  const membershipDetails = (item.membershipDetails || {}) as Record<string, unknown>;
  let priceToDiscount = recurringMembership
    ? Number(membershipDetails.registrationFees) || 0
    : Number(item.price) || 0;
  let discount = 0;
  const discountVal = Number((offerToApply as Record<string, unknown>).discount) || 0;
  const discountType = (offerToApply as Record<string, unknown>).discountType as string;
  if (discountType === PERCENTAGE) {
    discount = Number((((discountVal / 100) * priceToDiscount) as number).toFixed(2));
  } else {
    discount = discountVal;
  }
  return {
    discount,
    priceToDiscount,
    offerId: offerToApply.guId || '',
    isOfferProcessed: true,
  };
}

export function discountIsValid(
  item: Record<string, unknown>,
  offerToApply: OfferToApply
): boolean {
  const membershipDetails = (item.membershipDetails || {}) as Record<string, unknown>;
  const itemDiscount = Number(item.discount) || 0;
  const itemPrice = Number(item.price) || 0;
  const regFees = Number(membershipDetails.registrationFees) || 0;
  if (membershipDetails.membershipType !== 'recurring' && itemDiscount > itemPrice) return false;
  if (membershipDetails.membershipType === 'recurring' && regFees > 0 && itemDiscount > regFees) return false;
  if (!membershipDetails.membershipType && itemDiscount > itemPrice) return false;
  return true;
}

function getProductType(paymentType: string): string {
  const t = (paymentType || '').toLowerCase();
  if (t === 'paid') return 'paidevent';
  if (t === 'free') return 'freeevent';
  if (t === 'donation') return 'donationevent';
  return 'paidevent';
}

export function getItemList(
  item: Record<string, unknown>,
  recurringDonationDetail: Record<string, unknown> = {}
): MembershipListItem[] {
  const newItem: Record<string, unknown> = {
    orgId: item.orgId,
    tenantId: item.tenantId,
    itemId: item.guId,
    itemName: item.name,
    membershipType: (item.membershipDetails as Record<string, unknown>)?.membershipType || '',
    credits: (item.membershipDetails as Record<string, unknown>)?.credits,
    total: item.txnAmount,
    discount: item.discount,
    qty: item.qty || 1,
    currency: item.currency,
    endDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  };

  if (item.eventGuId) {
    newItem.productId = item.eventGuId;
    newItem.productName = item.eventName;
    newItem.productType = getProductType((item.paymentType as string) || '');
    newItem.courseGuId = item.eventGuId;
    newItem.courseType = newItem.productType;
  } else if (item.itemType === 'plan') {
    newItem.productId = (item.membershipDetails as Record<string, unknown>)?.subscriptionPlanId || item.planId || item.guId;
    newItem.productName = item.name;
    newItem.productType = 'plan';
  } else {
    const cat = (item.donationCategory ?? item.category) as Record<string, unknown> | undefined;
    newItem.productId = cat?.guId;
    newItem.productName = cat?.name;
    newItem.productType = item.donationCategory ? 'donationevent' : 'paidevent';
  }

  const membershipDetails = (item.membershipDetails || {}) as Record<string, unknown>;
  if (membershipDetails.membershipType === MEMBERSHIP_TYPE_RECURRING) {
    newItem.subscription = {
      trialPeriod: item.trialPeriod ?? 0,
      billingDay: 0,
      frequency: item.frequency,
      noOfBillingCycles: Number(membershipDetails.numberOfBillingCycles) - 1,
      subscriptionAmount: parseFloat(String(item.subscriptionAmount ?? item.price)),
      subscriptionTotalAmount: parseFloat(String(item.finalSubscriptionAmount)),
      subscriptionCardFees: item.cardFeesOnPriceAmt ?? 0,
      subscriptionTax: item.totalTaxSub ?? 0,
    };
    newItem.itemPrice = parseFloat(String(item.oneTimePayment));
    newItem.itemTotal = parseFloat(String(item.finalOneTimePayment));
    newItem.cardFees = item.cardFeesOnAmt ?? 0;
    newItem.tax = item.totalTaxReg ?? 0;
  } else if ((recurringDonationDetail as Record<string, unknown>).isDonationRecurring) {
    newItem.subscription = {
      frequency: (recurringDonationDetail as Record<string, unknown>).donationRecurringFrequency,
      noOfBillingCycles: (recurringDonationDetail as Record<string, unknown>).donationRecurringLimit,
      subscriptionAmount: parseFloat(String(item.subscriptionAmount ?? item.price)),
      subscriptionTotalAmount: parseFloat(String(item.finalSubscriptionAmount)),
    };
    newItem.itemPrice = 0;
    newItem.itemTotal = 0;
    newItem.cardFees = item.cardFeesOnAmt ?? 0;
    newItem.tax = item.totalTaxReg ?? 0;
    newItem.membershipType = MEMBERSHIP_TYPE_RECURRING;
  } else {
    newItem.itemPrice = parseFloat(String(item.subscriptionAmount ?? item.price));
    newItem.itemTotal = parseFloat(String(item.txnAmount));
    newItem.cardFees = item.cardFeesOnPriceAmt ?? 0;
    newItem.tax = item.totalTaxSub ?? 0;
  }

  return [newItem as MembershipListItem];
}

export function setItemCalc(
  item: Record<string, unknown>,
  result: CartSummary & { totalTaxSub?: number; totalTaxReg?: number; cardFeesOnPriceAmt?: number; cardFeesOnAmt?: number }
): Record<string, unknown> {
  const membershipDetails = (item.membershipDetails || {}) as Record<string, unknown>;
  item.subscriptionAmount = item.price;
  item.oneTimePayment = parseFloat(String(membershipDetails.registrationFees || 0));
  item.txnAmount = parseFloat(String(result.totalPrice));
  item.cardFeesOnPriceAmt = result.cardFeesOnPriceAmt ?? 0;
  item.cardFeesOnAmt = result.cardFeesOnAmt ?? 0;
  item.totalTaxSub = result.totalTaxSub ?? 0;
  item.totalTaxReg = result.totalTaxReg ?? 0;
  item.finalSubscriptionAmount =
    parseFloat(String(item.price)) + (result.cardFeesOnPriceAmt ?? 0) + (result.totalTaxSub ?? 0);
  item.finalOneTimePayment =
    Number(item.oneTimePayment) + (result.cardFeesOnAmt ?? 0) + (result.totalTaxReg ?? 0) - parseFloat(String(item.discount || 0));
  return item;
}

export function getFilterByPrice<T extends { price?: number; isOtherPrice?: boolean }>(arr: T[]): T[] {
  if (!arr?.length) return [];
  const withPrice = arr.filter((i) => !i.isOtherPrice).sort((a, b) => (a.price || 0) - (b.price || 0));
  const otherPrice = arr.filter((i) => i.isOtherPrice);
  return [...withPrice, ...otherPrice];
}

export function initUser(): CheckoutUserForm {
  return {
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    note: '',
    address: undefined,
    guardians: [],
    customFields: [],
  };
}

export function initCartSummary(): CartSummary {
  return {
    totalPrice: 0,
    totalTax: 0,
    cardFees: 0,
    cardPercent: 0,
    taxPercent: 0,
    showTaxable: false,
    showCardFees: false,
    itemDiscount: 0,
    recurringInfo: undefined,
    bankFees: 0,
    bankPercent: 0,
    showBankFees: false,
  };
}

export function getLastName(nameParts: string[]): string {
  if (!nameParts || nameParts.length <= 1) return '';
  return nameParts.slice(1).join(' ');
}
