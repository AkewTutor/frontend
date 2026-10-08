import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import GuardianInviteStatusCard from '@/components/accounts/GuardianInviteStatusCard';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';
import {
  useInviteGuardian,
  useMyRelationships,
  useResendInvite,
  useRevokeRelationship,
} from '@/hooks/useGuardianship';
import { useAuthStore } from '@/store/auth.store';
import type { ParentStudentRelationship } from '@/types';

const statusOf = (error: unknown) => (error as { response?: { status?: number } }).response?.status;

export default function GuardianSettingsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, isError } = useMyRelationships();

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (isError || !data) {
    return (
      <p className="p-6">We couldn&apos;t load your guardian settings. Please try again later.</p>
    );
  }
  return role === 'STUDENT' ? (
    <StudentMode relationships={data.relationships} />
  ) : (
    <ParentMode relationships={data.relationships} />
  );
}

function ParentMode({ relationships }: { relationships: ParentStudentRelationship[] }) {
  const resend = useResendInvite();
  const revoke = useRevokeRelationship();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Guardian settings</h1>
      {relationships.length === 0 ? (
        <p className="text-m">
          No students linked yet.{' '}
          <Link to={ROUTES.PARENT_ADD_STUDENT} className="font-semibold underline">
            Add a student
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {relationships.map((r) => (
            <li key={r.id} className="flex items-center gap-3">
              <div className="flex-1">
                <GuardianInviteStatusCard
                  relationship={r}
                  onResend={() =>
                    resend.mutate(r.id, {
                      onSuccess: () => toast.success('Invite sent again.'),
                      onError: (error) =>
                        toast.error(
                          statusOf(error) === 409
                            ? 'This student has already activated their account.'
                            : 'Could not resend the invite. Please try again.'
                        ),
                    })
                  }
                />
              </div>
              {r.status !== 'REVOKED' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="secondary" size="sm">
                      Revoke
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke this relationship?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can&apos;t be undone from this screen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          revoke.mutate(r.id, {
                            onSuccess: () => toast.success('Relationship revoked.'),
                            onError: () => toast.error('Could not revoke. Please try again.'),
                          })
                        }
                      >
                        Confirm revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StudentMode({ relationships }: { relationships: ParentStudentRelationship[] }) {
  const invite = useInviteGuardian();
  const [contact, setContact] = useState('');
  const hasLink = relationships.some((r) => r.status === 'INVITED' || r.status === 'ACTIVE');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inviteContact = contact.trim();
    if (!inviteContact) return;
    invite.mutate(
      { inviteContact },
      {
        onSuccess: () => {
          setContact('');
          toast.success('Invite sent.');
        },
        onError: (error) =>
          toast.error(
            statusOf(error) === 403
              ? 'Only Grade 6–12 students can invite a guardian.'
              : 'Could not send the invite. Please try again.'
          ),
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Invite a guardian</h1>
      {relationships.length > 0 && (
        <ul className="flex flex-col gap-3">
          {relationships.map((r) => (
            <li key={r.id}>
              <GuardianInviteStatusCard relationship={r} />
            </li>
          ))}
        </ul>
      )}
      {hasLink && (
        <p className="text-s text-muted-foreground">
          You already have a guardian link. Check its status above before sending another invite.
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="guardianContact">Guardian email or phone</Label>
          <Input
            id="guardianContact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <Button type="submit" className="self-start" disabled={!contact.trim() || invite.isPending}>
          Send invite
        </Button>
      </form>
    </div>
  );
}
