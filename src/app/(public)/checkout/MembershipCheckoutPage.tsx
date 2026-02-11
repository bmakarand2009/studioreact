import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { appLoadService } from '@/app/core/app-load';
import { checkoutService } from '@/services/checkoutService';
import { publicMembershipService } from '@/services/publicMembershipService';
import { useCheckoutCart } from '@/hooks/useCheckoutCart';
import { CheckoutUserForm, PaymentForm, CheckoutSuccess } from '@/components/checkout';
import type { ItemCheckoutPayload, PaymentTransactionInfo, ItemTenantDto, PlanCheckoutPayload } from '@/types/checkout';
import { getItemList } from '@/utils/checkoutUtil';
import { Loader2 } from 'lucide-react';

// const DEFAULT_IMAGE = 'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg';

export default function MembershipCheckoutPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isChangePlan = searchParams.get('isChangePlan') === 'true';

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [itemTenant, setItemTenant] = useState<ItemTenantDto | null>(null);
  // const [thumbnail, setThumbnail] = useState(DEFAULT_IMAGE);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const paymentFormRef = useRef<HTMLDivElement>(null);

  // Local state for tenant details to ensure checkout works even if global app config is partial
  const [checkoutTenantId, setCheckoutTenantId] = useState<string>('');
  const [checkoutOrgId, setCheckoutOrgId] = useState<string>('');

  const tenant = appLoadService.tenantDetails;
  const tenantId = tenant?.tenantId;
  const orgId = tenant?.orgId;

  const { user, setUser, cartSummary, offerToApply } = useCheckoutCart({
    item,
    itemTenant,
    applyCardFees: true,
  });

  // Hardcoded tenant ID fallback matching PublicMembershipsPage
  const DEFAULT_TENANT_ID = '9xP0p480zR';

  useEffect(() => {
    if (!itemId) {
      setError('Missing membership plan.');
      setIsPageLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const tenantRes = tenant || (await appLoadService.initAppConfig());
        // For plan checkout, we can rely on DEFAULT_TENANT_ID if needed
        const currentTenantId = tenantRes?.tenantId || DEFAULT_TENANT_ID;
        
        if (cancelled) return;

        // Fetch using publicMembershipService
        // Note: getPublicPricing expects tenantId (short ID like '9xP0p480zR')
        console.log('Fetching public pricing for:', itemId, 'Tenant:', currentTenantId);
        const pricing = await publicMembershipService.getPublicPricing(itemId, currentTenantId);
        console.log('Pricing response:', pricing);
        
        if (pricing) {
             // Map PlanPricing to the structure expected by checkout
             const membership = {
                 ...pricing,
                 guId: pricing._id,
                 name: pricing.planName,
                 // For recurring, price is usually 0 and subscriptionPrice has the amount
                 // For one-time, price has the amount
                 price: pricing.paymentType === 'recurring' 
                  ? ((pricing.subscriptionAmount || 0) + (pricing.oneTimePayment || 0))
                  : (pricing.oneTimePayment || 0),
                 subscriptionPrice: pricing.paymentType === 'recurring' ? (pricing.subscriptionAmount || 0) : 0,
                 registrationFees: pricing.paymentType === 'recurring' ? (pricing.oneTimePayment || 0) : 0,
                 membershipType: pricing.paymentType,
                 itemType: 'plan', // Ensure getItemList handles this as a plan
                 planId: pricing._id,
                 qty: 1,
                 category: { name: 'Membership Plan' }, // Dummy category for display
                 membershipDetails: {
                    membershipType: pricing.paymentType,
                    registrationFees: pricing.paymentType === 'recurring' ? (pricing.oneTimePayment || 0) : 0,
                    subscriptionPlanId: pricing._id,
                 }
             };
             setItem({ ...membership, qty: 1 } as Record<string, unknown>);
             
             // Use tenantId (short code) for getItemTenant as requested
             // Fallback to orgGuId if tenantId is missing, but prefer currentTenantId (9xP0p480zR)
             const tenantIdForConfig = currentTenantId || tenantRes?.orgGuId;
             console.log('Fetching item tenant config for:', tenantIdForConfig);
             
             if (tenantIdForConfig) {
                 const tenantResDto = await checkoutService.getItemTenant(tenantIdForConfig);
                 if (!cancelled && tenantResDto?.dto) {
                     setItemTenant(tenantResDto.dto);
                     // Initialize checkout IDs from response or fallback
                     setCheckoutTenantId(tenantResDto.dto.tid || tenantIdForConfig);
                     setCheckoutOrgId(tenantResDto.dto.orgId || tenantRes?.orgId || '');
                 }
             } else if (!cancelled) {
                  setCheckoutTenantId(tenantRes?.tenantId || DEFAULT_TENANT_ID);
                  setCheckoutOrgId(tenantRes?.orgId || '');
             }
             
             // Set thumbnail if available (though plans might not have images)
             // const cat = (membership as Record<string, unknown>).category as Record<string, unknown> | undefined;
             // if (cat?.imageUrl && tenantRes?.cloudName) { ... }
        } else {
             if (!cancelled) {
                 console.error('Membership not found. ItemId:', itemId);
                 setError('Membership option not found.');
             }
        }

      } catch (e) {
        console.error('Checkout load error:', e);
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load checkout.');
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, tenant]);

  const handleTransactionReady = useCallback(
    async (info: PaymentTransactionInfo) => {
      // Use local state if available (preferred), otherwise fall back to appLoadService vars
      const finalTenantId = checkoutTenantId || tenantId;
      const finalOrgId = checkoutOrgId || orgId;

      if (!finalTenantId || !finalOrgId || !item) {
          console.error('Missing checkout details:', { finalTenantId, finalOrgId, item });
          return;
      }
      setIsSubmitting(true);
      try {
        const enrichedItem = {
            ...item,
            orgId: finalOrgId,
            tenantId: finalTenantId,
            // Ensure paymentType and other fields match event checkout payload requirements
            paymentType: item.membershipType || (item as any).paymentType || 'paid',
        };
        const itemList = getItemList(enrichedItem, {});
        const totalVal = typeof cartSummary.totalPrice === 'number'
          ? cartSummary.totalPrice.toFixed(2)
          : String(cartSummary.totalPrice);
        const category = item.category as Record<string, unknown> | undefined;
        
        // Construct payload matching plan checkout structure
        const planPayload: PlanCheckoutPayload = {
          tenantId: finalTenantId,
          orgId: finalOrgId,
          contactId: '', // Guest checkout
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          // item comes from pricing, so it has productId and _id (pricingId)
          planId: (item as any).productId,
          pricingId: (item as any)._id,
          productId: (item as any).productId,
          productName: (item as any).planName || (item as any).name,
          isChangePlan: isChangePlan,
          currency: currency,
          payment: {
            amount: typeof total === 'number' ? total : parseFloat(total),
            currency: currency,
            nonce: info.nonce,
            methodId: info.methodId ?? '',
            methodType: info.methodType ?? '',
            paymentType: info.paymentType ?? 'none',
            paymentIntent: info.paymentIntent ?? '',
            isSaveCard: false,
            isPayLater: info.methodType === 'paylater',
            paymentDate: new Date().toISOString(),
            notes: user.note || '',
            cvv: '',
            zipCode: '',
          },
        };

        // Use membershipPlanCheckout instead of productCheckout
        await checkoutService.membershipPlanCheckout(planPayload);
        setShowSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [tenantId, orgId, checkoutTenantId, checkoutOrgId, item, user, cartSummary, offerToApply, itemTenant, isChangePlan]
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
        <button type="button" onClick={() => navigate('/memberships')} className="mt-4 text-primary underline">
          Back to memberships
        </button>
      </div>
    );
  }
  if (showSuccess) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <CheckoutSuccess
          title="Membership Activated"
          message="Your membership plan has been successfully purchased. You will receive a confirmation email shortly."
          backLabel="Back to memberships"
          onBack={() => navigate('/memberships')}
        />
      </div>
    );
  }

  const total = typeof cartSummary.totalPrice === 'number'
    ? cartSummary.totalPrice
    : parseFloat(String(cartSummary.totalPrice)) || 0;
  const currency = itemTenant?.currency ?? 'USD';
  
  // Prepare payment keys
  const rawPaymentKeys = itemTenant?.paymentKeys ?? [];
  const paymentKeys = [...rawPaymentKeys];

  const category = item?.category as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* <img src={thumbnail} alt="" className="h-40 w-full rounded-lg object-cover sm:h-48 sm:w-64" /> */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {category?.name ? String(category.name) : String(item?.name ?? 'Membership Plan')}
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
          <div ref={paymentFormRef}>
            <PaymentForm
              amount={total}
              currency={currency}
              paymentKeys={paymentKeys}
              userContact={user}
              allowZero={false}
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
