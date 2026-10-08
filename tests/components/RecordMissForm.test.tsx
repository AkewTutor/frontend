import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import RecordMissForm from '@/components/class-delivery/RecordMissForm';
import { useRecordSessionMiss } from '@/hooks/useSessionMiss';
import type { RecordSessionMissBody, RecordSessionMissResult } from '@/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useSessionMiss');
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
    type = 'button',
  }: {
    children?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
  }) => createElement('button', { disabled, onClick, type }, children),
}));

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

const TUTOR_RESULT: RecordSessionMissResult = {
  id: 'm1',
  sessionId: UUID,
  causedBy: 'TUTOR',
  missType: 'NO_SHOW',
  makeupSessionId: 's2',
  makeupDeadline: '2026-09-13T00:00:00Z',
  tutorEarningRateForMakeup: 'REDUCED_MAKEUP',
};
const STUDENT_RESULT: RecordSessionMissResult = {
  id: 'm2',
  sessionId: UUID,
  causedBy: 'STUDENT',
  missType: 'NO_SHOW',
  makeupSessionId: null,
  tutorEarningRateForOriginalSession: 'FULL',
};

type MutateOptions = { onSuccess: (data: RecordSessionMissResult) => void };

function mockSuccess(result: RecordSessionMissResult) {
  vi.mocked(useRecordSessionMiss).mockImplementation(
    () =>
      ({
        mutate: (_vars: RecordSessionMissBody, options: MutateOptions) => options.onSuccess(result),
        isPending: false,
        error: null,
      }) as never
  );
}

function fillAndSubmit(causedBy: string) {
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: causedBy } });
  fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'NO_SHOW' } });
  fireEvent.click(screen.getByRole('button', { name: 'Record Miss' }));
}

describe('RecordMissForm', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRecordSessionMiss).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as never);
  });

  it('valid-UUID check by regex, submit disabled until sessionId, causedBy and missType are all set', () => {
    render(createElement(RecordMissForm));
    const submitBtn = screen.getByRole('button', { name: 'Record Miss' });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: 'invalid' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'TUTOR' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'NO_SHOW' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: UUID } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits the exact body { sessionId, causedBy, missType }', () => {
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    fillAndSubmit('STUDENT');
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      { sessionId: UUID, causedBy: 'STUDENT', missType: 'NO_SHOW' },
      expect.any(Object)
    );
  });

  it('offers all three miss types including TECHNICAL_FAILURE', () => {
    render(createElement(RecordMissForm));
    expect(screen.getByRole('option', { name: 'No Show' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Late Cancellation' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Technical Failure' })).toBeInTheDocument();
  });

  it('initialSessionId prefills the sessionId field', () => {
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    expect((screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement).value).toBe(UUID);
  });

  it('result panel branches on result.causedBy (TUTOR)', () => {
    mockSuccess(TUTOR_RESULT);
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    fillAndSubmit('TUTOR');
    expect(screen.getByText('Tutor must make up the session.')).toBeInTheDocument();
    expect(screen.getByText('2026-09-13T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('REDUCED_MAKEUP')).toBeInTheDocument();
  });

  it('result panel branches on result.causedBy (STUDENT)', () => {
    mockSuccess(STUDENT_RESULT);
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    fillAndSubmit('STUDENT');
    expect(screen.getByText('No make-up or refund required.')).toBeInTheDocument();
    expect(screen.getByText('Tutor will be paid in full for this session.')).toBeInTheDocument();
    expect(screen.queryByText('Tutor must make up the session.')).not.toBeInTheDocument();
  });

  it('editing any field clears the result', () => {
    mockSuccess(STUDENT_RESULT);
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    fillAndSubmit('STUDENT');
    expect(screen.getByText('Session Miss Recorded')).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'TUTOR' } });
    expect(screen.queryByText('Session Miss Recorded')).not.toBeInTheDocument();
  });

  it('Record another clears the form and result', () => {
    mockSuccess(STUDENT_RESULT);
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    fillAndSubmit('STUDENT');
    fireEvent.click(screen.getByRole('button', { name: 'Record Another' }));

    expect(screen.queryByText('Session Miss Recorded')).not.toBeInTheDocument();
    expect((screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement).value).toBe('');
    expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('');
  });

  it('409 shows the server message inline under sessionId', () => {
    const msg = 'A miss has already been recorded for this session';
    vi.mocked(useRecordSessionMiss).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: msg, response: { status: 409 } },
    } as never);
    render(createElement(RecordMissForm, { initialSessionId: UUID }));
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    expect(input.parentElement).toContainElement(screen.getByText(msg));
  });
});
