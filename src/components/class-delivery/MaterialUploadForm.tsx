import { useState } from 'react';
import { useUploadMaterial } from '@/hooks/useLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov';
const ALLOWED_EXT = /\.(pdf|doc|docx|jpe?g|png|webp|mp4|webm|mov)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export default function MaterialUploadForm({ cohortId }: { cohortId: string }) {
  const { mutate, isPending } = useUploadMaterial();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && file !== null;

  const reset = () => {
    setFile(null);
    setFileKey((k) => k + 1);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    if (picked && !ALLOWED_EXT.test(picked.name)) {
      toast.error('Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP, MP4, WEBM, MOV');
      reset();
      return;
    }
    if (picked) {
      const isVideo = VIDEO_EXT.test(picked.name);
      if (picked.size > (isVideo ? MAX_VIDEO_BYTES : MAX_BYTES)) {
        toast.error(isVideo ? 'Video too large (max 100 MB)' : 'File too large (max 10 MB)');
        reset();
        return;
      }
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
          toast.success('Uploaded.');
          setTitle('');
          reset();
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
          placeholder="Title (for example: Lesson 3 video)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="file">File</label>
        <Input key={fileKey} id="file" type="file" accept={ACCEPT} onChange={handleFile} />
        <p className="text-xs text-muted-foreground">
          Documents and images up to 10 MB. Videos (MP4, WebM, MOV) up to 100 MB. Add as many as you
          like, one at a time.
        </p>
        {file && <p className="text-xs">Selected: {file.name}</p>}
      </div>

      <Button type="submit" disabled={!canSubmit || isPending}>
        {isPending ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  );
}