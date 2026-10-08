import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import InviteActivationPage from '@/pages/InviteActivationPage';

const mocks = vi.hoisted(() => ({ activate: { mutate: vi.fn(), isPending: false } }));
vi.mock('@/hooks/useGuardianship', () => ({ useActivateInvite: () => mocks.activate }));

beforeEach(() => vi.clearAllMocks());

function setup() {
  render(
    <MemoryRouter initialEntries={['/invite/tok1/activate']}>
      <Routes>
        <Route path="/invite/:token/activate" element={<InviteActivationPage />} />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function fill(password: string, confirm: string, terms = true) {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: confirm } });
  if (terms) fireEvent.click(screen.getByLabelText(/accept the terms/i));
  fireEvent.click(screen.getByRole('button', { name: 'Activate account' }));
}

describe('InviteActivationPage', () => {
  it('blocks a password mismatch client-side', async () => {
    setup();
    fill('password1', 'password2');
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(mocks.activate.mutate).not.toHaveBeenCalled();
  });

  it('requires the terms to be accepted', async () => {
    setup();
    fill('password1', 'password1', false);
    expect(await screen.findByText('You must accept the terms')).toBeInTheDocument();
    expect(mocks.activate.mutate).not.toHaveBeenCalled();
  });

  it('activates with the URL token and goes to login', async () => {
    mocks.activate.mutate.mockImplementation((_b, o) => o?.onSuccess?.({}));
    setup();
    fill('password1', 'password1');
    expect(await screen.findByText('login-page')).toBeInTheDocument();
    expect(mocks.activate.mutate.mock.calls[0][0]).toEqual({
      token: 'tok1',
      password: 'password1',
      termsAccepted: true,
    });
  });

  it('shows a token-specific message for an expired invite, not the mismatch copy', async () => {
    mocks.activate.mutate.mockImplementation((_b, o) =>
      o?.onError?.({ response: { status: 400 } })
    );
    setup();
    fill('password1', 'password1');
    expect(await screen.findByText(/no longer valid/i)).toBeInTheDocument();
    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });

  it('shows "Invite not found." for an unknown token', async () => {
    mocks.activate.mutate.mockImplementation((_b, o) =>
      o?.onError?.({ response: { status: 404 } })
    );
    setup();
    fill('password1', 'password1');
    await waitFor(() => expect(screen.getByText('Invite not found.')).toBeInTheDocument());
  });
});
