import { toast } from 'sonner';

import AvailabilityCalendar from '@/components/accounts/AvailabilityCalendar';
import { useAddSlot, useMyAvailability, useRemoveSlot } from '@/hooks/useAvailability';

export default function AvailabilityPage() {
  const { data, isLoading, isError } = useMyAvailability();
  const add = useAddSlot();
  const remove = useRemoveSlot();

  if (isLoading) return <p className="p-6">Loading your availability…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load your availability. Please try again later.</p>;
  }

  return (
    <div className="flex flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">My availability</h1>
      <AvailabilityCalendar
        slots={data.slots}
        onAddSlot={(slot) =>
          add.mutate(slot, {
            onError: () => toast.error('Could not save that slot. It may overlap an existing one.'),
          })
        }
        onRemoveSlot={(slotId) =>
          remove.mutate(slotId, {
            onError: () => toast.error('Could not remove that slot. Please try again.'),
          })
        }
      />
    </div>
  );
}
