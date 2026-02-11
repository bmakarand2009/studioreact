import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { useStripeCard } from '@/hooks/useStripeCard';
import type { PaymentKey, PaymentTransactionInfo, CheckoutUserForm } from '@/types/checkout';
import { PAYMENT_PROVIDERS } from '@/types/checkout';
import { cn } from '@/lib/utils';

const PROVIDER_STRIPE = PAYMENT_PROVIDERS.STRIPE;
const PROVIDER_RAZORPAY = PAYMENT_PROVIDERS.RAZORPAY;
const PROVIDER_PHONEPE = PAYMENT_PROVIDERS.PHONEPE;
const PROVIDER_NONE = PAYMENT_PROVIDERS.NONE;

export interface PaymentFormProps {
  amount: number;
  currency: string;
  paymentKeys: PaymentKey[];
  userContact: Pick<CheckoutUserForm, 'firstName' | 'lastName' | 'email' | 'phone' | 'note'>;
  allowCash?: boolean;
  allowPayLater?: boolean;
  allowZero?: boolean;
  termsLabel?: React.ReactNode;
  privacyUrl?: string;
  termsUrl?: string;
  submitLabel?: string;
  onTransactionReady: (info: PaymentTransactionInfo) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PaymentForm({
  amount,
  currency,
  paymentKeys,
  userContact,
  allowCash = true,
  allowPayLater = false,
  allowZero = true,
  termsLabel,
  privacyUrl,
  termsUrl,
  submitLabel = 'Pay now',
  onTransactionReady,
  onError,
  disabled = false,
  className,
}: PaymentFormProps) {
  const stripeKey = paymentKeys.find((k) => k.provider?.toLowerCase() === PROVIDER_STRIPE);
  const stripeCard = useStripeCard({
    publishableKey: stripeKey?.apiKey,
    stripeAccount: stripeKey?.clientId,
    enabled: !!stripeKey && amount > 0,
  });
  const isStripeReady = stripeCard.isReady;
  const stripeError = stripeCard.error ?? undefined;

  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    if (amount === 0) return 'zero';
    const hasStripe = paymentKeys.some((k) => k.provider?.toLowerCase() === PROVIDER_STRIPE);
    if (hasStripe) return 'card';
    const hasRazorpay = paymentKeys.some((k) => k.provider?.toLowerCase() === PROVIDER_RAZORPAY);
    if (hasRazorpay) return 'razorpay';
    const hasPhonepe = paymentKeys.some((k) => k.provider?.toLowerCase() === PROVIDER_PHONEPE);
    if (hasPhonepe) return 'phonepe';
    if (allowCash) return 'cash';
    return 'card';
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStripeIntegrated = paymentKeys.some((k) => k.provider?.toLowerCase() === PROVIDER_STRIPE);
  const isRazorpayIntegrated = paymentKeys.some((k) => k.provider?.toLowerCase() === PROVIDER_RAZORPAY);
  const isPhonepeIntegrated = paymentKeys.some((k) => k.provider?.toLowerCase() === PROVIDER_PHONEPE);
  const hasCard = isStripeIntegrated;
  const showZero = amount === 0 && allowZero;
  const showCash = allowCash && amount > 0;
  const showPayLater = allowPayLater && amount > 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!termsAccepted && (termsUrl || privacyUrl)) {
        onError?.('Please accept the terms and privacy policy.');
        return;
      }
      setIsSubmitting(true);
      try {
        if (paymentMethod === 'zero') {
          await onTransactionReady({
            paymentType: PROVIDER_NONE,
            methodType: 'zero',
          });
          return;
        }
        if (paymentMethod === 'cash' || paymentMethod === 'paylater') {
          await onTransactionReady({
            paymentType: PROVIDER_NONE,
            methodType: paymentMethod,
          });
          return;
        }
        if (paymentMethod === 'card' && isStripeIntegrated) {
          const paymentMethodId = await stripeCard.getPaymentMethodId();
          if (!paymentMethodId) return;
          await onTransactionReady({
            methodId: paymentMethodId,
            nonce: '',
            paymentType: PROVIDER_STRIPE,
            methodType: '',
          });
          return;
        }
        if (paymentMethod === 'razorpay' && isRazorpayIntegrated) {
          await onTransactionReady({
            paymentType: PROVIDER_RAZORPAY,
            methodType: 'razorpay',
          });
          return;
        }
        if (paymentMethod === 'phonepe' && isPhonepeIntegrated) {
          await onTransactionReady({
            paymentType: PROVIDER_PHONEPE,
            methodType: 'phonepe',
          });
          return;
        }
        onError?.('Please select a valid payment method.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      termsAccepted,
      termsUrl,
      privacyUrl,
      paymentMethod,
      isStripeIntegrated,
      isRazorpayIntegrated,
      isPhonepeIntegrated,
      stripeCard,
      onTransactionReady,
      onError,
    ]
  );

  return (
    <Card className={cn('border border-gray-200 dark:border-gray-700 shadow-none', className)}>
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Payment Information
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {hasCard && amount > 0 && (
              <div>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">Card</span>
                </label>
                {paymentMethod === 'card' && isStripeIntegrated && (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div
                      ref={stripeCard.cardRef}
                      id="payment-form-stripe-card"
                      className="min-h-[40px]"
                    />
                    {!isStripeReady && (
                      <p className="mt-2 text-sm text-gray-500">Loading secure payment form…</p>
                    )}
                    {stripeError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{stripeError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {showZero && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'zero'}
                  onChange={() => setPaymentMethod('zero')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Member Checkout (free)</span>
              </label>
            )}
            {showCash && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Cash</span>
              </label>
            )}
            {showPayLater && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'paylater'}
                  onChange={() => setPaymentMethod('paylater')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Pay later</span>
              </label>
            )}
            {isRazorpayIntegrated && amount > 0 && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Razorpay</span>
              </label>
            )}
            {isPhonepeIntegrated && amount > 0 && currency === 'INR' && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'phonepe'}
                  onChange={() => setPaymentMethod('phonepe')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Phonepe</span>
              </label>
            )}
          </div>

          {(termsUrl || privacyUrl || termsLabel) && (
            <div className="flex items-start gap-2">
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                id="checkout-terms"
              />
              <label htmlFor="checkout-terms" className="text-sm text-gray-600 dark:text-gray-400">
                {termsLabel ?? (
                  <>
                    I agree to the{' '}
                    {termsUrl && (
                      <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        Terms of Service
                      </a>
                    )}
                    {termsUrl && privacyUrl && ' and '}
                    {privacyUrl && (
                      <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        Privacy Policy
                      </a>
                    )}
                  </>
                )}
              </label>
            </div>
          )}

          {!termsUrl && !privacyUrl && !termsLabel && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                id="checkout-terms-none"
              />
              <label htmlFor="checkout-terms-none" className="text-sm text-gray-600 dark:text-gray-400">
                I agree to complete this purchase.
              </label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full text-lg py-4 rounded-xl"
            disabled={
              disabled ||
              isSubmitting ||
              (paymentMethod === 'card' && isStripeIntegrated && !isStripeReady) ||
              (!termsAccepted && !(paymentMethod === 'zero'))
            }
          >
            {isSubmitting ? 'Processing…' : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
