import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DisputeCard from '@/components/admin-support/DisputeCard';
import type { DisputeDetail } from '@/hooks/useAdminDisputes';

const base: DisputeDetail = {
  id: 'c1',
  category: 'SESSION_ISSUE',
  status: 'OPEN',
  createdAt: '2026-09-06T15:00:00Z',
  resolvedAt: null,
  description: 'The tutor did not join the session.',
  resolutionAction: null,
  reporterId: 'u1',
  reporterRole: 'PARENT',
  relatedCohortId: null,
  relatedSessionId: null,
  relatedPaymentId: null,
  relatedThreadId: null,
  resolutionNotes: null,
  resolvedById: null,
  candidateMemberships: [],
};

const withMemberships: Partial<DisputeDetail> = {
  relatedCohortId: 'cohort-1',
  candidateMemberships: [
    {
      id: 'm1',
      studentDisplayName: 'Abel',
      hasActivePaidCycle: true,
      refundPreviewAmount: '50.00',
    },
    { id: 'm2', studentDisplayName: 'Sara', hasActivePaidCycle: false, refundPreviewAmount: null },
    { id: 'm3', studentDisplayName: 'Dawit', hasActivePaidCycle: true, refundPreviewAmount: null },
  ],
};

const onResolve = vi.fn();

const renderCard = (overrides: Partial<DisputeDetail> = {}, isSubmitting = false) =>
  render(
    createElement(
      MemoryRouter,
      null,
      createElement(DisputeCard, { complaint: { ...base, ...overrides }, onResolve, isSubmitting })
    )
  );

const choose = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('DisputeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders context links only when the corresponding id is present', () => {
    renderCard({ relatedThreadId: 'thread-1', relatedSessionId: null });

    expect(screen.getByRole('link', { name: /message thread/i })).toHaveAttribute(
      'href',
      '/admin/messaging/thread-1'
    );
    expect(screen.queryByRole('link', { name: /record a miss/i })).toBeNull();
  });

  it('relatedSessionId link targets the admin miss page', () => {
    renderCard({ relatedSessionId: 's1' });

    const link = screen.getByRole('link', { name: /record a miss/i });
    expect(link).toHaveAttribute('href', '/admin/session-misses?sessionId=s1');
    screen.getAllByRole('link').forEach((a) => {
      expect(a.getAttribute('href')).not.toMatch(/\/sessions\//);
    });
  });

  it('resolutionAction select disabled until status === RESOLVED', () => {
    renderCard();

    expect(screen.getByLabelText('Status')).toHaveValue('UNDER_REVIEW');
    expect(screen.getByLabelText('Resolution action')).toBeDisabled();

    choose('Status', 'RESOLVED');
    expect(screen.getByLabelText('Resolution action')).toBeEnabled();
  });

  it('affectedCohortMembershipId renders as a select with a read-only preview, never a free-text amount (H4 fix)', () => {
    renderCard(withMemberships);
    choose('Status', 'RESOLVED');
    choose('Resolution action', 'REFUND_ISSUED');

    const picker = screen.getByLabelText('Affected student');
    expect(picker.tagName).toBe('SELECT');
    expect(screen.queryByTestId('refund-preview')).toBeNull();

    choose('Affected student', 'm1');

    const preview = screen.getByTestId('refund-preview');
    expect(preview).toHaveTextContent('50.00');
    expect(preview.tagName).not.toBe('INPUT');
    expect(screen.queryByRole('spinbutton')).toBeNull();
    screen.getAllByRole('textbox').forEach((el) => {
      expect(el.getAttribute('name') ?? '').not.toMatch(/amount/i);
      expect(el.tagName).not.toBe('INPUT');
    });
  });

  it('TUTOR_SUSPENDED / REFUND_ISSUED options are disabled without resolvable context', () => {
    renderCard({
      category: 'MESSAGE_ISSUE',
      relatedSessionId: null,
      relatedCohortId: null,
      candidateMemberships: [],
    });
    choose('Status', 'RESOLVED');

    expect(screen.getByRole('option', { name: 'Tutor suspended' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Refund issued' })).toBeDisabled();
    expect(screen.getByText(/Suspension unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Refund unavailable/)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'No action' })).toBeEnabled();
  });

  it('onResolve payload never includes a raw refund amount', () => {
    renderCard(withMemberships);
    choose('Status', 'RESOLVED');
    choose('Resolution action', 'REFUND_ISSUED');
    choose('Affected student', 'm1');
    choose('Resolution notes', 'Tutor no-show confirmed.');
    fireEvent.click(screen.getByRole('button', { name: /submit resolution/i }));

    expect(onResolve).toHaveBeenCalledTimes(1);
    const body = onResolve.mock.calls[0][0];
    expect(body).toEqual({
      status: 'RESOLVED',
      resolutionAction: 'REFUND_ISSUED',
      resolutionNotes: 'Tutor no-show confirmed.',
      affectedCohortMembershipId: 'm1',
    });
    expect(body).not.toHaveProperty('refundAmount');
    expect(JSON.stringify(body)).not.toContain('50.00');
  });

  it('TUTOR_SUSPENDED is enabled when the complaint is linked to a cohort', () => {
    renderCard({ relatedCohortId: 'cohort-1' });
    choose('Status', 'RESOLVED');

    expect(screen.getByRole('option', { name: 'Tutor suspended' })).toBeEnabled();
    expect(screen.queryByText(/Suspension unavailable/)).toBeNull();
  });

  it('a membership with no refundable cycle is not selectable in the picker', () => {
    renderCard(withMemberships);
    choose('Status', 'RESOLVED');
    choose('Resolution action', 'REFUND_ISSUED');

    expect(screen.getByRole('option', { name: 'Abel' })).toBeEnabled();
    expect(screen.getByRole('option', { name: /Sara.*no paid billing cycle/ })).toBeDisabled();
    expect(screen.getByRole('option', { name: /Dawit.*nothing left to refund/ })).toBeDisabled();
  });

  it('submit stays disabled until notes and the required choices are present', () => {
    renderCard(withMemberships);
    const submit = screen.getByRole('button', { name: /submit resolution/i });
    expect(submit).toBeDisabled();

    choose('Resolution notes', 'Looking into it.');
    expect(submit).toBeEnabled();

    choose('Status', 'RESOLVED');
    expect(submit).toBeDisabled();

    choose('Resolution action', 'REFUND_ISSUED');
    expect(submit).toBeDisabled();

    choose('Affected student', 'm1');
    expect(submit).toBeEnabled();
  });

  it('DISMISSED sends no resolution action or membership', () => {
    renderCard(withMemberships);
    choose('Status', 'DISMISSED');
    choose('Resolution notes', 'Not a policy violation.');
    fireEvent.click(screen.getByRole('button', { name: /submit resolution/i }));

    expect(onResolve).toHaveBeenCalledWith({
      status: 'DISMISSED',
      resolutionNotes: 'Not a policy violation.',
    });
  });

  it('a closed complaint shows its outcome and offers no resolution form', () => {
    renderCard({
      status: 'RESOLVED',
      resolutionAction: 'WARNING_ISSUED',
      resolutionNotes: 'Warned the tutor.',
    });

    expect(screen.getByText(/Warned the tutor\./)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit resolution/i })).toBeNull();
    expect(screen.queryByLabelText('Resolution action')).toBeNull();
  });
});
