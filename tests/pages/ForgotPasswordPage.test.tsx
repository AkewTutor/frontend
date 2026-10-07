import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

function TestSetup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
  it('renders generic success message on submit', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(post).toHaveBeenCalledWith('/auth/forgot-password', { identifier: 'me@test.com' });

    await waitFor(() => {
      expect(
        screen.getByText('If an account exists, a reset code has been sent.')
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /send reset code/i })).not.toBeInTheDocument();
  });
});
