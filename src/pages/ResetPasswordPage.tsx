import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');
  const codeParam = searchParams.get('code') || '';

  const resetMut = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: codeParam,
    },
  });

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm">
            This reset link is no longer valid, request a new one.{' '}
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
              Go to Forgot Password
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = (data: FormValues) => {
    resetMut.mutate(
      { userId, code: data.code, newPassword: data.newPassword },
      {
        onSuccess: () => {
          navigate(ROUTES.LOGIN);
        },
        onError: (error) => {
          if (error.response?.status === 400) {
            setError('code', { message: 'Invalid or expired code' });
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

          <Button type="submit" loading={resetMut.isPending}>
            Reset Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
