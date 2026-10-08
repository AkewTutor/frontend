import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useMyStudentProfile,
  useUpdateAcademicProfile,
  useUpdateProfile,
} from '@/hooks/useStudentProfile';
import { useSubjects } from '@/hooks/useSubjects';
import type { StudentProfile } from '@/types';

const FORMATS = [
  ['', 'No preference'],
  ['ONE_TO_ONE', 'One-to-one'],
  ['ONE_TO_THREE', 'Small group (1-to-3)'],
  ['ONE_TO_FIVE', 'Small group (1-to-5)'],
] as const;

const text = (s: string) => {
  const t = s.trim();
  return t === '' ? undefined : t;
};

export default function AcademicProfilePage() {
  const { data, isLoading, isError } = useMyStudentProfile();
  if (isLoading) return <p className="p-6">Loading your profile…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load your profile. Please try again later.</p>;
  }
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-lg p-6">
      <h1 className="text-l font-bold">My profile</h1>
      <PictureForm profile={data} />
      <AcademicForm profile={data} />
    </div>
  );
}

function PictureForm({ profile }: { profile: StudentProfile }) {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<{ profilePictureUrl: string }>({
    values: { profilePictureUrl: profile.profilePictureUrl ?? '' },
  });

  const onSubmit = (v: { profilePictureUrl: string }) => {
    const url = text(v.profilePictureUrl);
    if (!url) return;
    update.mutate(
      { profilePictureUrl: url },
      {
        onSuccess: () => {
          reset(v);
          toast.success('Picture saved.');
        },
        onError: () => toast.error('Could not save your picture. Please try again.'),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="profilePictureUrl">Profile picture URL</Label>
        <Input id="profilePictureUrl" {...register('profilePictureUrl')} />
      </div>
      <Button type="submit" className="self-start" disabled={!isDirty || update.isPending}>
        Save picture
      </Button>
    </form>
  );
}

interface AcademicValues {
  grade: string;
  school: string;
  academicLevel: string;
  learningGoals: string;
  preferredLanguage: string;
  teachingStylePreference: string;
  budgetPreference: string;
  formatPreference: string;
  subjectsOfInterest: string[];
}

function AcademicForm({ profile }: { profile: StudentProfile }) {
  const update = useUpdateAcademicProfile();
  const subjects = useSubjects().data?.subjects ?? [];
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors },
  } = useForm<AcademicValues>({
    values: {
      grade: String(profile.grade ?? ''),
      school: profile.school ?? '',
      academicLevel: profile.academicLevel ?? '',
      learningGoals: profile.learningGoals ?? '',
      preferredLanguage: profile.preferredLanguage ?? '',
      teachingStylePreference: profile.teachingStylePreference ?? '',
      budgetPreference: profile.budgetPreference ?? '',
      formatPreference: profile.formatPreference ?? '',
      subjectsOfInterest: profile.subjectsOfInterest ?? [],
    },
  });
  const selected = watch('subjectsOfInterest');

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    setValue('subjectsOfInterest', next, { shouldDirty: true });
  };

  const onSubmit = (v: AcademicValues) => {
    const body: Partial<StudentProfile> = {
      grade: v.grade ? Number(v.grade) : undefined,
      school: text(v.school),
      academicLevel: text(v.academicLevel),
      learningGoals: text(v.learningGoals),
      preferredLanguage: text(v.preferredLanguage),
      teachingStylePreference: text(v.teachingStylePreference),
      budgetPreference: text(v.budgetPreference),
      formatPreference: (v.formatPreference || undefined) as StudentProfile['formatPreference'],
      subjectsOfInterest: v.subjectsOfInterest,
    };
    update.mutate(body, {
      onSuccess: () => {
        reset(v);
        toast.success('Academic profile saved.');
      },
      onError: () => toast.error('Could not save your academic profile. Please try again.'),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="grade">Grade</Label>
        <Input
          id="grade"
          inputMode="numeric"
          {...register('grade', {
            validate: (v) =>
              v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 12)
                ? true
                : 'Grade must be 1–12',
          })}
        />
        {errors.grade && (
          <p role="alert" className="text-s text-destructive">
            {errors.grade.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="school">School</Label>
        <Input id="school" {...register('school')} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="academicLevel">Academic level</Label>
        <Input id="academicLevel" {...register('academicLevel')} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="learningGoals">Learning goals</Label>
        <Textarea id="learningGoals" {...register('learningGoals')} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preferredLanguage">Preferred language</Label>
        <Input id="preferredLanguage" {...register('preferredLanguage')} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="teachingStylePreference">Teaching style</Label>
        <Input id="teachingStylePreference" {...register('teachingStylePreference')} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="budgetPreference">Budget</Label>
        <Input
          id="budgetPreference"
          inputMode="decimal"
          {...register('budgetPreference', {
            validate: (v) =>
              v === '' || /^\d+(\.\d{1,2})?$/.test(v) || 'Enter an amount like 150 or 150.50',
          })}
        />
        {errors.budgetPreference && (
          <p role="alert" className="text-s text-destructive">
            {errors.budgetPreference.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="formatPreference">Class format</Label>
        <select
          id="formatPreference"
          className="h-10 rounded-m border border-border bg-white px-3"
          {...register('formatPreference')}
        >
          {FORMATS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {subjects.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-s font-semibold">Subjects of interest</legend>
          {subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={() => toggle(s.id)}
              />
              {s.name}
            </label>
          ))}
        </fieldset>
      )}
      <Button type="submit" className="self-start" disabled={!isDirty || update.isPending}>
        Save academic profile
      </Button>
    </form>
  );
}
