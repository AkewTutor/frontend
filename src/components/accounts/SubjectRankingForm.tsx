import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Subject, TutorSubjectRanking } from '@/types';

const MAX_SELECTIONS = 2;

interface SubjectRankingFormProps {
  subjects: Subject[];
  currentRankings: TutorSubjectRanking[];
  onSave: (ranked: { subjectId: string; rank: 1 | 2 }[]) => void;
}

export default function SubjectRankingForm({
  subjects,
  currentRankings,
  onSave,
}: SubjectRankingFormProps) {
  // Ordered ids; rank = position + 1. Cap is evaluated live against this length.
  const [selected, setSelected] = useState<string[]>(() =>
    [...currentRankings].sort((a, b) => a.rank - b.rank).map((r) => r.subjectId)
  );
  const [term, setTerm] = useState('');

  const names = new Map<string, string>([
    ...currentRankings.map((r) => [r.subjectId, r.subjectName] as [string, string]),
    ...subjects.map((s) => [s.id, s.name] as [string, string]),
  ]);

  const visible = subjects.filter((s) => s.name.toLowerCase().includes(term.trim().toLowerCase()));
  const atCap = selected.length >= MAX_SELECTIONS;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const swap = () => setSelected((prev) => [prev[1], prev[0]]);

  const handleSave = () =>
    onSave(selected.map((subjectId, i) => ({ subjectId, rank: (i + 1) as 1 | 2 })));

  return (
    <div className="space-y-space-md">
      <div className="space-y-1">
        <Label htmlFor="subject-search">Search subjects</Label>
        <Input id="subject-search" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      <ul className="space-y-2">
        {visible.map((subject) => {
          const checked = selected.includes(subject.id);
          return (
            <li key={subject.id}>
              <label className="flex items-center gap-2 text-m">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && atCap}
                  onChange={() => toggle(subject.id)}
                />
                {subject.name}
              </label>
            </li>
          );
        })}
      </ul>

      {selected.length > 0 && (
        <ol className="space-y-2" aria-label="Your ranking">
          {selected.map((id, i) => (
            <li key={id} className="flex items-center gap-2 text-m">
              <span>
                Rank {i + 1}: {names.get(id) ?? id}
              </span>
              {selected.length === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={swap}
                  aria-label={`Move ${names.get(id) ?? id} ${i === 0 ? 'down' : 'up'}`}
                >
                  {i === 0 ? 'Move down' : 'Move up'}
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}

      <Button type="button" onClick={handleSave} disabled={selected.length === 0}>
        Save
      </Button>
    </div>
  );
}
