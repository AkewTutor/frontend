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
    { cohortId: string; title: string; fileType: 'PDF' | 'NOTE' | 'BOOK'; file: File }
  >({
    mutationFn: ({ cohortId, title, fileType, file }) => {
      const formData = new FormData();
      formData.append('cohortId', cohortId);
      formData.append('title', title);
      formData.append('fileType', fileType);
      formData.append('file', file);
      return api.post<UploadMaterialResponse>('/library/materials', formData).then((r) => r.data);
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
