import { useState } from 'react';
import { toast } from 'sonner';

import PricingConfigForm, { type PricingBody } from '@/components/admin-payments/PricingConfigForm';
import { useActivePricing, useUpdatePricing } from '@/hooks/usePricing';
import type { CohortFormat } from '@/types';

const LABEL: Record<CohortFormat, string> = {
  ONE_TO_ONE: 'One-to-one',
  ONE_TO_THREE: 'One-to-three',
  ONE_TO_FIVE: 'One-to-five',
};

function apiMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export default function PricingConfigPage() {
  const { data, isLoading, isError } = useActivePricing();
  const update = useUpdatePricing();
  const [savingFormat, setSavingFormat] = useState<CohortFormat | null>(null);
  const [errors, setErrors] = useState<Partial<Record<CohortFormat, string>>>({});

  const handleSave = (format: CohortFormat, body: PricingBody) => {
    setSavingFormat(format);
    setErrors((prev) => ({ ...prev, [format]: undefined }));
    update.mutate(
      { format, ...body },
      {
        onSuccess: () => toast.success(`${LABEL[format]} pricing saved.`),
        onError: (error) =>
          setErrors((prev) => ({
            ...prev,
            [format]: apiMessage(error, 'Could not save pricing.'),
          })),
        onSettled: () => setSavingFormat(null),
      }
    );
  };

  const renderBody = () => {
    if (isLoading) return <p role="status">Loading pricing…</p>;
    if (isError || !data || !Array.isArray(data.pricing)) {
      return <p role="alert">Could not load pricing.</p>;
    }
    return data.pricing.map((item) => (
      <section key={item.format} className="flex flex-col gap-space-md">
        <h2 className="text-m font-semibold">{LABEL[item.format]}</h2>
        <PricingConfigForm
          key={`${item.format}-${item.pricePerStudentPerHour}-${item.platformSharePerHour}-${item.tutorSharePerHour}`}
          format={item.format}
          current={item}
          isSaving={savingFormat === item.format}
          serverError={errors[item.format] ?? null}
          onSave={(body) => handleSave(item.format, body)}
        />
      </section>
    ));
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-lg p-6">
      <h1 className="text-l font-bold">Pricing</h1>
      <p className="text-s text-muted-foreground">
        Changes apply to new bookings only. Existing payments are never altered.
      </p>
      {renderBody()}
    </div>
  );
}
