import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { appLoadService } from '@/app/core/app-load';
import { checkoutService } from '@/services/checkoutService';
import { useCheckoutCart } from '@/hooks/useCheckoutCart';
import { CheckoutUserForm, OrderSummary, PaymentForm, CheckoutSuccess } from '@/components/checkout';
import type { ItemCheckoutPayload, PaymentTransactionInfo, ItemTenantDto } from '@/types/checkout';
import { getItemList } from '@/utils/checkoutUtil';
import { Loader2 } from 'lucide-react';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg';

export default function CourseCheckoutPage() {
  const { categoryId, itemId: routeItemId } = useParams<{ categoryId: string; itemId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productType = searchParams.get('productType')?.toLowerCase();
  const _isPlanCheckout = productType === 'plan' || productType === 'paln';

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
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
  const orgGuId = tenant?.orgGuId;

  const { user, setUser, cartSummary, offerToApply, offerCodeInput, setOfferCodeInput, resetOffer, applyOfferFromCode } = useCheckoutCart({
    item,
    itemTenant,
    applyCardFees: true,
  });

  const itemId = routeItemId || categoryId;

  useEffect(() => {
    if (!orgId || !orgGuId || !itemId) {
      setError('Missing course or membership.');
      setIsPageLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const tenantRes = tenant || (await appLoadService.initAppConfig());
        if (!tenantRes?.orgId || !tenantRes?.orgGuId || cancelled) return;
        const membership = await checkoutService.getMembershipDetails(tenantRes.orgId, itemId);
        if (!membership || cancelled) {
          setError('Membership option not found.');
          setIsPageLoading(false);
          return;
        }
        setItem({ ...membership, qty: 1 } as Record<string, unknown>);
        const tenantResDto = await checkoutService.getItemTenant(tenantRes.orgGuId);
        if (!cancelled) setItemTenant(tenantResDto.dto);
        const cat = (membership as Record<string, unknown>).category as Record<string, unknown> | undefined;
        if (cat?.imageUrl && tenantRes.cloudName) {
          setThumbnail(
            String(cat.imageUrl).startsWith('http')
              ? String(cat.imageUrl)
              : `https://res.cloudinary.com/${tenantRes.cloudName}/image/upload/${cat.imageUrl}`
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load checkout.');
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, orgGuId, itemId, tenant]);

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

  if (isPageLoading) {
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
            allowCash={true}
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
