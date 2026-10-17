import { useState } from 'react';
import { toast } from 'sonner';

import ManualAssignmentForm, {
  type PickerOption,
} from '@/components/admin-matching/ManualAssignmentForm';
import { useManualAssign } from '@/hooks/useAdminMatching';
import { useUsers } from '@/hooks/useAdminPeople';
import { useSubjects } from '@/hooks/useSubjects';
import type { AdminUser } from '@/types';

const toOption = (user: AdminUser): PickerOption => ({
  id: user.id,
  label: user.email ?? user.phone ?? user.id,
});

export default function ManualAssignmentPage() {
  const [subjectId, setSubjectId] = useState('');
  const [tutorTerm, setTutorTerm] = useState('');
  const [studentTerm, setStudentTerm] = useState('');
  const [formKey, setFormKey] = useState(0);

  const subjects = useSubjects();
  const tutors = useUsers(1, 'TUTOR', tutorTerm.trim() || undefined, subjectId || undefined);
  const students = useUsers(1, 'STUDENT', studentTerm.trim() || undefined, subjectId || undefined);
  const assign = useManualAssign();

  const handleSubmit = (values: Parameters<typeof assign.mutate>[0]) => {
    assign.mutate(values, {
      onSuccess: () => {
        toast.success('Cohort assigned. It is now in the approval queue.');
        setSubjectId('');
        setTutorTerm('');
        setStudentTerm('');
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

      {subjects.isLoading ? (
        <p>Loading…</p>
      ) : subjects.isError || !subjects.data ? (
        <p>We couldn&apos;t load subjects. Please try again later.</p>
      ) : (
        <ManualAssignmentForm
          key={formKey}
          subjects={subjects.data.subjects}
          tutors={subjectId ? (tutors.data?.users ?? []).map(toOption) : []}
          students={subjectId ? (students.data?.users ?? []).map(toOption) : []}
          onSubjectChange={setSubjectId}
          onTutorSearch={setTutorTerm}
          onStudentSearch={setStudentTerm}
          onSubmit={handleSubmit}
          isSubmitting={assign.isPending}
        />
      )}
    </div>
  );
}
