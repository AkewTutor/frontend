import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface XPAdjustmentValues {
  studentId: string;
  amount: number;
  note: string;
}

export default function XPAdjustmentForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: XPAdjustmentValues) => void;
  isSubmitting: boolean;
}) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = studentId.trim();
    const trimmedNote = note.trim();
    const n = Number(amount);

    if (!id) return setError('Student ID is required.');
    if (!Number.isInteger(n) || n === 0) {
      return setError('Amount must be a non-zero whole number.');
    }
    if (!trimmedNote) return setError('A note is required.');

    setError(null);
    onSubmit({ studentId: id, amount: n, note: trimmedNote });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-m border border-border p-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="xp-student">Student ID</Label>
        <Input id="xp-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="xp-amount">Amount</Label>
        <Input
          id="xp-amount"
          type="number"
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-s text-muted-foreground">Use a negative number to remove XP.</p>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="xp-note">Note</Label>
        <Textarea
          id="xp-note"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-s text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={isSubmitting}>
          Adjust XP
        </Button>
      </div>
    </form>
  );
}
