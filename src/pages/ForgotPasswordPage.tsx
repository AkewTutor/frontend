import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';

const schema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotPasswordMut = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => {
    const identifier = data.identifier.trim();
    forgotPasswordMut.mutate(identifier, {
      // Same outcome whether or not the account exists (non-disclosure).
      onSuccess: () => {
        navigate(ROUTES.RESET_PASSWORD, { state: { identifier, sent: true } });
      },
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Forgot Password</h1>
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

          {forgotPasswordMut.isError && (
            <p className="text-destructive text-sm" role="alert">
              {forgotPasswordMut.error?.response?.status === 429
                ? 'Too many attempts. Please wait a few minutes and try again.'
                : 'Something went wrong. Please try again.'}
            </p>
          )}

          <Button type="submit" loading={forgotPasswordMut.isPending}>
            Send Reset Code
          </Button>
          <Link to={ROUTES.LOGIN} className="text-sm text-primary hover:underline text-center">
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
