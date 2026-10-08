import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import ResubmitVerificationCard from '@/components/accounts/ResubmitVerificationCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMyTutorProfile, useUpdateTutorProfile } from '@/hooks/useTutorProfile';
import type { TutorProfile } from '@/types';

interface FormValues {
  bio: string;
  experienceDescription: string;
  educationInstitution: string;
  degree: string;
}

const toValues = (p: TutorProfile): FormValues => ({
  bio: p.bio ?? '',
  experienceDescription: p.experienceDescription ?? '',
  educationInstitution: p.educationInstitution ?? '',
  degree: p.degree ?? '',
});

export default function TutorProfilePage() {
  const { data, isLoading, isError } = useMyTutorProfile();
  if (isLoading) return <p className="p-6">Loading your profile…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load your profile. Please try again later.</p>;
  }
  return <TutorProfileForm profile={data} />;
}

function TutorProfileForm({ profile }: { profile: TutorProfile }) {
  const update = useUpdateTutorProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({ values: toValues(profile) });

  const onSubmit = (values: FormValues) => {
    // verificationStatus is admin-only and never sent.
    const body: Partial<Record<keyof FormValues, string>> = {};
    (Object.keys(values) as (keyof FormValues)[]).forEach((k) => {
      const t = values[k].trim();
      if (t) body[k] = t;
    });
    update.mutate(body, {
      onSuccess: () => {
        reset(values);
        toast.success('Profile saved.');
      },
      onError: () => toast.error('Could not save your profile. Please try again.'),
    });
  };

  const status = profile.verificationStatus;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-md p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-l font-bold">My profile</h1>
        <StatusBadge status={status} severity={status === 'VERIFIED' ? 'success' : undefined} />
      </div>

      {status === 'PENDING' && <p className="text-m">Your application is under review.</p>}
      {status === 'REJECTED' && (
        <ResubmitVerificationCard verificationStatus={status} hasUnsavedChanges={isDirty} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" {...register('bio')} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="experienceDescription">Experience</Label>
          <Textarea id="experienceDescription" {...register('experienceDescription')} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="educationInstitution">Institution</Label>
          <Input id="educationInstitution" {...register('educationInstitution')} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="degree">Degree</Label>
          <Input id="degree" {...register('degree')} />
        </div>
        <Button type="submit" className="self-start" disabled={!isDirty || update.isPending}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
