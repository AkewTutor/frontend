import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ManualAssignmentForm from '@/components/admin-matching/ManualAssignmentForm';

const tutors = [{ id: 't1', label: 'Selam Tesfaye' }];
const students = [
  { id: 's1', label: 'Sam' },
  { id: 's2', label: 'Lily' },
  { id: 's3', label: 'Omar' },
];

function renderForm() {
  const onSubmit = vi.fn();
  render(<ManualAssignmentForm tutors={tutors} students={students} onSubmit={onSubmit} />);
  return { onSubmit };
}

const assign = () => screen.getByRole('button', { name: 'Assign' });
const pickFormat = (value: string) =>
  fireEvent.change(screen.getByLabelText('Format'), { target: { value } });
const pickTutor = () =>
  fireEvent.change(screen.getByLabelText('Tutor'), { target: { value: 't1' } });
const check = (name: string) => fireEvent.click(screen.getByLabelText(name));

describe('ManualAssignmentForm', () => {
  it('disables Assign for a group format until enough students are chosen', () => {
    renderForm();
    pickTutor();
    pickFormat('ONE_TO_THREE');
    check('Sam');
    expect(assign()).toBeDisabled();

    check('Lily');
    expect(assign()).toBeEnabled();
  });

  it('requires exactly one student for ONE_TO_ONE (under-count)', () => {
    renderForm();
    pickTutor();
    expect(assign()).toBeDisabled();

    check('Sam');
    expect(assign()).toBeEnabled();
  });

  it('requires exactly one student for ONE_TO_ONE (over-count)', () => {
    renderForm();
    pickTutor();
    pickFormat('ONE_TO_THREE');
    check('Sam');
    check('Lily');

    pickFormat('ONE_TO_ONE');

    expect(assign()).toBeDisabled();
  });

  it('blocks picking more students than the format allows', () => {
    renderForm();
    pickFormat('ONE_TO_ONE');
    check('Sam');
    expect(screen.getByLabelText('Lily')).toBeDisabled();
  });

  it('stays disabled until a tutor is selected', () => {
    renderForm();
    check('Sam');
    expect(assign()).toBeDisabled();
  });

  it('submits the exact tutor/student/format selections', () => {
    const { onSubmit } = renderForm();
    pickFormat('ONE_TO_THREE');
    pickTutor();
    check('Sam');
    check('Omar');

    fireEvent.click(assign());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      tutorId: 't1',
      studentIds: ['s1', 's3'],
      format: 'ONE_TO_THREE',
    });
  });
});
