import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants';
import { useLibraryActivity } from '@/hooks/useLibrary';
import type { LibraryActivityUser } from '@/hooks/useLibrary';

function who(u: LibraryActivityUser | null) {
  if (!u) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-col text-xs">
      <span className="font-medium">{u.name ?? '-'}</span>
      <span>{u.email ?? '-'}</span>
      <span className="text-muted-foreground">{u.phone ?? ''}</span>
    </div>
  );
}

export default function AdminLibraryActivity() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(handle);
  }, [input]);

  const { data, isLoading, isError } = useLibraryActivity(q);
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Library Activity</h1>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search by tutor or student email, phone or name"
        aria-label="Search library"
      />
      <p className="text-sm text-muted-foreground">
        Newest first. Uploads and deletions across all classes.
      </p>

      {isLoading ? (
        <p data-testid="loading">Loading...</p>
      ) : isError ? (
        <p>Error loading library activity</p>
      ) : items.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">File</th>
                <th className="p-2">Tutor</th>
                <th className="p-2">Students</th>
                <th className="p-2">Uploaded</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className={'border-b align-top' + (it.removedAt ? ' opacity-60' : '')}>
                  <td className="p-2">
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{it.fileType}</div>
                  </td>
                  <td className="p-2">{who(it.tutor)}</td>
                  <td className="p-2">
                    <div className="flex flex-col gap-2">
                      {it.students.length === 0 ? who(null) : it.students.map((s, i) => <div key={i}>{who(s)}</div>)}
                    </div>
                  </td>
                  <td className="p-2">{new Date(it.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    {it.removedAt ? (
                      <div>
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          Removed
                        </span>
                        <div className="mt-1 text-xs">{new Date(it.removedAt).toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {it.fileUrl && !it.removedAt && (
                        <a
                          href={it.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                        >
                          Open
                        </a>
                      )}
                      <Link
                        to={ROUTES.ADMIN_LIBRARY + '?cohortId=' + it.cohortId}
                        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                      >
                        Manage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}