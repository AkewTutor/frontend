// Backend list responses carry flat { page, limit, total } (no totalPages).
export function totalPages(data?: { total?: number; limit?: number }): number {
  if (!data?.total || !data.limit) return 1;
  return Math.max(1, Math.ceil(data.total / data.limit));
}
