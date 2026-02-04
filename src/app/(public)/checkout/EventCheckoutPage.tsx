import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appLoadService } from '@/app/core/app-load';
import { eventService } from '@/services/eventService';
import { checkoutService } from '@/services/checkoutService';
import { useCheckoutCart } from '@/hooks/useCheckoutCart';
import { CheckoutUserForm, OrderSummary, PaymentForm, CheckoutSuccess } from '@/components/checkout';
import type { EventCheckoutPayload, PaymentTransactionInfo, ItemTenantDto } from '@/types/checkout';
import { getItemList, getFilterByPrice } from '@/utils/checkoutUtil';
import { Loader2, RefreshCw } from 'lucide-react';

const DEFAULT_EVENT_IMAGE = 'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';

export default function EventCheckoutPage() {
  const { eventId, itemId, schedule: _schedule } = useParams<{ eventId: string; itemId: string; schedule: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [itemList, setItemList] = useState<Record<string, unknown>[]>([]);
  const [itemTenant, setItemTenant] = useState<ItemTenantDto | null>(null);
  const [thumbnail, setThumbnail] = useState(DEFAULT_EVENT_IMAGE);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingOption, setIsChangingOption] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [_invoiceDetails, setInvoiceDetails] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingOffer, setIsApplyingOffer] = useState(false);
  const paymentFormRef = useRef<HTMLDivElement>(null);

  const tenant = appLoadService.tenantDetails;
  const orgGuId = tenant?.orgGuId;
  const tenantId = tenant?.tenantId;
  const orgId = tenant?.orgId;

  const { user, setUser, cartSummary, offerToApply, offerCodeInput, setOfferCodeInput, resetOffer, applyOfferFromCode } = useCheckoutCart({
    item,
    itemTenant,
    applyCardFees: true,
  });

  useEffect(() => {
    if (!eventId || !itemId) {
      setError('Missing event or membership.');
      setIsPageLoading(false);
      return;
    }
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const tenantRes = tenant ?? (await appLoadService.initAppConfig());
        if (!tenantRes?.orgGuId || cancelled) return;
        const eventData = await eventService.getPublicEventByUrl(tenantRes.orgGuId, eventId);
        if (cancelled) return;
        if (!eventData) {
          setError('Event not found.');
          setIsPageLoading(false);
          return;
        }
        setEvent(eventData as unknown as Record<string, unknown>);
        const memberships = (eventData as { memberships?: Record<string, unknown>[] }).memberships;
        if (Array.isArray(memberships) && memberships.length > 0) {
          const filtered = getFilterByPrice(
            memberships.map((m) => ({
              ...m,
              price: Number((m as { price?: number }).price) || 0,
              isOtherPrice: !!(m as { isOtherPrice?: boolean }).isOtherPrice,
            }))
          );
          setItemList(filtered);
        } else {
          setItemList([]);
        }
        if (eventData.imageUrl && tenantRes.cloudName) {
          setThumbnail(
            eventData.imageUrl.startsWith('http')
              ? eventData.imageUrl
              : `https://res.cloudinary.com/${tenantRes.cloudName}/image/upload/${eventData.imageUrl}`
          );
        }
        const membership = await checkoutService.getMembershipDetails(tenantRes.orgId, itemId);
        if (cancelled) return;
        if (!membership) {
          setError('Membership option not found.');
          setIsPageLoading(false);
          return;
        }
        setItem({ ...membership, qty: 1 } as Record<string, unknown>);
        const tenantResDto = await checkoutService.getItemTenant(tenantRes.orgGuId);
        if (!cancelled) setItemTenant(tenantResDto.dto);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load checkout.');
        }
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, itemId, orgGuId, tenant]);

  const handlePriceChange = useCallback(
    async (selectedGuId: string) => {
      if (!orgId || !tenantId || selectedGuId === item?.guId) return;
      setIsChangingOption(true);
      setError(null);
      try {
        const membership = await checkoutService.getMembershipDetails(orgId, selectedGuId);
        if (membership) setItem({ ...membership, qty: 1 } as Record<string, unknown>);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load option.');
      } finally {
        setIsChangingOption(false);
      }
    },
    [orgId, tenantId, item?.guId]
  );

  const handleTransactionReady = useCallback(
    async (info: PaymentTransactionInfo) => {
      if (!tenantId || !orgId || !event || !item) return;
      setIsSubmitting(true);
      try {
        const enrichedItem = {
          ...item,
          eventGuId: event.guId,
          eventName: event.name,
          orgId,
          tenantId,
          paymentType: (event.paymentType as string) || 'paid',
        };
        const itemList = getItemList(enrichedItem, {});
        const totalVal = typeof cartSummary.totalPrice === 'number'
          ? cartSummary.totalPrice.toFixed(2)
          : String(cartSummary.totalPrice);
        const payload: EventCheckoutPayload = {
          tenantId,
          contactId: '',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          customFields: user.customFields,
          guardians: [],
          offerCode: offerToApply?.guId ?? '',
          discountTotal: cartSummary.itemDiscount ?? 0,
          total: totalVal,
          notes: user.note,
          currency: itemTenant?.currency ?? 'USD',
          membershipList: itemList,
          payment: {
            amount: totalVal,
            currency: itemTenant?.currency ?? 'USD',
            nonce: info.nonce,
            methodId: info.methodId ?? '',
            methodType: info.methodType ?? '',
            paymentType: info.paymentType ?? 'none',
            paymentIntent: info.paymentIntent ?? '',
            isSaveCard: false,
            isPayLater: info.methodType === 'paylater',
          },
          event: {
            scheduleId: event.scheduleId as string | undefined,
            classStartTime: event.startTime as number | undefined,
            guId: event.guId as string,
          },
        };
        await checkoutService.validationCheckoutPayload(payload as unknown as Record<string, unknown>);
        const result = await checkoutService.productCheckout(payload);
        setInvoiceDetails(result);
        setShowSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [tenantId, orgId, event, item, user, cartSummary, offerToApply, itemTenant]
  );

  if (isPageLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (error && !item && !event) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="mt-4 text-primary underline"
        >
          Back to events
        </button>
      </div>
    );
  }
  if (error && event && !item) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-primary underline"
        >
          Go back
        </button>
      </div>
    );
  }
  if (showSuccess) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <CheckoutSuccess
          title="Registration complete"
          message="Thank you for registering. You will receive a confirmation email shortly."
          backLabel="Back to events"
          onBack={() => navigate('/events')}
        />
      </div>
    );
  }

  const total = typeof cartSummary.totalPrice === 'number'
    ? cartSummary.totalPrice
    : parseFloat(String(cartSummary.totalPrice)) || 0;
  const currency = itemTenant?.currency ?? 'USD';
  const paymentKeys = itemTenant?.paymentKeys ?? [];

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      {event && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <img
            src={thumbnail}
            alt=""
            className="h-40 w-full rounded-lg object-cover sm:h-48 sm:w-64"
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {String(event.name ?? 'Event')}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Complete your registration below.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {itemList.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Select option</h3>
              <div className="flex flex-wrap gap-2">
                {itemList.map((membership) => {
                  const guId = String((membership as { guId?: string }).guId ?? '');
                  const price = Number((membership as { price?: number }).price) ?? 0;
                  const isOtherPrice = !!(membership as { isOtherPrice?: boolean }).isOtherPrice;
                  const membershipTypeStr = String((membership as { membershipTypeStr?: string }).membershipTypeStr ?? (membership as { membershipType?: string }).membershipType ?? '');
                  const isRecurring = membershipTypeStr.toLowerCase() === 'recurring';
                  const isSelected = Boolean(item && String((item as { guId?: string }).guId) === guId);
                  return (
                    <label
                      key={guId}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500'
                      } ${isChangingOption ? 'pointer-events-none opacity-70' : ''}`}
                    >
                      <input
                        type="radio"
                        name="priceOption"
                        value={guId}
                        checked={isSelected}
                        onChange={() => handlePriceChange(guId)}
                        className="sr-only"
                        disabled={isChangingOption}
                      />
                      {isRecurring && (
                        <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                      <span className="font-medium">
                        {isOtherPrice ? 'Other' : `${currency} ${price.toFixed(2)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
              {isChangingOption && (
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading option…
                </p>
              )}
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <CheckoutUserForm
              value={user}
              onChange={setUser}
              showTitle={true}
            />
          </div>
        </div>
        <div className="space-y-6">
          <OrderSummary
            cartSummary={cartSummary}
            currency={currency}
            itemName={item ? String(item.name ?? '') : undefined}
            itemQty={Number(item?.qty) || 1}
            offerCode={offerCodeInput}
            onOfferCodeChange={setOfferCodeInput}
            onApplyOffer={async () => {
              if (offerToApply != null || !item || !tenantId) return;
              setIsApplyingOffer(true);
              try {
                const r = await checkoutService.getOfferItem(offerCodeInput, tenantId, false, '', String(item.guId));
                if (r?.data) applyOfferFromCode(r.data as import('@/types/checkout').OfferToApply);
                else if (r?.error?.errors?.message) setError(r.error.errors.message);
              } finally {
                setIsApplyingOffer(false);
              }
            }}
            isApplyingOffer={isApplyingOffer}
            offerApplied={!!offerToApply}
            onResetOffer={resetOffer}
          />
          <div ref={paymentFormRef}>
            <PaymentForm
              amount={total}
              currency={currency}
              paymentKeys={paymentKeys}
              userContact={user}
              allowZero={true}
              allowCash={true}
              submitLabel={total === 0 ? 'Complete registration' : 'Pay now'}
              onTransactionReady={handleTransactionReady}
              onError={setError}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
