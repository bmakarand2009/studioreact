import React, { useEffect, useState, useCallback, useRef } from 'react';
import { appLoadService } from '@/app/core/app-load';
import { checkoutService } from '@/services/checkoutService';
import { publicMembershipService } from '@/services/publicMembershipService';
import { apiService } from '@/services/api';
import { authService } from '@/services/authService';
import { useCheckoutCart } from '@/hooks/useCheckoutCart';
import { CheckoutUserForm, PaymentForm, CheckoutSuccess } from '@/components/checkout';
import type { PaymentTransactionInfo, ItemTenantDto, PlanCheckoutPayload } from '@/types/checkout';
import { getItemList } from '@/utils/checkoutUtil';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

interface StudentMembershipCheckoutProps {
  itemId: string;
  onCancel: () => void;
  onSuccess: () => void;
  isChangePlan?: boolean;
}

export function StudentMembershipCheckout({ 
  itemId, 
  onCancel, 
  onSuccess,
  isChangePlan = false
}: StudentMembershipCheckoutProps) {
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [itemTenant, setItemTenant] = useState<ItemTenantDto | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const paymentFormRef = useRef<HTMLDivElement>(null);

  // Local state for tenant details
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

  // Hardcoded tenant ID matching requirements
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
        // Use the tenant ID from the requirement
        const currentTenantId = DEFAULT_TENANT_ID;
        
        if (cancelled) return;

        // Fetch user contact details
        try {
          const currentUser = await authService.getCurrentUser();
          const contactId = currentUser?.guId || currentUser?.id || currentUser?.contactId;
          
          if (contactId) {
            // Fetch detailed contact info as requested
            // Using the pattern /snode/contact/{contactId}
            // If the user specifically requested /snode/contact/a8AD433WAO, we use that if it matches or as a fallback/example
            // We will prioritize the actual logged-in user's ID
            console.log('Fetching contact details for:', contactId);
            const contactRes = await apiService.get<any>(`/snode/contact/${contactId}`);
            const contactData = contactRes.data || contactRes;
            
            if (contactData) {
              let { firstName, lastName } = contactData;
              
              // Fallback to splitting 'name' if firstName/lastName are missing
              if ((!firstName || !lastName) && contactData.name) {
                const nameParts = contactData.name.trim().split(/\s+/);
                if (!firstName && nameParts.length > 0) firstName = nameParts[0];
                if (!lastName && nameParts.length > 1) lastName = nameParts.slice(1).join(' ');
              }

              setUser({
                firstName: firstName || '',
                lastName: lastName || '',
                email: contactData.email || '',
                phone: contactData.phone || '',
                address: contactData.address || '',
                city: contactData.city || '',
                state: contactData.state || '',
                zipCode: contactData.zipCode || '',
                country: contactData.country || '',
                note: '',
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch contact details:', err);
          // Continue without pre-filling if fails
        }

        console.log('Fetching public pricing for:', itemId, 'Tenant:', currentTenantId);
        const pricing = await publicMembershipService.getPublicPricing(itemId, currentTenantId);
        console.log('Pricing response:', pricing);
        
        if (pricing) {
             // Map PlanPricing to the structure expected by checkout
             const membership = {
                 ...pricing,
                 guId: pricing._id,
                 name: pricing.planName,
                 price: pricing.paymentType === 'recurring' 
                  ? ((pricing.subscriptionAmount || 0) + (pricing.oneTimePayment || 0))
                  : (pricing.oneTimePayment || 0),
                 subscriptionPrice: pricing.paymentType === 'recurring' ? (pricing.subscriptionAmount || 0) : 0,
                 registrationFees: pricing.paymentType === 'recurring' ? (pricing.oneTimePayment || 0) : 0,
                 membershipType: pricing.paymentType,
                 itemType: 'plan',
                 planId: pricing._id,
                 qty: 1,
                 category: { name: 'Membership Plan' },
                 membershipDetails: {
                    membershipType: pricing.paymentType,
                    registrationFees: pricing.paymentType === 'recurring' ? (pricing.oneTimePayment || 0) : 0,
                    subscriptionPlanId: pricing._id,
                 }
             };
             setItem({ ...membership, qty: 1 } as Record<string, unknown>);
             
             // Fetch item tenant config
             const tenantIdForConfig = currentTenantId;
             console.log('Fetching item tenant config for:', tenantIdForConfig);
             
             if (tenantIdForConfig) {
                 const tenantResDto = await checkoutService.getItemTenant(tenantIdForConfig);
                 if (!cancelled && tenantResDto?.dto) {
                     setItemTenant(tenantResDto.dto);
                     setCheckoutTenantId(tenantResDto.dto.tid || tenantIdForConfig);
                     setCheckoutOrgId(tenantResDto.dto.orgId || tenantRes?.orgId || '');
                 }
             } else if (!cancelled) {
                  setCheckoutTenantId(tenantRes?.tenantId || DEFAULT_TENANT_ID);
                  setCheckoutOrgId(tenantRes?.orgId || '');
             }
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
  }, [itemId, tenant, setUser]);

  const handleTransactionReady = useCallback(
    async (info: PaymentTransactionInfo) => {
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
            paymentType: item.membershipType || (item as any).paymentType || 'paid',
        };
        const itemList = getItemList(enrichedItem, {});
        const totalVal = typeof cartSummary.totalPrice === 'number'
          ? cartSummary.totalPrice.toFixed(2)
          : String(cartSummary.totalPrice);
        
        const planPayload: PlanCheckoutPayload = {
          tenantId: finalTenantId,
          orgId: finalOrgId,
          contactId: '', // Guest checkout or handled by backend if auth token present
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          planId: (item as any).productId,
          pricingId: (item as any)._id,
          productId: (item as any).productId,
          productName: (item as any).planName || (item as any).name,
          isChangePlan: isChangePlan,
          currency: currency,
          payment: {
            amount: typeof totalVal === 'number' ? totalVal : parseFloat(totalVal),
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
            zipCode: user.zipCode || '',
          },
        };

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
        <Button onClick={onCancel} variant="ghost" className="mt-4 text-primary">
          Back to plans
        </Button>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <CheckoutSuccess
          title="Membership Activated"
          message="Your membership plan has been successfully purchased. You will receive a confirmation email shortly."
          backLabel="Back to My Plan"
          onBack={onSuccess}
        />
      </div>
    );
  }

  const total = typeof cartSummary.totalPrice === 'number'
    ? cartSummary.totalPrice
    : parseFloat(String(cartSummary.totalPrice)) || 0;
  const currency = itemTenant?.currency ?? 'USD';
  
  const rawPaymentKeys = itemTenant?.paymentKeys ?? [];
  const paymentKeys = [...rawPaymentKeys];

  const category = item?.category as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
       <div className="mb-6">
         <Button 
           variant="ghost" 
           className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
           onClick={onCancel}
         >
           <ArrowLeft className="h-4 w-4" />
           Back to plans
         </Button>
       </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
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
