import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney, multiplyMoney, sumEquals } from '@/lib/money';
import type { CohortFormat, FormatPricing } from '@/types';

export interface PricingBody {
  pricePerStudentPerHour: string;
  totalPerHour: string;
  platformSharePerHour: string;
  tutorSharePerHour: string;
}

interface PricingConfigFormProps {
  format: CohortFormat;
  current: FormatPricing;
  onSave: (body: PricingBody) => void;
  isSaving?: boolean;
  serverError?: string | null;
}

const GROUP_SIZE: Record<CohortFormat, number> = {
  ONE_TO_ONE: 1,
  ONE_TO_THREE: 3,
  ONE_TO_FIVE: 5,
};

const AMOUNT = /^\d+(\.\d{1,2})?$/;

// Client-side guard only: the backend stays authoritative for the split arithmetic.
export default function PricingConfigForm({
  format,
  current,
  onSave,
  isSaving = false,
  serverError = null,
}: PricingConfigFormProps) {
  const [price, setPrice] = useState(current.pricePerStudentPerHour);
  const [platform, setPlatform] = useState(current.platformSharePerHour);
  const [tutor, setTutor] = useState(current.tutorSharePerHour);

  const p = price.trim();
  const pl = platform.trim();
  const t = tutor.trim();

  const formatOk = [p, pl, t].every((v) => AMOUNT.test(v));
  const total = formatOk ? multiplyMoney(p, GROUP_SIZE[format]) : null;
  const sumsOk = total !== null && sumEquals([pl, t], total);
  const canSave = formatOk && sumsOk && !isSaving;

  let note: string | null = null;
  if (!formatOk) note = 'Enter amounts like 350.00.';
  else if (!sumsOk) note = 'Platform and tutor shares must sum to the total per hour.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || total === null) return;
    onSave({
      pricePerStudentPerHour: p,
      totalPerHour: total,
      platformSharePerHour: pl,
      tutorSharePerHour: t,
    });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-m border border-border p-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${format}-price`}>Price per student per hour</Label>
        <Input
          id={`${format}-price`}
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${format}-platform`}>Platform share per hour</Label>
        <Input
          id={`${format}-platform`}
          type="text"
          inputMode="decimal"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${format}-tutor`}>Tutor share per hour</Label>
        <Input
          id={`${format}-tutor`}
          type="text"
          inputMode="decimal"
          value={tutor}
          onChange={(e) => setTutor(e.target.value)}
        />
      </div>

      {total !== null && (
        <p className="text-s text-muted-foreground">Total per hour: {formatMoney(total)}</p>
      )}
      {note && (
        <p role="note" className="text-s text-danger">
          {note}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-s text-danger">
          {serverError}
        </p>
      )}

      <div>
        <Button type="submit" disabled={!canSave}>
          Save
        </Button>
      </div>
    </form>
  );
}
