import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TutorSearchFilters from '@/components/matching/TutorSearchFilters';

const subjects = [
  { id: 'sub1', name: 'Math', isActive: true },
  { id: 'sub2', name: 'Physics', isActive: true },
];

describe('TutorSearchFilters', () => {
  it('reports a changed subject while keeping the other filters', () => {
    const onChange = vi.fn();
    render(<TutorSearchFilters value={{ grade: 5 }} onChange={onChange} subjects={subjects} />);

    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'sub2' } });

    expect(onChange).toHaveBeenCalledWith({ grade: 5, subjectId: 'sub2' });
  });

  it('converts grade to a number', () => {
    const onChange = vi.fn();
    render(<TutorSearchFilters value={{}} onChange={onChange} subjects={subjects} />);

    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '7' } });

    expect(onChange).toHaveBeenCalledWith({ grade: 7 });
  });

  it('removes a cleared filter from the object instead of leaving an empty value', () => {
    const onChange = vi.fn();
    render(
      <TutorSearchFilters
        value={{ subjectId: 'sub1', language: 'Amharic' }}
        onChange={onChange}
        subjects={subjects}
      />
    );

    fireEvent.change(screen.getByLabelText('Language'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ subjectId: 'sub1' });
    expect(onChange.mock.calls[0][0]).not.toHaveProperty('language');
  });
});
