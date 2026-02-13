import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appLoadService } from '@/app/core/app-load';
import { checkoutService } from '@/services/checkoutService';
import { courseService } from '@/services/courseService';
import { useCheckoutCart } from '@/hooks/useCheckoutCart';
import { CheckoutUserForm, OrderSummary, PaymentForm, CheckoutSuccess } from '@/components/checkout';
import type { ItemCheckoutPayload, PaymentTransactionInfo, ItemTenantDto } from '@/types/checkout';
import { getItemList, getFilterByPrice } from '@/utils/checkoutUtil';
import { Loader2, RefreshCw } from 'lucide-react';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg';

export default function CourseCheckoutPage() {
  const { categoryId, itemId: routeItemId } = useParams<{ categoryId: string; itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [itemList, setItemList] = useState<Record<string, unknown>[]>([]);
  const [itemTenant, setItemTenant] = useState<ItemTenantDto | null>(null);
  const [thumbnail, setThumbnail] = useState(DEFAULT_IMAGE);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingOffer, setIsApplyingOffer] = useState(false);

  const tenant = appLoadService.tenantDetails;
  const tenantId = tenant?.tenantId;
  const orgId = tenant?.orgId;

  const { user, setUser, cartSummary, offerToApply, offerCodeInput, setOfferCodeInput, resetOffer, applyOfferFromCode } = useCheckoutCart({
    item,
    itemTenant,
    applyCardFees: true,
  });

  useEffect(() => {
    // Route: /checkout/course/:categoryId/:itemId — categoryId = course URL (slug) or guId; itemId = membership guId
    if (!categoryId || !routeItemId) {
      setError('Missing course or membership.');
      setIsPageLoading(false);
      return;
    }
    const abortController = new AbortController();
    const signal = abortController.signal;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const tenantRes = appLoadService.tenantDetails ?? (await appLoadService.initAppConfig());
        if (!tenantRes?.tenantId || !tenantRes?.orgGuId || cancelled) {
          setError('Failed to load tenant.');
          setIsPageLoading(false);
          return;
        }

        // pcourse API requires course URL handle (slug), not guId — resolve first so we never call it with guId
        let courseUrlHandle = '';
        if (categoryId.includes('-')) {
          courseUrlHandle = categoryId;
        } else {
          const publicCourses = await courseService.getPublicCourses(tenantRes.tenantId, signal);
          if (cancelled) return;
          const list = Array.isArray(publicCourses) ? publicCourses : (publicCourses as { data?: unknown[] })?.data ?? [];
          const course = list.find(
            (c: unknown) =>
              String((c as { guId?: string })?.guId) === String(categoryId) ||
              String((c as { url?: string })?.url)?.replace(/^\//, '') === String(categoryId)
          ) as { url?: string } | undefined;
          if (course?.url) courseUrlHandle = String(course.url).replace(/^\//, '');
        }

        if (!courseUrlHandle) {
          setError('Course not found.');
          setIsPageLoading(false);
          return;
        }

        const courseRes = await courseService.getPublicCourseDetail(tenantRes.tenantId, courseUrlHandle, signal);
        if (cancelled) return;
        const data = courseRes?.data as unknown as Record<string, unknown> | undefined;
        if (!data) {
          setError('Course not found.');
          setIsPageLoading(false);
          return;
        }

        const memberships = (data.memberships ?? []) as Array<Record<string, unknown>>;
        const selected = Array.isArray(memberships)
          ? memberships.find((m) => String(m?.guId ?? m?._id ?? '') === String(routeItemId))
          : undefined;
        if (!selected) {
          setError('Membership option not found.');
          setIsPageLoading(false);
          return;
        }

        setError(null);
        const category = (selected.category ?? data) as Record<string, unknown>;
        setItem({ ...selected, category, qty: 1 } as Record<string, unknown>);

        const filtered = getFilterByPrice(
          memberships.map((m) => ({
            ...m,
            price: Number((m as { price?: number }).price) || 0,
            isOtherPrice: !!(m as { isOtherPrice?: boolean }).isOtherPrice,
          }))
        );
        setItemList(filtered);

        const tenantResDto = await checkoutService.getItemTenant(tenantRes.orgGuId);
        if (!cancelled) setItemTenant(tenantResDto.dto);

        const imagePath = (data.image1 ?? category?.imageUrl) as string | undefined;
        if (imagePath && tenantRes.cloudName) {
          setThumbnail(
            String(imagePath).startsWith('http')
              ? String(imagePath)
              : `https://res.cloudinary.com/${tenantRes.cloudName}/image/upload/${imagePath}`
          );
        }
      } catch (e) {
        if (!cancelled && (e as { name?: string })?.name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Failed to load checkout.');
        }
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [categoryId, routeItemId]);

  const handlePriceChange = useCallback(
    (selectedGuId: string) => {
      if (selectedGuId === (item as { guId?: string } | null)?.guId) return;
      setError(null);
      const membership = itemList.find((m) => String((m as { guId?: string }).guId) === selectedGuId);
      if (membership) {
        const category = (membership.category ?? item?.category) as Record<string, unknown> | undefined;
        setItem({ ...membership, category, qty: 1 } as Record<string, unknown>);
      }
    },
    [item, itemList]
  );

  const handleTransactionReady = useCallback(
    async (info: PaymentTransactionInfo) => {
      if (!tenantId || !orgId || !item) return;
      setIsSubmitting(true);
      try {
        const itemList = getItemList(item, {});
        const totalVal = typeof cartSummary.totalPrice === 'number'
          ? cartSummary.totalPrice.toFixed(2)
          : String(cartSummary.totalPrice);
        const category = item.category as Record<string, unknown> | undefined;
        const payload: ItemCheckoutPayload = {
          tenantId,
          contactId: '',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          customFields: user.customFields,
          registrationFormId: category?.registrationFormId as string | undefined,
          offerCode: offerToApply?._id ?? offerToApply?.guId ?? '',
          discountTotal: (item.discount as number) ?? 0,
          total: totalVal,
          notes: user.note,
          currency: itemTenant?.currency ?? 'USD',
          membershipList: itemList,
          attendeeList: [],
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
        };
        await checkoutService.validationCheckoutPayload(payload as unknown as Record<string, unknown>);
        await checkoutService.productCheckout(payload);
        setShowSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [tenantId, orgId, item, user, cartSummary, offerToApply, itemTenant]
  );

  const stillLoading = isPageLoading || (!item && !error);
  if (stillLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (error && !item) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button type="button" onClick={() => navigate('/courses')} className="mt-4 text-primary underline">
          Back to courses
        </button>
      </div>
    );
  }
  if (showSuccess) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <CheckoutSuccess
          title="Purchase complete"
          message="Thank you for your purchase. You will receive a confirmation email shortly."
          backLabel="Back to courses"
          onBack={() => navigate('/courses')}
        />
      </div>
    );
  }

  const total = typeof cartSummary.totalPrice === 'number'
    ? cartSummary.totalPrice
    : parseFloat(String(cartSummary.totalPrice)) || 0;
  const currency = itemTenant?.currency ?? 'USD';
  const paymentKeys = itemTenant?.paymentKeys ?? [];
  const category = item?.category as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <img src={thumbnail} alt="" className="h-40 w-full rounded-lg object-cover sm:h-48 sm:w-64" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {category?.name ? String(category.name) : String(item?.name ?? 'Course')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Complete your purchase below.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {itemList.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Select option</h3>
              <div className="flex flex-wrap gap-2">
                {itemList.map((membership) => {
                  const guId = String((membership as { guId?: string }).guId ?? '');
                  const price = Number((membership as { price?: number }).price) || 0;
                  const isOtherPrice = !!(membership as { isOtherPrice?: boolean }).isOtherPrice;
                  const membershipTypeStr = String((membership as { membershipTypeStr?: string }).membershipTypeStr ?? (membership as { membershipType?: string }).membershipType ?? '');
                  const isRecurring = membershipTypeStr.toLowerCase() === 'recurring';
                  const isSelected = Boolean(item && String((item as { guId?: string }).guId) === guId);
                  return (
                    <label
                      key={guId}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-500 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priceOption"
                        value={guId}
                        checked={isSelected}
                        onChange={() => handlePriceChange(guId)}
                        className="sr-only"
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
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <CheckoutUserForm value={user} onChange={setUser} showTitle={true} />
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
                const r = await checkoutService.getOfferItem(offerCodeInput, tenantId, false, String(categoryId || category?.guId || ''), String(item.guId));
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
          <PaymentForm
            amount={total}
            currency={currency}
            paymentKeys={paymentKeys}
            userContact={user}
            allowZero={true}
            allowCash={false}
            submitLabel={total === 0 ? 'Complete registration' : 'Pay now'}
            onTransactionReady={handleTransactionReady}
            onError={setError}
            disabled={isSubmitting}
          />
        </div>
      </div>
      {error && (
        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
