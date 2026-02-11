import { useEffect, useRef, useState, useCallback } from 'react';

const STRIPE_SCRIPT = 'https://js.stripe.com/v3/';

declare global {
  interface Window {
    Stripe?: (key: string, options?: { stripeAccount?: string }) => {
      elements: (options?: { clientSecret?: string }) => {
        create: (type: string, options?: Record<string, unknown>) => {
          mount: (el: HTMLElement) => void;
          on: (event: string, handler: (e: { error?: { message?: string } }) => void) => void;
          unmount: () => void;
        };
      };
      createPaymentMethod: (params: { type: string; card?: unknown; billing_details?: Record<string, unknown> }) => Promise<{ error?: { message?: string }; paymentMethod?: { id: string } }>;
    };
  }
}

/** Card style options aligned with v5 StripeService.getStripeCardStyleOptions() */
const STRIPE_CARD_STYLE = {
  style: {
    base: {
      iconColor: '#000000',
      color: '#000000',
      fontWeight: '500',
      fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
      fontSize: '17px',
      fontSmoothing: 'antialiased',
      ':-webkit-autofill': { color: '#3c4252' },
      '::placeholder': { color: '#3c4252' },
    },
    invalid: {
      iconColor: '#fa755a',
      color: '#fa755a',
    },
  },
};

export interface UseStripeCardOptions {
  publishableKey: string | undefined;
  stripeAccount?: string;
  enabled: boolean;
}

export function useStripeCard({ publishableKey, stripeAccount, enabled }: UseStripeCardOptions) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type StripeInstance = NonNullable<Window['Stripe']> extends (key: string, opts?: { stripeAccount?: string }) => infer R ? R : never;
  const stripeRef = useRef<StripeInstance | null>(null);
  const cardElementRef = useRef<{ mount: (el: HTMLElement) => void; unmount: () => void; on: (event: string, handler: (e: { error?: { message?: string } }) => void) => void } | null>(null);

  const setCardRef = useCallback((el: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    setContainerReady(!!el);
  }, []);

  useEffect(() => {
    if (!enabled || !publishableKey) return;

    let mounted = true;

    if (window.Stripe) {
      setScriptReady(true);
      return () => {
        mounted = false;
      };
    }

    const existing = document.querySelector(`script[src="${STRIPE_SCRIPT}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.src = STRIPE_SCRIPT;
      script.async = true;
      script.onload = () => {
        if (mounted) setScriptReady(true);
      };
      script.onerror = () => {
        if (mounted) setError('Failed to load Stripe.');
      };
      document.body.appendChild(script);
      return () => {
        mounted = false;
      };
    }

    const poll = setInterval(() => {
      if (window.Stripe) {
        setScriptReady(true);
        clearInterval(poll);
      }
    }, 100);
    return () => clearInterval(poll);
  }, [enabled, publishableKey, stripeAccount]);

  useEffect(() => {
    if (!scriptReady || !containerReady || !cardRef.current || !enabled || !publishableKey) return;

    let mounted = true;
    const Stripe = window.Stripe;
    const mountEl = cardRef.current;
    if (!Stripe || !mountEl) return;

    try {
      let finalKey = publishableKey;
      if (publishableKey?.startsWith('pk_live_') && window.location.protocol === 'http:') {
        console.warn('Stripe Live keys require HTTPS. Using test key to prevent crash in development.');
        finalKey = 'pk_test_TYooMQauvdEDq54NiTphI7jx';
      }

      const stripe = stripeAccount
        ? Stripe(finalKey, { stripeAccount })
        : Stripe(finalKey);
      stripeRef.current = stripe;
      const elements = stripe.elements();
      const card = elements.create('card', STRIPE_CARD_STYLE);
      card.mount(mountEl);
      card.on('change', (e: { error?: { message?: string } }) => {
        if (mounted) setError(e.error?.message ?? null);
      });
      cardElementRef.current = card;
      if (mounted) setIsReady(true);
    } catch (e) {
      if (mounted) setError(e instanceof Error ? e.message : 'Stripe error');
    }

    return () => {
      mounted = false;
      cardElementRef.current?.unmount?.();
      stripeRef.current = null;
      cardElementRef.current = null;
    };
  }, [scriptReady, containerReady, enabled, publishableKey, stripeAccount]);

  const getPaymentMethodId = useCallback(async (): Promise<string | null> => {
    const stripe = stripeRef.current;
    const card = cardElementRef.current;
    if (!stripe || !card) return null;
    const result = await stripe.createPaymentMethod({ type: 'card', card });
    if (result.error) {
      setError(result.error.message ?? 'Card error');
      return null;
    }
    return result.paymentMethod?.id ?? null;
  }, []);

  const confirmCardSetup = useCallback(async (clientSecret: string, data?: { billing_details?: Record<string, unknown> }) => {
    const stripe = stripeRef.current;
    const card = cardElementRef.current;
    if (!stripe || !card) return { error: { message: 'Stripe not initialized' } };

    // @ts-ignore - Stripe types are loose here
    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card,
        billing_details: data?.billing_details,
      },
    });

    if (result.error) {
      setError(result.error.message ?? 'Card setup error');
    }
    return result;
  }, []);

  return { cardRef: setCardRef, isReady, error, getPaymentMethodId, confirmCardSetup };
}
