import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ManualAssignmentForm from '@/components/admin-matching/ManualAssignmentForm';

const tutors = [
  { id: 't1', label: 'Selam Tesfaye' },
  { id: 't2', label: 'Abel Kebede' },
];
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
const add = (id: string) =>
  fireEvent.change(screen.getByLabelText('Add student'), { target: { value: id } });
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('ManualAssignmentForm', () => {
  it('disables Assign for a group format until enough students are chosen', () => {
    renderForm();
    pickTutor();
    pickFormat('ONE_TO_THREE');
    add('s1');
    expect(assign()).toBeDisabled();

    add('s2');
    expect(assign()).toBeEnabled();
  });

  it('requires exactly one student for ONE_TO_ONE (under-count)', () => {
    renderForm();
    pickTutor();
    expect(assign()).toBeDisabled();

    add('s1');
    expect(assign()).toBeEnabled();
  });

  it('requires exactly one student for ONE_TO_ONE (over-count)', () => {
    renderForm();
    pickTutor();
    pickFormat('ONE_TO_THREE');
    add('s1');
    add('s2');

    pickFormat('ONE_TO_ONE');

    expect(assign()).toBeDisabled();
  });

  it('blocks picking more students than the format allows', () => {
    renderForm();
    pickFormat('ONE_TO_ONE');
    add('s1');
    expect(screen.getByLabelText('Add student')).toBeDisabled();
  });

  it('stays disabled until a tutor is selected', () => {
    renderForm();
    add('s1');
    expect(assign()).toBeDisabled();
  });

  it('submits the exact tutor/student/format selections', () => {
    const { onSubmit } = renderForm();
    pickFormat('ONE_TO_THREE');
    pickTutor();
    add('s1');
    add('s3');

    fireEvent.click(assign());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      tutorId: 't1',
      studentIds: ['s1', 's3'],
      format: 'ONE_TO_THREE',
    });
  });

  it('filters the tutor list as you type', () => {
    renderForm();
    type('Find tutor', 'abel');
    expect(screen.getByRole('option', { name: 'Abel Kebede' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Selam Tesfaye' })).not.toBeInTheDocument();
  });

  it('filters the student list as you type and shows a hint when nothing matches', () => {
    renderForm();
    type('Find student', 'li');
    expect(screen.getByRole('option', { name: 'Lily' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sam' })).not.toBeInTheDocument();

    type('Find student', 'zzz');
    expect(screen.getByText('No students match.')).toBeInTheDocument();
  });

  it('shows chosen students as chips and removes them again', () => {
    renderForm();
    add('s1');
    expect(screen.getByRole('button', { name: 'Remove Sam' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sam' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Sam' }));
    expect(screen.queryByRole('button', { name: 'Remove Sam' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sam' })).toBeInTheDocument();
  });
});
