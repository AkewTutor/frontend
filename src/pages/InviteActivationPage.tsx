import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';
import { useActivateInvite } from '@/hooks/useGuardianship';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export default function InviteActivationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const activate = useActivateInvite();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '', termsAccepted: false },
  });

  const onSubmit = (v: FormValues) => {
    activate.mutate(
      { token, password: v.password, termsAccepted: true },
      {
        onSuccess: () => {
          toast.success('Account activated. Please log in.');
          navigate(ROUTES.LOGIN);
        },
        onError: (error) => {
          const status = (error as { response?: { status?: number } }).response?.status;
          setError('root', {
            message:
              status === 400
                ? 'This invite is no longer valid. Ask your parent or guardian to resend it.'
                : status === 404
                  ? 'Invite not found.'
                  : 'Something went wrong. Please try again.',
          });
        },
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Activate your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="text-s text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p role="alert" className="text-s text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="termsAccepted" className="flex items-center gap-2 text-s">
            <input id="termsAccepted" type="checkbox" {...register('termsAccepted')} />I accept the
            terms and conditions
          </label>
          {errors.termsAccepted && (
            <p role="alert" className="text-s text-destructive">
              {errors.termsAccepted.message}
            </p>
          )}
        </div>
        {errors.root && (
          <p role="alert" className="text-s text-destructive">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="self-start" disabled={activate.isPending}>
          Activate account
        </Button>
      </form>
    </div>
  );
}
