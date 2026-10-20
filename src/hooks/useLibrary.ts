import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';

export interface CohortMaterial {
  id: string;
  title: string;
  fileType: 'PDF' | 'NOTE' | 'BOOK';
  fileUrl: string;
  createdAt: string;
  downloadUrl?: string;
  removedAt?: string | null;
}

export interface CohortMaterialsResponse {
  materials: CohortMaterial[];
}

export interface UploadMaterialResponse {
  id: string;
  cohortId: string;
  title: string;
  fileType: 'PDF' | 'NOTE' | 'BOOK';
  fileUrl: string;
}

export interface AdminOverrideResponse {
  id: string;
  title: string;
}

export function useCohortMaterials(cohortId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, cohortId],
    queryFn: () =>
      api
        .get<CohortMaterialsResponse>(`/library/cohorts/${cohortId}/materials`)
        .then((r) => r.data),
    enabled: !!cohortId,
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation<
    UploadMaterialResponse,
    AxiosError,
    { cohortId: string; title: string; file: File }
  >({
    mutationFn: ({ cohortId, title, file }) => {
      const formData = new FormData();
      formData.append('cohortId', cohortId);
      formData.append('title', title);

      formData.append('file', file);
      return api
        .post<UploadMaterialResponse>('/library/materials', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        })
        .then((r) => r.data);
    },
    onSuccess: (_, { cohortId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, cohortId] });
    },
  });
}

export function useAdminOverrideMaterial() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminOverrideResponse,
    AxiosError,
    { id: string; cohortId: string; title?: string; remove?: boolean }
  >({
    mutationFn: ({ id, title, remove }) => {
      const body: Record<string, unknown> = {};
      if (title !== undefined) body.title = title;
      if (remove !== undefined) body.remove = remove;
      return api
        .patch<AdminOverrideResponse>(`/admin/library/materials/${id}`, body)
        .then((r) => r.data);
    },
    onSuccess: (_, { cohortId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, cohortId] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: string; cohortId: string }>({
    mutationFn: ({ id }) => api.delete(`/library/materials/${id}`).then((r) => r.data),
    onSuccess: (_, { cohortId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, cohortId] });
    },
  });
}

export interface LibraryActivityUser {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface LibraryActivityItem {
  id: string;
  title: string;
  fileType: string;
  cohortId: string;
  createdAt: string;
  removedAt: string | null;
  fileUrl: string | null;
  tutor: LibraryActivityUser | null;
  students: LibraryActivityUser[];
}

export function useLibraryActivity(q: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, 'activity', q],
    queryFn: () =>
      api
        .get<{ items: LibraryActivityItem[] }>('/admin/library/activity', {
          params: q ? { q } : {},
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}