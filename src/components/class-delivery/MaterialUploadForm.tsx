import { useState } from 'react';
import { useUploadMaterial } from '@/hooks/useLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';
const ALLOWED_EXT = /\.(pdf|doc|docx|jpe?g|png|webp)$/i;
const MAX_BYTES = 10 * 1024 * 1024;

export default function MaterialUploadForm({ cohortId }: { cohortId: string }) {
  const { mutate, isPending } = useUploadMaterial();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && file !== null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    if (picked && !ALLOWED_EXT.test(picked.name)) {
      toast.error('Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP');
      setFile(null);
      setFileKey((k) => k + 1);
      return;
    }
    if (picked && picked.size > MAX_BYTES) {
      toast.error('File too large (max 10 MB)');
      setFile(null);
      setFileKey((k) => k + 1);
      return;
    }
    setFile(picked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;
    mutate(
      { cohortId, title: trimmedTitle, file },
      {
        onError: (err) =>
          toast.error(
            (err.response?.data as { message?: string } | undefined)?.message ??
              'Upload failed. Please try again.'
          ),
        onSuccess: () => {
          toast.success('Material uploaded.');
          setTitle('');
          setFile(null);
          setFileKey((k) => k + 1);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4 rounded-md border p-4">
      <h3 className="text-lg font-semibold">Upload Material</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="title">Title</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Material title"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="file">File (PDF, DOC, DOCX or image, max 10 MB)</label>
        <Input key={fileKey} id="file" type="file" accept={ACCEPT} onChange={handleFile} />
      </div>

      <Button type="submit" disabled={!canSubmit || isPending}>
        Upload
      </Button>
    </form>
  );
}
