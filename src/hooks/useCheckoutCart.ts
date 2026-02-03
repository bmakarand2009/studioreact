import { useCallback, useMemo, useState } from 'react';
import {
  calculateCartSummary,
  setItemCalc,
  initUser,
  initCartSummary,
  processOffer,
  discountIsValid,
  getItemList,
  getFilterByPrice,
} from '@/utils/checkoutUtil';
import type {
  CartSummary,
  CheckoutUserForm,
  ItemTenantDto,
  MembershipListItem,
  OfferToApply,
} from '@/types/checkout';

export interface UseCheckoutCartInput {
  item: Record<string, unknown> | null;
  itemTenant: ItemTenantDto | null;
  applyCardFees?: boolean;
}

export function useCheckoutCart({ item, itemTenant, applyCardFees = true }: UseCheckoutCartInput) {
  const [user, setUser] = useState<CheckoutUserForm>(initUser);
  const [offerToApply, setOfferToApply] = useState<OfferToApply | null>(null);
  const [offerCodeInput, setOfferCodeInput] = useState('');

  const taxPercent = itemTenant?.tax ?? itemTenant?.taxPercent ?? 0;
  const cardFeesPercent = itemTenant?.cardFees ?? 0;
  const bankFeesPercent = itemTenant?.bankFees ?? 0;
  const recurringMembership =
    item?.membershipDetails && (item.membershipDetails as Record<string, unknown>).membershipType === 'recurring'
      ? (item.membershipDetails as Record<string, unknown>)
      : null;

  const cartSummary = useMemo((): CartSummary & {
    totalTaxSub?: number;
    totalTaxReg?: number;
    cardFeesOnPriceAmt?: number;
    cardFeesOnAmt?: number;
  } => {
    if (!item || !itemTenant) return initCartSummary();
    const result = calculateCartSummary({
      item,
      user: user as unknown as Record<string, unknown>,
      recurringMembership,
      offerToApply,
      taxPercent,
      cardFeesPercent,
      bankFeesPercent,
      applyCardFees,
    });
    setItemCalc(item, result);
    return result;
  }, [item, itemTenant, user, offerToApply, taxPercent, cardFeesPercent, bankFeesPercent, applyCardFees, recurringMembership]);

  const resetOffer = useCallback(() => {
    setOfferToApply(null);
    if (item) {
      (item as Record<string, unknown>).discount = undefined;
      (item as Record<string, unknown>).offerId = undefined;
      (item as Record<string, unknown>).priceToDiscount = undefined;
    }
  }, [item]);

  const applyOfferFromCode = useCallback(
    (offer: OfferToApply | null) => {
      if (!offer || !item) return false;
      const result = processOffer(offer, recurringMembership, item as Record<string, unknown>, 0);
      if (!result.isOfferProcessed) return false;
      (item as Record<string, unknown>).priceToDiscount = result.priceToDiscount;
      (item as Record<string, unknown>).discount = result.discount;
      (item as Record<string, unknown>).offerId = offer.guId || (offer as Record<string, unknown>)._id;
      if (!discountIsValid(item as Record<string, unknown>, offer)) {
        resetOffer();
        return false;
      }
      setOfferToApply(offer);
      return true;
    },
    [item, recurringMembership, resetOffer]
  );

  const membershipList = useMemo((): MembershipListItem[] => {
    if (!item) return [];
    return getItemList(item as Record<string, unknown>, {});
  }, [item]);

  return {
    user,
    setUser,
    cartSummary,
    offerToApply,
    offerCodeInput,
    setOfferCodeInput,
    resetOffer,
    applyOfferFromCode,
    membershipList,
    getFilterByPrice,
  };
}
