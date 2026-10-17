import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ManualAssignmentForm from '@/components/admin-matching/ManualAssignmentForm';

const subjects = [
  { id: 'sub-1', name: 'Geography' },
  { id: 'sub-2', name: 'Mathematics' },
];
const tutors = [
  { id: 't1', label: 'selam@x.com' },
  { id: 't2', label: 'abel@x.com' },
];
const students = [
  { id: 's1', label: 'sam@x.com' },
  { id: 's2', label: 'lily@x.com' },
  { id: 's3', label: 'omar@x.com' },
];

function renderForm(props: Partial<Parameters<typeof ManualAssignmentForm>[0]> = {}) {
  const handlers = {
    onSubmit: vi.fn(),
    onSubjectChange: vi.fn(),
    onTutorSearch: vi.fn(),
    onStudentSearch: vi.fn(),
  };
  render(
    <ManualAssignmentForm
      subjects={subjects}
      tutors={tutors}
      students={students}
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

const assign = () => screen.getByRole('button', { name: 'Assign' });
const pickFormat = (value: string) =>
  fireEvent.change(screen.getByLabelText('Format'), { target: { value } });
const pickSubject = (value = 'sub-1') =>
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value } });
const pickTutor = (name = 'selam@x.com') =>
  fireEvent.click(screen.getByRole('button', { name }));
const pickStudent = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('ManualAssignmentForm', () => {
  it('keeps the tutor and student search disabled until a subject is chosen', () => {
    renderForm();
    expect(screen.getByLabelText('Tutor')).toBeDisabled();
    expect(screen.getByLabelText('Student')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'selam@x.com' })).not.toBeInTheDocument();

    pickSubject();
    expect(screen.getByLabelText('Tutor')).toBeEnabled();
    expect(screen.getByLabelText('Student')).toBeEnabled();
  });

  it('reports the chosen subject and clears the search terms', () => {
    const { onSubjectChange, onTutorSearch, onStudentSearch } = renderForm();
    pickSubject('sub-2');
    expect(onSubjectChange).toHaveBeenCalledWith('sub-2');
    expect(onTutorSearch).toHaveBeenCalledWith('');
    expect(onStudentSearch).toHaveBeenCalledWith('');
  });

  it('shows tutor suggestions under the box and reports what is typed', () => {
    const { onTutorSearch } = renderForm();
    pickSubject();
    expect(screen.getByRole('list', { name: 'Tutor suggestions' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tutor'), { target: { value: 'abel' } });
    expect(onTutorSearch).toHaveBeenLastCalledWith('abel');
  });

  it('picking a tutor suggestion selects it and can be removed again', () => {
    renderForm();
    pickSubject();
    pickTutor('abel@x.com');

    expect(screen.getByRole('button', { name: 'Remove tutor abel@x.com' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Tutor suggestions' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove tutor abel@x.com' }));
    expect(screen.getByLabelText('Tutor')).toBeInTheDocument();
  });

  it('shows hints when nothing is suggested', () => {
    renderForm({ tutors: [], students: [] });
    pickSubject();
    expect(screen.getByText('No verified tutors teach this subject.')).toBeInTheDocument();
    expect(screen.getByText('No students are waiting for this subject.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tutor'), { target: { value: 'zzz' } });
    expect(screen.getByText('No tutors match.')).toBeInTheDocument();
  });

  it('disables Assign for a group format until enough students are chosen', () => {
    renderForm();
    pickSubject();
    pickTutor();
    pickFormat('ONE_TO_THREE');
    pickStudent('sam@x.com');
    expect(assign()).toBeDisabled();

    pickStudent('lily@x.com');
    expect(assign()).toBeEnabled();
  });

  it('requires exactly one student for ONE_TO_ONE (under-count)', () => {
    renderForm();
    pickSubject();
    pickTutor();
    expect(assign()).toBeDisabled();

    pickStudent('sam@x.com');
    expect(assign()).toBeEnabled();
  });

  it('requires exactly one student for ONE_TO_ONE (over-count)', () => {
    renderForm();
    pickSubject();
    pickTutor();
    pickFormat('ONE_TO_THREE');
    pickStudent('sam@x.com');
    pickStudent('lily@x.com');

    pickFormat('ONE_TO_ONE');

    expect(assign()).toBeDisabled();
  });

  it('blocks picking more students than the format allows', () => {
    renderForm();
    pickSubject();
    pickFormat('ONE_TO_ONE');
    pickStudent('sam@x.com');
    expect(screen.getByLabelText('Student')).toBeDisabled();
  });

  it('removes a chosen student with the x button and suggests them again', () => {
    renderForm();
    pickSubject();
    pickStudent('sam@x.com');
    expect(screen.queryByRole('button', { name: 'sam@x.com' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove sam@x.com' }));
    expect(screen.getByRole('button', { name: 'sam@x.com' })).toBeInTheDocument();
  });

  it('stays disabled until a subject and a tutor are chosen', () => {
    renderForm();
    expect(assign()).toBeDisabled();
    pickSubject();
    pickStudent('sam@x.com');
    expect(assign()).toBeDisabled();
  });

  it('changing the subject clears the chosen tutor and students', () => {
    renderForm();
    pickSubject('sub-1');
    pickTutor();
    pickStudent('sam@x.com');

    pickSubject('sub-2');

    expect(screen.queryByRole('button', { name: 'Remove sam@x.com' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove tutor/ })).not.toBeInTheDocument();
    expect(assign()).toBeDisabled();
  });

  it('submits the exact tutor/student/subject/format selections', () => {
    const { onSubmit } = renderForm();
    pickFormat('ONE_TO_THREE');
    pickSubject('sub-2');
    pickTutor();
    pickStudent('sam@x.com');
    pickStudent('omar@x.com');

    fireEvent.click(assign());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      tutorId: 't1',
      studentIds: ['s1', 's3'],
      subjectId: 'sub-2',
      format: 'ONE_TO_THREE',
    });
  });
});
