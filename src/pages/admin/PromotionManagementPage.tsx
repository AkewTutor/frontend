import { useState } from 'react';
import { toast } from 'sonner';

import PromotionForm from '@/components/admin-payments/PromotionForm';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { useActivePromotions, useCreatePromotion } from '@/hooks/usePromotions';
import { formatMoney } from '@/lib/money';

function apiMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export default function PromotionManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { data, isLoading, isError } = useActivePromotions();
  const create = useCreatePromotion();

  const renderList = () => {
    if (isLoading) return <p role="status">Loading promotions…</p>;
    if (isError || !data || !Array.isArray(data.promotions)) {
      return <p role="alert">Could not load promotions.</p>;
    }
    if (data.promotions.length === 0) return <EmptyState message="No active promotions." />;
    return (
      <ul className="flex flex-col gap-2">
        {data.promotions.map((promo) => (
          <li
            key={promo.code}
            className="flex items-center justify-between gap-3 rounded-m border border-border p-3"
          >
            <span className="text-m font-semibold">{promo.code}</span>
            <span className="text-s text-muted-foreground">
              {promo.discountType === 'PERCENT'
                ? `${promo.discountValue}% off`
                : `${formatMoney(promo.discountValue)} off`}{' '}
              · until {new Date(promo.validTo).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-md p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-l font-bold">Promotions</h1>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          New promotion
        </Button>
      </div>

      {showForm && (
        <PromotionForm
          key={formKey}
          isSubmitting={create.isPending}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: () => {
                toast.success('Promotion created.');
                setFormKey((k) => k + 1);
                setShowForm(false);
              },
              onError: (error) => toast.error(apiMessage(error, 'Could not create the promotion.')),
            })
          }
        />
      )}

      {renderList()}
    </div>
  );
}
