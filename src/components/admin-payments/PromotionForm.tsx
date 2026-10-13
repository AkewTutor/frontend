import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isDecimalBetween } from '@/lib/money';

export interface PromotionValues {
  code: string;
  discountType: 'PERCENT' | 'FIXED_ETB';
  discountValue: string;
  validFrom: string;
  validTo: string;
}

interface PromotionFormProps {
  onSubmit: (values: PromotionValues) => void;
  isSubmitting: boolean;
}

const AMOUNT = /^\d+(\.\d{1,2})?$/;

export default function PromotionForm({ onSubmit, isSubmitting }: PromotionFormProps) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED_ETB'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    const value = discountValue.trim();

    if (!trimmedCode) return setError('Code is required.');
    if (!AMOUNT.test(value)) return setError('Enter a value like 10 or 150.50.');
    if (discountType === 'PERCENT' && !isDecimalBetween(value, '1', '100')) {
      return setError('Percent must be between 1 and 100.');
    }
    if (discountType === 'FIXED_ETB' && !isDecimalBetween(value, '0.01', '1000000000')) {
      return setError('Amount must be above 0.');
    }
    if (!validFrom || !validTo) return setError('Start and end dates are required.');
    if (new Date(validTo) <= new Date(validFrom)) {
      return setError('End date must be after start date.');
    }

    setError(null);
    onSubmit({
      code: trimmedCode,
      discountType,
      discountValue: value,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo).toISOString(),
    });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-m border border-border p-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="promo-code">Code</Label>
        <Input id="promo-code" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="promo-type">Discount type</Label>
        <select
          id="promo-type"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FIXED_ETB')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="PERCENT">Percent</option>
          <option value="FIXED_ETB">Fixed amount (ETB)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="promo-value">Discount value</Label>
        <Input
          id="promo-value"
          type="text"
          inputMode="decimal"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="promo-from">Valid from</Label>
        <Input
          id="promo-from"
          type="datetime-local"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="promo-to">Valid to</Label>
        <Input
          id="promo-to"
          type="datetime-local"
          value={validTo}
          onChange={(e) => setValidTo(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-s text-danger">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          Create promotion
        </Button>
      </div>
    </form>
  );
}
