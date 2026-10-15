import { useState } from 'react';
import { toast } from 'sonner';

import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useReactivateAccount,
  useSuspendAccount,
  useUsers,
  type RestrictionType,
} from '@/hooks/useAdminPeople';
import type { AdminUser, Role } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';

const ROLES: Role[] = ['STUDENT', 'PARENT', 'TUTOR', 'ADMIN'];

export default function PeopleManagementPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [restrictionType, setRestrictionType] = useState<RestrictionType>('SUSPENDED');

  const { data, isLoading, isError } = useUsers(page, roleFilter || undefined, search || undefined);
  const suspend = useSuspendAccount();
  const reactivate = useReactivateAccount();

  if (isLoading) return <p className="p-6">Loading people…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load people. Please try again later.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const trimmed = reason.trim();

  const closePanel = () => {
    setTarget(null);
    setReason('');
    setRestrictionType('SUSPENDED');
  };

  const applySearch = (value: string) => {
    setSearch(value.trim());
    setPage(1);
  };

  const confirmSuspend = () => {
    if (!target || !trimmed) return;
    suspend.mutate(
      { userId: target.id, reason: trimmed, restrictionType },
      {
        onSuccess: () => {
          toast.success('Account updated.');
          closePanel();
        },
        onError: () => toast.error('Could not update this account. Please try again.'),
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">People</h1>

      <form
        className="flex flex-col gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch(searchInput);
        }}
      >
        <Label htmlFor="peopleSearch">Search</Label>
        <div className="flex gap-3">
          <Input
            id="peopleSearch"
            className="w-64"
            placeholder="Email or phone"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" size="sm">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchInput('');
                applySearch('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-1">
        <Label htmlFor="roleFilter">Role</Label>
        <select
          id="roleFilter"
          className="h-10 w-48 rounded-m border border-border bg-white px-3"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | '');
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {data.users.length === 0 ? (
        <EmptyState message="No people match this filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.email ?? u.phone ?? '—'}</TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={u.status}
                    severity={
                      u.status === 'SUSPENDED'
                        ? 'danger'
                        : u.status === 'RESTRICTED'
                          ? 'warning'
                          : 'success'
                    }
                  />
                </TableCell>
                <TableCell>
                  {u.status === 'ACTIVE' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setTarget(u);
                        setReason('');
                      }}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={reactivate.isPending}
                      onClick={() =>
                        reactivate.mutate(u.id, {
                          onSuccess: () => toast.success('Account reactivated.'),
                          onError: () => toast.error('Could not reactivate this account.'),
                        })
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {target && (
        <section className="flex flex-col gap-3 rounded-m border border-border p-4">
          <h2 className="text-m font-semibold">
            Suspend account: {target.email ?? target.phone ?? target.id}
          </h2>
          <div className="flex flex-col gap-1">
            <Label htmlFor="restrictionType">Restriction</Label>
            <select
              id="restrictionType"
              className="h-10 w-48 rounded-m border border-border bg-white px-3"
              value={restrictionType}
              onChange={(e) => setRestrictionType(e.target.value as RestrictionType)}
            >
              <option value="SUSPENDED">Suspended</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="suspendReason">Reason</Label>
            <Textarea
              id="suspendReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-s text-muted-foreground">
              Internal note. It is not shown to the affected person.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" disabled={!trimmed || suspend.isPending} onClick={confirmSuspend}>
              Confirm suspend
            </Button>
            <Button type="button" variant="secondary" onClick={closePanel}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-s">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
