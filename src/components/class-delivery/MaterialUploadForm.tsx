import { useState } from 'react';
import { useUploadMaterial } from '@/hooks/useLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MaterialUploadForm({ cohortId }: { cohortId: string }) {
  const { mutate, isPending } = useUploadMaterial();
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'NOTE' | 'BOOK'>('PDF');
  const [file, setFile] = useState<File | null>(null);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && file !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutate(
      { cohortId, title: trimmedTitle, fileType, file },
      {
        onSuccess: () => {
          setTitle('');
          setFileType('PDF');
          setFile(null);
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
        <label htmlFor="fileType">Type</label>
        <select
          id="fileType"
          value={fileType}
          onChange={(e) => setFileType(e.target.value as 'PDF' | 'NOTE' | 'BOOK')}
          className="rounded-md border px-3 py-2"
        >
          <option value="PDF">PDF</option>
          <option value="NOTE">Note</option>
          <option value="BOOK">Book</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="file">File</label>
        <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <Button type="submit" disabled={!canSubmit || isPending}>
        Upload
      </Button>
    </form>
  );
}
