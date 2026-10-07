import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { useRequestFormatSwitch } from '@/hooks/useFormatSwitch';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRequestFormatSwitch', () => {
  it('posts the selected cohort and target format and invalidates nothing', async () => {
    mockedApi.post.mockResolvedValue({ data: { formatSwitchRequestId: 'f1' } });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useRequestFormatSwitch(), { wrapper });
    result.current.mutate({ cohortId: 'c1', targetFormat: 'ONE_TO_THREE' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/format-switch', {
      cohortId: 'c1',
      targetFormat: 'ONE_TO_THREE',
    });
    expect(result.current.data).toEqual({ formatSwitchRequestId: 'f1' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('exposes an error state when the request fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('boom'));
    const { wrapper } = setup();

    const { result } = renderHook(() => useRequestFormatSwitch(), { wrapper });
    result.current.mutate({ cohortId: 'c1', targetFormat: 'ONE_TO_FIVE' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
