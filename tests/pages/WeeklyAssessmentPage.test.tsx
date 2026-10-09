import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import WeeklyAssessmentPage from '@/pages/tutor/WeeklyAssessmentPage';
import { useCohortMembers } from '@/hooks/useCohort';
import { useAssessmentsForStudent } from '@/hooks/useWeeklyAssessment';

vi.mock('@/hooks/useCohort');
vi.mock('@/hooks/useWeeklyAssessment');

const submitSpy = vi.fn();

vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));

// Stand-in for the real form: one per student, its own submit button.
vi.mock('@/components/class-delivery/AssessmentForm', () => ({
  default: ({
    cohortMembershipId,
    existingAssessment,
  }: {
    cohortMembershipId: string;
    existingAssessment?: unknown;
  }) =>
    createElement(
      'div',
      { 'data-testid': 'assessment-form', 'data-membership': cohortMembershipId },
      createElement('span', null, existingAssessment ? 'Form:Readonly' : 'Form:New'),
      createElement(
        'button',
        { onClick: () => submitSpy(cohortMembershipId) },
        `Submit ${cohortMembershipId}`
      )
    ),
}));

const students = [
  { studentId: 's1', firstName: 'Alice', grade: '5', cohortMembershipId: 'cm1' },
  { studentId: 's2', firstName: 'Bethel', grade: '6', cohortMembershipId: 'cm2' },
  { studentId: 's3', firstName: 'Caleb', grade: '6', cohortMembershipId: 'cm3' },
];

function mockMembers(list = students) {
  vi.mocked(useCohortMembers).mockReturnValue({
    data: { cohortId: 'cohort-1', format: 'ONE_TO_THREE', students: list },
    isLoading: false,
  } as never);
}

function renderPage() {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: ['/tutor/assessments/cohort-1'] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '/tutor/assessments/:cohortId',
          element: createElement(WeeklyAssessmentPage),
        })
      )
    )
  );
}

describe('WeeklyAssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAssessmentsForStudent).mockReturnValue({
      data: { assessments: [] },
      isLoading: false,
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state for members', () => {
    vi.mocked(useCohortMembers).mockReturnValue({ isLoading: true } as never);
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders EmptyState if no members or error', () => {
    vi.mocked(useCohortMembers).mockReturnValue({ error: new Error('err') } as never);
    const { unmount } = renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Cohort members not found.');
    unmount();

    mockMembers([]);
    renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No students in this cohort.');
  });

  it('WeeklyAssessmentPage: one form per student, submitted independently', () => {
    mockMembers();
    renderPage();

    const forms = screen.getAllByTestId('assessment-form');
    expect(forms).toHaveLength(3);
    expect(useAssessmentsForStudent).toHaveBeenCalledWith('cm1');
    expect(useAssessmentsForStudent).toHaveBeenCalledWith('cm2');
    expect(useAssessmentsForStudent).toHaveBeenCalledWith('cm3');

    fireEvent.click(screen.getByText('Submit cm2'));

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith('cm2');
  });

  it('WeeklyAssessmentPage: already-submitted-this-week renders read-only with "Edit"', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z')); // a Monday
    mockMembers();
    vi.mocked(useAssessmentsForStudent).mockImplementation(((id: string) => ({
      data: {
        assessments:
          id === 'cm1'
            ? [
                {
                  id: 'a1',
                  cohortMembershipId: 'cm1',
                  weekStartDate: '2024-01-01',
                  tutorFeedback: 'Good',
                  createdAt: '2024-01-01',
                },
              ]
            : [],
      },
      isLoading: false,
    })) as never);

    renderPage();

    const forms = screen.getAllByTestId('assessment-form');
    expect(forms[0]).toHaveTextContent('Form:Readonly');
    expect(forms[1]).toHaveTextContent('Form:New');
    expect(forms[2]).toHaveTextContent('Form:New');
  });
});
