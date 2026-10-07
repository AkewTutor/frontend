import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const forgotPasswordMut = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => {
    forgotPasswordMut.mutate(data.identifier, {
      onSuccess: () => {
        setSuccess(true);
      },
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Forgot Password</h1>
        {success ? (
          <div className="bg-primary/10 p-3 rounded-md" role="alert">
            <p className="text-primary text-sm font-medium">
              If an account exists, a reset code has been sent.
            </p>
          </div>
        ) : (
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

            <Button type="submit" loading={forgotPasswordMut.isPending}>
              Send Reset Code
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
