import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdminBadge } from '@/types';

export interface BadgeCreateValues {
  name: string;
  description: string;
  category: 'STUDENT' | 'TUTOR';
  criteriaDescription: string;
}

export interface BadgeEditValues {
  criteriaDescription?: string;
  isActive?: boolean;
}

type Props =
  | {
      mode: 'create';
      isSubmitting: boolean;
      onSubmit: (values: BadgeCreateValues) => void;
      onCancel: () => void;
    }
  | {
      mode: 'edit';
      badge: AdminBadge;
      isSubmitting: boolean;
      onSubmit: (changes: BadgeEditValues) => void;
      onCancel: () => void;
    };

const HINT = 'Criteria must be based on experience, performance or achievement, never on ratings.';

export default function BadgeForm(props: Props) {
  return props.mode === 'create' ? <CreateFields {...props} /> : <EditFields {...props} />;
}

function CreateFields({ isSubmitting, onSubmit, onCancel }: Extract<Props, { mode: 'create' }>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'STUDENT' | 'TUTOR'>('STUDENT');
  const [criteria, setCriteria] = useState('');

  const ready = Boolean(name.trim() && description.trim() && criteria.trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        onSubmit({
          name: name.trim(),
          description: description.trim(),
          category,
          criteriaDescription: criteria.trim(),
        });
      }}
      className="flex flex-col gap-3 rounded-m border border-border p-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="badge-name">Name</Label>
        <Input id="badge-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="badge-description">Description</Label>
        <Textarea
          id="badge-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="badge-category">Category</Label>
        <select
          id="badge-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as 'STUDENT' | 'TUTOR')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="STUDENT">Student</option>
          <option value="TUTOR">Tutor</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="badge-criteria">Criteria</Label>
        <Textarea
          id="badge-criteria"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        />
        <p className="text-s text-muted-foreground">{HINT}</p>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={!ready || isSubmitting}>
          Save badge
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditFields({ badge, isSubmitting, onSubmit, onCancel }: Extract<Props, { mode: 'edit' }>) {
  const [criteria, setCriteria] = useState(badge.criteriaDescription);
  const [isActive, setIsActive] = useState(badge.isActive);

  const trimmed = criteria.trim();
  const changes: BadgeEditValues = {};
  if (trimmed !== badge.criteriaDescription) changes.criteriaDescription = trimmed;
  if (isActive !== badge.isActive) changes.isActive = isActive;
  const dirty = Object.keys(changes).length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!dirty || !trimmed) return;
        onSubmit(changes);
      }}
      className="flex flex-col gap-3 rounded-m border border-border p-4"
    >
      <p className="font-semibold">
        {badge.name} <span className="text-s text-muted-foreground">({badge.category})</span>
      </p>
      <div className="flex flex-col gap-1">
        <Label htmlFor="badge-edit-criteria">Criteria</Label>
        <Textarea
          id="badge-edit-criteria"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        />
        <p className="text-s text-muted-foreground">{HINT}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="badge-edit-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <Label htmlFor="badge-edit-active">Active</Label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={!dirty || !trimmed || isSubmitting}>
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
