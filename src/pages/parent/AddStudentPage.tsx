import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddStudent } from '@/hooks/useGuardianship';

interface FormValues {
  grade: string;
  inviteContact: string;
}

export default function AddStudentPage() {
  const add = useAddStudent();
  const [added, setAdded] = useState<{ relationshipId: string; grade: number } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { grade: '', inviteContact: '' } });

  const onSubmit = (v: FormValues) => {
    const grade = Number(v.grade);
    setAdded(null);
    add.mutate(
      { grade, inviteContact: v.inviteContact.trim() },
      {
        onSuccess: (res) => {
          setAdded({ relationshipId: res.relationshipId, grade });
          reset();
        },
        onError: (error) => {
          const status = (error as { response?: { status?: number } }).response?.status;
          setError('root', {
            message:
              status === 400
                ? 'Grades 6–12 students register independently.'
                : 'Something went wrong. Please try again.',
          });
        },
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Add a student</h1>

      {added && (
        <div role="status" className="rounded-m border border-border p-4 text-m">
          <p>Student added. Reference: {added.relationshipId}</p>
          {added.grade >= 6 && <p>An activation invite has been sent.</p>}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="grade">Grade</Label>
          <Input
            id="grade"
            inputMode="numeric"
            {...register('grade', {
              required: 'Grade is required',
              validate: (v) =>
                (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 12) ||
                'Grade must be 1–12',
            })}
          />
          {errors.grade && (
            <p role="alert" className="text-s text-destructive">
              {errors.grade.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="inviteContact">Student&apos;s email or phone</Label>
          <Input
            id="inviteContact"
            {...register('inviteContact', {
              validate: (v) => v.trim() !== '' || 'Email or phone is required',
            })}
          />
          {errors.inviteContact && (
            <p role="alert" className="text-s text-destructive">
              {errors.inviteContact.message}
            </p>
          )}
        </div>
        {errors.root && (
          <p role="alert" className="text-s text-destructive">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="self-start" disabled={add.isPending}>
          Add student
        </Button>
      </form>
    </div>
  );
}
