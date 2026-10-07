import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';

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
          </div>

          {login.isError && login.error?.response?.status === 401 && (
            <div className="bg-destructive/10 p-3 rounded-md" role="alert">
              <p className="text-destructive text-sm font-medium">
                Invalid email/phone or password
              </p>
            </div>
          )}

          <Button type="submit" loading={login.isPending}>
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
