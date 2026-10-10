import { render, screen, fireEvent, within } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ComplaintForm from '@/components/support/ComplaintForm';
import { useFileComplaint } from '@/hooks/useComplaints';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { useMyPayments } from '@/hooks/usePayments';
import { useMyCohorts } from '@/hooks/useCohort';
import { useAuthStore } from '@/store/auth.store';
import { QUERY_KEYS, ROUTES } from '@/constants';
import type { Role } from '@/types';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigateMock,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/useComplaints');
vi.mock('@/hooks/useSessions');
vi.mock('@/hooks/usePayments', () => ({ useMyPayments: vi.fn() }));
vi.mock('@/hooks/useCohort');

const mutate = vi.fn();
const VALID = 'The tutor did not show up to the class.';

const mockFile = (over: Record<string, unknown> = {}) =>
  vi
    .mocked(useFileComplaint)
    .mockReturnValue({ mutate, isPending: false, error: null, ...over } as never);

function setRole(role: Role) {
  useAuthStore.setState({
    token: 't',
    refreshToken: 'r',
    user: { id: 'u1', role, email: 'a@b.c', phone: null },
  });
}

let qc: QueryClient;
const renderForm = () => {
  qc = new QueryClient();
  return render(
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, null, createElement(ComplaintForm))
    )
  );
};

const submit = () => screen.getByRole('button', { name: /submit complaint/i });
const pick = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fill = (category: string, description = VALID) => {
  pick('Category', category);
  pick('Description', description);
};

describe('ComplaintForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRole('STUDENT');
    mockFile();
    vi.mocked(useUpcomingSessions).mockReturnValue({
      data: {
        sessions: [{ id: 's1', scheduledStart: '2026-10-12T10:00:00Z', status: 'SCHEDULED' }],
      },
    } as never);
    vi.mocked(useMyPayments).mockReturnValue({
      data: {
        payments: [
          { id: 'p1', amount: '350.00', status: 'SUCCESS', createdAt: '2026-10-01T00:00:00Z' },
        ],
      },
    } as never);
    vi.mocked(useMyCohorts).mockReturnValue({
      data: { cohorts: [{ cohortId: 'c1', format: 'ONE_TO_ONE', status: 'ACTIVE' }] },
    } as never);
  });

  it('submit is disabled for a non-OTHER category with no related entity', () => {
    renderForm();
    fill('SESSION_ISSUE');
    expect(submit()).toBeDisabled();
  });

  it('selecting OTHER alone enables submit', () => {
    renderForm();
    fill('OTHER');
    expect(submit()).toBeEnabled();
  });

  it('setting any one related field enables submit without OTHER', () => {
    renderForm();
    fill('SESSION_ISSUE');
    pick(/related session/i, 's1');
    expect(submit()).toBeEnabled();
  });

  it.each([
    ['session', /related session/i, 's1'],
    ['payment', /related payment/i, 'p1'],
    ['class', /related class/i, 'c1'],
  ])('setting only the %s field is enough', (_n, label, value) => {
    renderForm();
    fill('PAYMENT_ISSUE');
    pick(label, value);
    expect(submit()).toBeEnabled();
  });

  it('pickers list only entries from the caller own hooks and there is no free-text id input', () => {
    renderForm();
    const optionValues = (label: RegExp) =>
      within(screen.getByLabelText(label))
        .getAllByRole('option')
        .map((o) => (o as HTMLOptionElement).value);
    expect(optionValues(/related session/i)).toEqual(['', 's1']);
    expect(optionValues(/related payment/i)).toEqual(['', 'p1']);
    expect(optionValues(/related class/i)).toEqual(['', 'c1']);
    expect(screen.queryByRole('textbox', { name: /id/i })).not.toBeInTheDocument();
    // the only free text control is the description
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('description shorter than 10 or longer than 2000 characters is rejected', () => {
    renderForm();
    fill('OTHER', 'short');
    expect(submit()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 10/i);

    pick('Description', 'x'.repeat(2001));
    expect(submit()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/at most 2000/i);

    pick('Description', 'x'.repeat(2000));
    expect(submit()).toBeEnabled();
    fireEvent.submit(submit().closest('form') as HTMLFormElement);
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('submit sends only the set fields, then toasts, refreshes the history and navigates', () => {
    mutate.mockImplementation((_body, opts) => opts.onSuccess());
    renderForm();
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    fill('SESSION_ISSUE');
    pick(/related session/i, 's1');
    fireEvent.click(submit());

    expect(mutate).toHaveBeenCalledWith(
      { category: 'SESSION_ISSUE', description: VALID, relatedSessionId: 's1' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.MY_COMPLAINTS] });
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.COMPLAINTS);
  });

  it('a failed submit does not toast or navigate and shows a form-level error (400 fallback)', () => {
    mockFile({ error: { response: { data: { message: 'Must reference a session' } } } });
    renderForm();
    expect(screen.getByRole('alert')).toHaveTextContent('Must reference a session');
    expect(toast.success).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('a tutor only gets the session picker', () => {
    setRole('TUTOR');
    renderForm();
    expect(screen.getByLabelText(/related session/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/related payment/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/related class/i)).not.toBeInTheDocument();
  });

  it('a parent gets no pickers and can still file with OTHER', () => {
    setRole('PARENT');
    renderForm();
    expect(screen.queryByLabelText(/related/i)).not.toBeInTheDocument();
    expect(useUpcomingSessions).not.toHaveBeenCalled();
    fill('OTHER');
    expect(submit()).toBeEnabled();
  });
});
