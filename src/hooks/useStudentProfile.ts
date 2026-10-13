import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { StudentProfile } from '@/types';

// studentId required when the caller is a Parent; omitted for Student self-view.
export function useMyStudentProfile(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STUDENT_PROFILE, studentId],
    queryFn: () =>
      api
        .get<StudentProfile>('/students/me/profile', { params: { studentId } })
        .then((r) => r.data),
  });
}

export function useUpdateProfile(studentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { studentId?: string; profilePictureUrl?: string }) =>
      api.patch<StudentProfile>('/students/me/profile', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT_PROFILE, studentId] }),
  });
}

export function useUpdateAcademicProfile(studentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<StudentProfile> & { studentId?: string }) =>
      api.patch<StudentProfile>('/students/me/academic-profile', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT_PROFILE, studentId] }),
  });
}

export function useUploadProfilePicture(studentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api
        .post<StudentProfile>('/students/me/profile-picture', form, {
          params: studentId ? { studentId } : undefined,
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT_PROFILE, studentId] }),
  });
}
