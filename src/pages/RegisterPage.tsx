import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useRegister, type RegisterRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';

const GRADE_MSG = 'Grade must be between 6 and 12';

const isValidGrade = (v: string) => {
  const g = Number(v);
  return v.trim() !== '' && Number.isInteger(g) && g >= 6 && g <= 12;
};

const makeSchema = (mode: RegisterRole) =>
  z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    termsAccepted: z.literal(true, { error: 'You must accept the terms' }),
    grade:
      mode === 'student'
        ? z.string({ error: GRADE_MSG }).refine(isValidGrade, GRADE_MSG)
        : z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export default function RegisterPage({ mode: modeProp }: { mode?: RegisterRole }) {
  const location = useLocation();
  const navigate = useNavigate();

  const mode: RegisterRole =
    modeProp ??
    (location.pathname === ROUTES.REGISTER_PARENT
      ? 'parent'
      : location.pathname === ROUTES.REGISTER_TUTOR
        ? 'tutor'
        : 'student');

  const registerMut = useRegister(mode);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(makeSchema(mode)),
  });

  const onSubmit = (data: FormValues) => {
    const payload: Record<string, unknown> = {
      password: data.password,
      termsAccepted: data.termsAccepted,
    };

    if (data.identifier.includes('@')) {
      payload.email = data.identifier;
    } else {
      payload.phone = data.identifier;
    }

    if (mode === 'student') {
      payload.grade = Number(data.grade);
    }

    registerMut.mutate(payload, {
      onSuccess: (res) => {
        if (res.verificationRequired) {
          navigate(ROUTES.VERIFY_CONTACT, { state: { userId: res.userId } });
        } else {
          navigate(ROUTES.LOGIN);
        }
      },
      onError: (error) => {
        if (error.response?.status === 409) {
          setError('identifier', { message: 'This identifier is already in use' });
        }
      },
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">Register as {mode}</h1>
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

          {mode === 'student' && (
            <div className="space-y-1">
              <Label htmlFor="grade">Grade (6-12)</Label>
              <Input id="grade" type="number" placeholder="Grade" {...register('grade')} />
              {errors.grade && (
                <p className="text-destructive text-xs" role="alert">
                  {errors.grade.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Password" {...register('password')} />
            {errors.password && (
              <p className="text-destructive text-xs" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1 flex items-center gap-2">
            <input type="checkbox" id="termsAccepted" {...register('termsAccepted')} />
            <Label htmlFor="termsAccepted">Accept Terms</Label>
          </div>
          {errors.termsAccepted && (
            <p className="text-destructive text-xs" role="alert">
              {errors.termsAccepted.message}
            </p>
          )}

          {registerMut.isError && registerMut.error?.response?.status !== 409 && (
            <div className="bg-destructive/10 p-3 rounded-md" role="alert">
              <p className="text-destructive text-sm font-medium">
                {registerMut.error?.response?.status === 400
                  ? ((registerMut.error.response.data as { message?: string })?.message ??
                    'Please check your details and try again.')
                  : registerMut.error?.response?.status === 429
                    ? 'Too many attempts. Please wait a few minutes and try again.'
                    : 'Something went wrong. Please try again.'}
              </p>
            </div>
          )}

          <Button type="submit" loading={registerMut.isPending}>
            Register
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
