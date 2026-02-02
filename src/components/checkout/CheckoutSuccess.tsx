import React from 'react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckoutSuccessProps {
  title?: string;
  message?: string;
  backLabel?: string;
  backHref?: string;
  onBack?: () => void;
  invoiceHref?: string;
  invoiceLabel?: string;
  className?: string;
}

export function CheckoutSuccess({
  title = 'Payment successful',
  message = 'Thank you for your purchase. You will receive a confirmation email shortly.',
  backLabel = 'Back to home',
  backHref,
  onBack,
  invoiceHref,
  invoiceLabel = 'View invoice',
  className,
}: CheckoutSuccessProps) {
  return (
    <Card className={cn('border border-gray-200 dark:border-gray-700 shadow-none max-w-lg mx-auto', className)}>
      <CardContent className="pt-8 pb-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {backHref && (
            <a href={backHref} className={buttonVariants({ variant: 'outline' })}>
              {backLabel}
            </a>
          )}
          {onBack && !backHref && (
            <Button variant="outline" onClick={onBack}>
              {backLabel}
            </Button>
          )}
          {invoiceHref && (
            <a href={invoiceHref} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
              {invoiceLabel}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
