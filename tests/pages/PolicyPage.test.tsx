import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import PolicyPage from '@/pages/PolicyPage';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));
const get = vi.mocked(api.get);

function TestSetup({ initialEntry }: { initialEntry: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/policies/:type" element={<PolicyPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PolicyPage', () => {
  it('valid type fetches and renders', async () => {
    get.mockResolvedValueOnce({
      data: { title: 'Privacy Policy', content: '# Privacy Policy Content', type: 'PRIVACY' },
    });

    render(<TestSetup initialEntry="/policies/privacy" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy Content' })
    ).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/policies/PRIVACY');
  });

  it('invalid type never calls usePolicy', async () => {
    render(<TestSetup initialEntry="/policies/invalid" />);

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();

    expect(get).not.toHaveBeenCalled();
  });

  it('markdown sanitized', async () => {
    get.mockResolvedValueOnce({
      data: {
        title: 'Safety Guidelines',
        content: '<script>alert("xss")</script><img src="x" onerror="alert(1)">\n\n# Safe Content',
        type: 'SAFETY',
      },
    });

    const { container } = render(<TestSetup initialEntry="/policies/safety" />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Safety Guidelines' })
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Safe Content' })).toBeInTheDocument();

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('shows EmptyState when policy is missing or errors', async () => {
    get.mockRejectedValueOnce(new Error('Not found'));

    render(<TestSetup initialEntry="/policies/terms" />);

    await waitFor(() => {
      expect(screen.getByText('Policy not yet published')).toBeInTheDocument();
    });
  });
});
