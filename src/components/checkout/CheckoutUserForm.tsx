import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { CheckoutUserForm as CheckoutUserFormType, CustomFieldConfig } from '@/types/checkout';
import { cn } from '@/lib/utils';

export interface CheckoutUserFormProps {
  value: CheckoutUserFormType;
  onChange: (user: CheckoutUserFormType) => void;
  customFields?: CustomFieldConfig[];
  customFieldValues?: Record<string, string>;
  onCustomFieldChange?: (guId: string, value: string) => void;
  disabled?: boolean;
  showTitle?: boolean;
  showAddress?: boolean;
  className?: string;
}

export function CheckoutUserForm({
  value,
  onChange,
  customFields = [],
  customFieldValues = {},
  onCustomFieldChange,
  disabled = false,
  showTitle = true,
  showAddress = false,
  className,
}: CheckoutUserFormProps) {
  const update = (field: keyof CheckoutUserFormType, val: string | undefined) => {
    onChange({ ...value, [field]: val ?? '' });
    if ((field === 'firstName' || field === 'lastName') && (value.firstName || value.lastName || val)) {
      const first = field === 'firstName' ? (val ?? '') : value.firstName;
      const last = field === 'lastName' ? (val ?? '') : value.lastName;
      onChange({ ...value, [field]: val ?? '', fullName: [first, last].filter(Boolean).join(' ') });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {showTitle && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Customer Information
        </h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          value={value.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          disabled={disabled}
          placeholder="First name"
        />
        <Input
          label="Last name"
          required
          value={value.lastName}
          onChange={(e) => update('lastName', e.target.value)}
          disabled={disabled}
          placeholder="Last name"
        />
      </div>
      <Input
        label="Email"
        type="email"
        required
        value={value.email}
        onChange={(e) => update('email', e.target.value)}
        disabled={disabled}
        placeholder="Email"
      />
      <Input
        label="Phone"
        type="tel"
        value={value.phone}
        onChange={(e) => update('phone', e.target.value)}
        disabled={disabled}
        placeholder="Phone"
      />
      {showAddress && (
        <div className="space-y-4">
          <Input
            label="Address"
            value={typeof value.address === 'string' ? value.address : value.address?.line1 ?? ''}
            onChange={(e) => update('address', e.target.value)}
            disabled={disabled}
            placeholder="Street address"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              value={value.city ?? ''}
              onChange={(e) => update('city', e.target.value)}
              disabled={disabled}
              placeholder="City"
            />
            <Input
              label="State / Province"
              value={value.state ?? ''}
              onChange={(e) => update('state', e.target.value)}
              disabled={disabled}
              placeholder="State"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ZIP / Postal Code"
              value={value.zipCode ?? ''}
              onChange={(e) => update('zipCode', e.target.value)}
              disabled={disabled}
              placeholder="ZIP code"
            />
            <Input
              label="Country"
              value={value.country ?? ''}
              onChange={(e) => update('country', e.target.value)}
              disabled={disabled}
              placeholder="Country"
            />
          </div>
        </div>
      )}
      <Textarea
        label="Notes (optional)"
        value={value.note ?? ''}
        onChange={(e) => update('note', e.target.value)}
        disabled={disabled}
        placeholder="Any notes for this order"
        rows={3}
      />
      {customFields?.length ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional details</h3>
          {customFields.map((item) => {
            const field = item.customField;
            if (field.isDisabled) return null;
            const val = customFieldValues[field.guId] ?? field.value ?? '';
            const isMandatory = field.isMandatory;
            return (
              <div key={field.guId}>
                {field.type === 'textarea' ? (
                  <Textarea
                    label={field.name}
                    required={isMandatory}
                    value={val}
                    onChange={(e) => onCustomFieldChange?.(field.guId, e.target.value)}
                    disabled={disabled}
                    placeholder={field.name}
                    rows={3}
                  />
                ) : (
                  <Input
                    label={field.name}
                    required={isMandatory}
                    value={val}
                    onChange={(e) => onCustomFieldChange?.(field.guId, e.target.value)}
                    disabled={disabled}
                    placeholder={field.name}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
