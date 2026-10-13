import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useMyStudentProfile,
  useUpdateAcademicProfile,
  useUploadProfilePicture,
} from '@/hooks/useStudentProfile';
import { useSubjects } from '@/hooks/useSubjects';
import type { StudentProfile } from '@/types';
import type { ChangeEvent } from 'react';

const FORMATS = [
  ['', 'No preference'],
  ['ONE_TO_ONE', 'One-to-one'],
  ['ONE_TO_THREE', 'Small group (1-to-3)'],
  ['ONE_TO_FIVE', 'Small group (1-to-5)'],
] as const;

const LANGUAGES = ['English', 'Amharic', 'Afaan Oromo', 'Tigrinya'];
const TEACHING_STYLES = [
  'Slow and step-by-step',
  'Practical examples',
  'Exam-focused',
  'Fast-paced',
  'Interactive discussion',
];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SELECT_CLASS = 'h-10 rounded-m border border-border bg-white px-3';

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
  const upload = useUploadProfilePicture();

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2 MB or smaller.');
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success('Picture saved.'),
      onError: () => toast.error('Could not upload your picture. Please try again.'),
    });
  };

  return (
    <div className="flex items-center gap-4">
      {profile.profilePictureUrl ? (
        <img
          src={profile.profilePictureUrl}
          alt="Your profile"
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-s">
          No photo
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="profilePicture">Profile picture (JPG, PNG or WebP, max 2 MB)</Label>
        <Input
          id="profilePicture"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={upload.isPending}
        />
      </div>
    </div>
  );
}

interface AcademicValues {
  grade: string;
  school: string;
  academicLevel: string;
  learningGoals: string;
  preferredLanguage: string;
  teachingStylePreference: string;
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
        <Label htmlFor="academicLevel">Your current level in these subjects</Label>
        <select id="academicLevel" className={SELECT_CLASS} {...register('academicLevel')}>
          <option value="">Select…</option>
          {LEVELS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <p className="text-s text-muted-foreground">
          Helps us match you with a tutor who teaches at the right pace.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="learningGoals">Learning goals</Label>
        <Textarea id="learningGoals" {...register('learningGoals')} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preferredLanguage">Preferred language</Label>
        <select id="preferredLanguage" className={SELECT_CLASS} {...register('preferredLanguage')}>
          <option value="">Select…</option>
          {LANGUAGES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="teachingStylePreference">Teaching style</Label>
        <select
          id="teachingStylePreference"
          className={SELECT_CLASS}
          {...register('teachingStylePreference')}
        >
          <option value="">Select…</option>
          {TEACHING_STYLES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
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
