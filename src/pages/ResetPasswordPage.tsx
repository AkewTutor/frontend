import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useResetPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';

const schema = z
  .object({
    identifier: z.string().min(1, 'Email or phone is required'),
    code: z.string().min(1, 'Code is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { identifier?: string; sent?: boolean } | null;
  const resetMut = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: state?.identifier ?? '' },
  });

  const onSubmit = (data: FormValues) => {
    resetMut.mutate(
      { identifier: data.identifier.trim(), code: data.code.trim(), newPassword: data.newPassword },
      {
        onSuccess: () => {
          navigate(ROUTES.LOGIN);
        },
        onError: (error) => {
          if (error.response?.status === 400) {
            setError('code', { message: 'Invalid or expired code' });
          } else if (error.response?.status === 429) {
            setError('root', { message: 'Too many attempts. Please wait and try again.' });
          } else {
            setError('root', { message: 'Something went wrong. Please try again.' });
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Reset Password</h1>
        {state?.sent && (
          <div className="bg-primary/10 p-3 rounded-md mb-4" role="status">
            <p className="text-primary text-sm font-medium">
              If an account exists, a reset code has been sent.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="space-y-1">
            <Label htmlFor="identifier">Email or Phone</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Email or Phone"
              {...register('identifier')}
            />
            {errors.identifier && (
              <p className="text-destructive text-xs" role="alert">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="code">Reset Code</Label>
            <Input id="code" type="text" placeholder="Code" {...register('code')} />
            {errors.code && (
              <p className="text-destructive text-xs" role="alert">
                {errors.code.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="New Password"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-destructive text-xs" role="alert">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-xs" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p className="text-destructive text-sm" role="alert">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" loading={resetMut.isPending}>
            Reset Password
          </Button>
          <p className="text-sm text-center">
            Didn&apos;t get a code?{' '}
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
              Send a new one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
