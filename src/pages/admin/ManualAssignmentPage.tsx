import { useState } from 'react';
import { toast } from 'sonner';

import ManualAssignmentForm, {
  type PickerOption,
} from '@/components/admin-matching/ManualAssignmentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useManualAssign } from '@/hooks/useAdminMatching';
import { useUsers } from '@/hooks/useAdminPeople';
import type { AdminUser } from '@/types';

const toOption = (user: AdminUser): PickerOption => ({
  id: user.id,
  label: user.email ?? user.phone ?? user.id,
});

export default function ManualAssignmentPage() {
  const [draft, setDraft] = useState('');
  const [term, setTerm] = useState<string | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  const tutors = useUsers(1, 'TUTOR', term);
  const students = useUsers(1, 'STUDENT', term);
  const assign = useManualAssign();

  const handleSubmit = (values: Parameters<typeof assign.mutate>[0]) => {
    assign.mutate(values, {
      onSuccess: () => {
        toast.success('Cohort assigned. It is now in the approval queue.');
        setFormKey((k) => k + 1);
      },
      onError: (error) => {
        const message = error.response?.data?.message;
        toast.error(typeof message === 'string' ? message : 'Could not assign this cohort.');
      },
    });
  };

  return (
    <div className="space-y-space-md p-6">
      <h1 className="text-l font-bold">Manual assignment</h1>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(draft.trim() || undefined);
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="people-search">Search people</Label>
          <Input id="people-search" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {tutors.isLoading || students.isLoading ? (
        <p>Loading people…</p>
      ) : tutors.isError || students.isError || !tutors.data || !students.data ? (
        <p>We couldn&apos;t load people. Please try again later.</p>
      ) : (
        <ManualAssignmentForm
          key={formKey}
          tutors={tutors.data.users.map(toOption)}
          students={students.data.users.map(toOption)}
          onSubmit={handleSubmit}
          isSubmitting={assign.isPending}
        />
      )}
    </div>
  );
}
