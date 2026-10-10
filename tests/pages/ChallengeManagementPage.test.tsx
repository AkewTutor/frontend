import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChallengeManagementPage from '@/pages/admin/ChallengeManagementPage';
import type { Challenge } from '@/types';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useChallenges', () => ({
  useActiveChallenges: () => mocks.list(),
  useCreateChallenge: () => mocks.create,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const challenge: Challenge = {
  id: 'c1',
  title: 'Weekly Warrior',
  period: 'WEEKLY',
  startsAt: '2026-10-05T00:00:00.000Z',
  endsAt: '2026-10-12T00:00:00.000Z',
  targetValue: 5,
};

function setup(challenges: Challenge[] = [challenge]) {
  mocks.list.mockReturnValue({ data: { challenges }, isLoading: false, isError: false });
  render(<ChallengeManagementPage />);
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function openAndFill(startsAt: string, endsAt: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Create challenge' }));
  type('Title', 'Sprint');
  type('Description', 'Finish 5 sessions');
  type('Starts at', startsAt);
  type('Ends at', endsAt);
  type('Target value', '5');
}

describe('ChallengeManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mutate.mockReset();
  });

  it('lists the active challenges', () => {
    setup();
    expect(screen.getByText('Weekly Warrior')).toBeInTheDocument();
  });

  it('shows the empty state when there are none', () => {
    setup([]);
    expect(screen.getByText('No active challenges.')).toBeInTheDocument();
  });

  it('on a list error, shows a notice and only challenges created in this session', async () => {
    mocks.list.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    mocks.create.mutate.mockImplementation(
      (_body: unknown, o?: { onSuccess?: (c: Challenge) => void }) =>
        o?.onSuccess?.({ ...challenge, id: 'c2', title: 'Sprint' })
    );
    render(<ChallengeManagementPage />);
    expect(screen.getByText(/Could not load the full list/)).toBeInTheDocument();
    expect(screen.getByText('No active challenges.')).toBeInTheDocument();

    openAndFill('2026-10-12T09:00', '2026-10-19T09:00');
    fireEvent.click(screen.getByRole('button', { name: 'Save challenge' }));
    expect(await screen.findByText('Sprint')).toBeInTheDocument();
  });

  it('blocks submit when endsAt is not after startsAt', async () => {
    setup();
    openAndFill('2026-10-12T09:00', '2026-10-11T09:00');
    fireEvent.click(screen.getByRole('button', { name: 'Save challenge' }));
    expect(await screen.findByText('End time must be after start time.')).toBeInTheDocument();
    expect(mocks.create.mutate).not.toHaveBeenCalled();
  });

  it('submits a valid challenge with ISO dates', async () => {
    setup();
    openAndFill('2026-10-12T09:00', '2026-10-19T09:00');
    fireEvent.click(screen.getByRole('button', { name: 'Save challenge' }));
    await waitFor(() => expect(mocks.create.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.create.mutate).toHaveBeenCalledWith(
      {
        title: 'Sprint',
        description: 'Finish 5 sessions',
        period: 'WEEKLY',
        startsAt: new Date('2026-10-12T09:00').toISOString(),
        endsAt: new Date('2026-10-19T09:00').toISOString(),
        targetValue: 5,
      },
      expect.any(Object)
    );
  });

  it('requires a title', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Create challenge' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save challenge' }));
    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(mocks.create.mutate).not.toHaveBeenCalled();
  });
});
