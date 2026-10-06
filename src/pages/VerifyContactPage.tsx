import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useVerifyContact, useResendVerification } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import { toast } from 'sonner';

const verifySchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

type FormValues = z.infer<typeof verifySchema>;

export default function VerifyContactPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = location.state?.userId || searchParams.get('userId');

  const verifyMut = useVerifyContact();
  const resendMut = useResendVerification();

  const [resendDisabled, setResendDisabled] = useState(false);

  useEffect(() => {
    if (resendDisabled) {
      const timer = setTimeout(() => {
        setResendDisabled(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [resendDisabled]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = (data: FormValues) => {
    if (!userId) return;
    verifyMut.mutate(
      { userId, code: data.code },
      {
        onSuccess: () => {
          toast.success('Contact verified successfully');
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

  const handleResend = () => {
    if (!userId || resendDisabled) return;
    setResendDisabled(true);
    resendMut.mutate(userId, {
      onSuccess: () => toast.success('Verification code sent'),
    });
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive text-sm" role="alert">
            User ID is missing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Verify Contact</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="space-y-1">
            <Label htmlFor="code">Verification Code</Label>
            <Input id="code" type="text" placeholder="Code" {...register('code')} />
            {errors.code && (
              <p className="text-destructive text-xs" role="alert">
                {errors.code.message}
              </p>
            )}
          </div>

          <Button type="submit" loading={verifyMut.isPending}>
            Verify
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={resendDisabled}
            onClick={handleResend}
            loading={resendMut.isPending}
          >
            {resendDisabled ? 'Wait 30s to resend' : 'Resend Code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
