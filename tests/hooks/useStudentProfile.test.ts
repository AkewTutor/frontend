import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useMyStudentProfile,
  useUpdateAcademicProfile,
  useUpdateProfile,
} from '@/hooks/useStudentProfile';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, spy };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMyStudentProfile', () => {
  it('passes studentId as a param for a Parent caller', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 'p1' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyStudentProfile('s1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/students/me/profile', {
      params: { studentId: 's1' },
    });
    expect(result.current.data).toEqual({ id: 'p1' });
  });

  it('omits studentId for a Student self-view', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 'p1' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyStudentProfile(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/students/me/profile', {
      params: { studentId: undefined },
    });
  });
});

describe('useUpdateProfile', () => {
  it('patches the profile and invalidates [STUDENT_PROFILE, studentId]', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 'p1' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useUpdateProfile('s1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ studentId: 's1', profilePictureUrl: 'u' });
    });
    expect(mockedApi.patch).toHaveBeenCalledWith('/students/me/profile', {
      studentId: 's1',
      profilePictureUrl: 'u',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.STUDENT_PROFILE, 's1'] });
  });
});

describe('useUpdateAcademicProfile', () => {
  it('patches the academic profile and invalidates [STUDENT_PROFILE, studentId]', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 'p1' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useUpdateAcademicProfile(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ learningGoals: 'Pass exams' });
    });
    expect(mockedApi.patch).toHaveBeenCalledWith('/students/me/academic-profile', {
      learningGoals: 'Pass exams',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.STUDENT_PROFILE, undefined] });
  });
});
