import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CartSummary } from '@/types/checkout';
import { cn } from '@/lib/utils';

function formatMoney(amount: number | string, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '0.00';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency || ''} ${n.toFixed(2)}`;
  }
}

export interface OrderSummaryProps {
  cartSummary: CartSummary;
  currency: string;
  itemName?: string;
  itemQty?: number;
  showQtySelector?: boolean;
  onQtyChange?: (qty: number) => void;
  offerCode?: string;
  onOfferCodeChange?: (code: string) => void;
  onApplyOffer?: () => void;
  isApplyingOffer?: boolean;
  offerApplied?: boolean;
  onResetOffer?: () => void;
  className?: string;
}

const QTY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function OrderSummary({
  cartSummary,
  currency,
  itemName,
  itemQty = 1,
  showQtySelector = false,
  onQtyChange,
  offerCode = '',
  onOfferCodeChange,
  onApplyOffer,
  isApplyingOffer = false,
  offerApplied = false,
  onResetOffer,
  className,
}: OrderSummaryProps) {
  const total = typeof cartSummary.totalPrice === 'number'
    ? cartSummary.totalPrice
    : parseFloat(String(cartSummary.totalPrice)) || 0;

  return (
    <Card className={cn('border border-gray-200 dark:border-gray-700 shadow-none', className)}>
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {itemName && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{itemName}</span>
            {showQtySelector && onQtyChange ? (
              <span className="flex items-center gap-2">
                <label className="text-xs">Qty</label>
                <select
                  value={itemQty}
                  onChange={(e) => onQtyChange(Number(e.target.value))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  {QTY_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </span>
            ) : (
              itemQty > 1 && <span>× {itemQty}</span>
            )}
          </div>
        )}
        {cartSummary.showCardFees && cartSummary.cardFees > 0 && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Card processing fee</span>
            <span>{formatMoney(cartSummary.cardFees, currency)}</span>
          </div>
        )}
        {cartSummary.showTaxable && cartSummary.totalTax > 0 && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Tax</span>
            <span>{formatMoney(cartSummary.totalTax, currency)}</span>
          </div>
        )}
        {cartSummary.itemDiscount > 0 && (
          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
            <span>Discount</span>
            <span>-{formatMoney(cartSummary.itemDiscount, currency)}</span>
          </div>
        )}
        {offerApplied && onResetOffer && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Offer applied</span>
            <button
              type="button"
              onClick={onResetOffer}
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Remove
            </button>
          </div>
        )}
        {(onOfferCodeChange != null || onApplyOffer != null) && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Input
              placeholder="Offer code"
              value={offerCode}
              onChange={(e) => onOfferCodeChange?.(e.target.value)}
              className="flex-1 min-w-[120px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onApplyOffer}
              disabled={isApplyingOffer || !offerCode.trim()}
            >
              {isApplyingOffer ? 'Applying…' : 'Apply'}
            </Button>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatMoney(total, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
