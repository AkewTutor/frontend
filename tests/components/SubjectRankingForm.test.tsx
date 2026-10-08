import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SubjectRankingForm from '@/components/accounts/SubjectRankingForm';
import type { Subject } from '@/types';

const subjects: Subject[] = [
  { id: 'a', name: 'Algebra', isActive: true },
  { id: 'b', name: 'Biology', isActive: true },
  { id: 'c', name: 'Chemistry', isActive: true },
];

const box = (name: string) => screen.getByRole('checkbox', { name });

function setup() {
  const onSave = vi.fn();
  render(<SubjectRankingForm subjects={subjects} currentRankings={[]} onSave={onSave} />);
  return { onSave };
}

describe('SubjectRankingForm', () => {
  it('disables a third selection in the DOM', () => {
    setup();
    fireEvent.click(box('Algebra'));
    fireEvent.click(box('Biology'));
    expect(box('Chemistry')).toBeDisabled();
    expect(box('Algebra')).toBeEnabled();
    expect(box('Biology')).toBeEnabled();
  });

  it('re-enables selection as soon as one is removed', () => {
    setup();
    fireEvent.click(box('Algebra'));
    fireEvent.click(box('Biology'));
    expect(box('Chemistry')).toBeDisabled();

    fireEvent.click(box('Algebra'));
    expect(box('Chemistry')).toBeEnabled();
  });

  it('reordering swaps rank 1 and rank 2', () => {
    const { onSave } = setup();
    fireEvent.click(box('Algebra'));
    fireEvent.click(box('Biology'));
    fireEvent.click(screen.getByRole('button', { name: 'Move Algebra down' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith([
      { subjectId: 'b', rank: 1 },
      { subjectId: 'a', rank: 2 },
    ]);
  });

  it('saves unique ranks in the useRankSubjects shape', () => {
    const { onSave } = setup();
    fireEvent.click(box('Algebra'));
    fireEvent.click(box('Biology'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith([
      { subjectId: 'a', rank: 1 },
      { subjectId: 'b', rank: 2 },
    ]);
  });

  it('starts from the current rankings', () => {
    render(
      <SubjectRankingForm
        subjects={subjects}
        currentRankings={[{ subjectId: 'c', subjectName: 'Chemistry', rank: 1 }]}
        onSave={vi.fn()}
      />
    );
    expect(box('Chemistry')).toBeChecked();
    expect(screen.getByText('Rank 1: Chemistry')).toBeInTheDocument();
  });
});
