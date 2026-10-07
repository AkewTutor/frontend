import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';
import { ROUTES } from '@/constants';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function isValidRelativeReturnTo(path: string | null): boolean {
  if (!path) return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export default function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data, {
      onSuccess: (res) => {
        const searchParams = new URLSearchParams(location.search);
        const returnTo = searchParams.get('returnTo');
        let target = roleDefaultRoute(res.user.role);

        if (isValidRelativeReturnTo(returnTo)) {
          target = returnTo as string;
        }

        navigate(target, { replace: true });
      },
      onError: (error) => {
        // 403 = correct password but contact not verified yet.
        // The backend returns the user id in errors[0]; send them to verification.
        if (error.response?.status === 403) {
          const body = error.response.data as { errors?: string[] };
          const userId = body?.errors?.[0];
          if (userId) {
            navigate(`${ROUTES.VERIFY_CONTACT}?userId=${encodeURIComponent(userId)}`);
          }
        }
      },
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Sign in</h1>
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
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Password" {...register('password')} />
            {errors.password && (
              <p className="text-destructive text-xs" role="alert">
                {errors.password.message}
              </p>
            )}
            <div className="text-right">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {login.isError && login.error?.response?.status !== 403 && (
            <div className="bg-destructive/10 p-3 rounded-md" role="alert">
              <p className="text-destructive text-sm font-medium">
                {login.error?.response?.status === 401
                  ? 'Invalid email/phone or password'
                  : login.error?.response?.status === 429
                    ? 'Too many attempts. Please wait a few minutes and try again.'
                    : 'Something went wrong. Please try again.'}
              </p>
            </div>
          )}

          <Button type="submit" loading={login.isPending}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here? Register as a{' '}
          <Link to={ROUTES.REGISTER_STUDENT} className="text-primary hover:underline">
            student
          </Link>
          ,{' '}
          <Link to={ROUTES.REGISTER_PARENT} className="text-primary hover:underline">
            parent
          </Link>{' '}
          or{' '}
          <Link to={ROUTES.REGISTER_TUTOR} className="text-primary hover:underline">
            tutor
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
