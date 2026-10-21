import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useCohortMaterials, useAdminOverrideMaterial } from '@/hooks/useLibrary';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function AdminLibraryPage() {
  const [params] = useSearchParams();
  const cohortId = params.get('cohortId');

  const { data, isLoading, isError } = useCohortMaterials(cohortId || undefined);
  const { mutate, isPending } = useAdminOverrideMaterial();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  if (!cohortId) {
    return <EmptyState message="No cohort selected" />;
  }

  if (isLoading)
    return (
      <div className="p-4" data-testid="loading">
        Loading...
      </div>
    );
  if (isError) return <div className="p-4">Error loading materials</div>;

  if (!data?.materials.length) {
    return <EmptyState message="No materials found" />;
  }

  const handleRename = (id: string) => {
    const title = draftTitle.trim();
    if (!title) return;
    mutate(
      { id, cohortId, title },
      {
        onSuccess: () => {
          setEditingId(null);
          setDraftTitle('');
        },
      }
    );
  };

  const handleRemove = (id: string) => {
    mutate({ id, cohortId, remove: true });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Admin Override: Library Materials</h1>
      <ul className="flex flex-col gap-2">
        {data.materials.map((mat) => (
          <li key={mat.id} className={'flex items-center justify-between rounded-md border p-4' + (mat.removedAt ? ' opacity-60' : '')}>
            {editingId === mat.id ? (
              <div className="flex items-center gap-2">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  autoFocus
                />
                <Button
                  disabled={!draftTitle.trim() || isPending}
                  onClick={() => handleRename(mat.id)}
                >
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span className="font-semibold">{mat.title}{mat.removedAt && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-normal text-red-700">Removed</span>}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary" disabled={!!mat.removedAt}
                    onClick={() => {
                      setEditingId(mat.id);
                      setDraftTitle(mat.title);
                    }}
                  >
                    Rename
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!!mat.removedAt}>Remove</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Material?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the material from the library.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemove(mat.id)}>
                          Confirm Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
