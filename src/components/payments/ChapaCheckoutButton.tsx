import { Button } from '@/components/ui/button';
import { useInitiatePayment } from '@/hooks/usePayments';

interface Props {
  cohortMembershipId: string;
  promotionCode?: string;
}

export default function ChapaCheckoutButton({ cohortMembershipId, promotionCode }: Props) {
  const { mutate, isPending, isSuccess, error } = useInitiatePayment();
  const busy = isPending || isSuccess; // isSuccess: browser is about to leave the page

  const pay = () =>
    mutate(
      { cohortMembershipId, promotionCode: promotionCode?.trim() || undefined },
      { onSuccess: (data) => window.location.assign(data.chapaCheckoutUrl) }
    );

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={pay} disabled={busy}>
        {busy ? 'Redirecting to Chapa…' : 'Pay with Chapa'}
      </Button>
      {error && (
        <p role="alert" className="text-s text-danger">
          {(error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Could not start payment. Please try again.'}
        </p>
      )}
    </div>
  );
}
