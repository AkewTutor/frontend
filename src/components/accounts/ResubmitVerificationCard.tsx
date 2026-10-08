import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useResubmitVerification } from '@/hooks/useTutorProfile';

interface ResubmitVerificationCardProps {
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  hasUnsavedChanges: boolean;
}

export default function ResubmitVerificationCard({
  verificationStatus,
  hasUnsavedChanges,
}: ResubmitVerificationCardProps) {
  const resubmit = useResubmitVerification();
  const [message, setMessage] = useState<string | null>(null);

  if (verificationStatus === 'VERIFIED') return null;

  if (verificationStatus === 'PENDING') {
    return (
      <div className="rounded-m border border-border p-4">
        <p className="text-m">Your application is under review.</p>
        {message && <p className="mt-2 text-s text-muted-foreground">{message}</p>}
      </div>
    );
  }

  const handleConfirm = () => {
    setMessage(null);
    resubmit.mutate(undefined, {
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status;
        setMessage(
          status === 409
            ? 'This application was already resubmitted'
            : 'Something went wrong. Please try again.'
        );
      },
    });
  };

  return (
    <div className="flex flex-col items-start gap-3 rounded-m border border-border p-4">
      <p className="text-m">
        Your application needs changes. Update your profile, save, then resubmit it for review.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" disabled={hasUnsavedChanges || resubmit.isPending}>
            Resubmit for review
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send your application back for review?</AlertDialogTitle>
            <AlertDialogDescription>
              An admin will review your profile again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {hasUnsavedChanges && <p className="text-s text-muted-foreground">Save your changes first</p>}
      {message && (
        <p role="alert" className="text-s text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
