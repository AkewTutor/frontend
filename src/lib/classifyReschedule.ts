export function classifyReschedule(
  sessionScheduledStart: string,
  requestedAt: Date
): 'FREE_RESCHEDULE' | 'SAME_DAY_MISS' {
  const hoursUntilSession =
    (new Date(sessionScheduledStart).getTime() - requestedAt.getTime()) / 3_600_000;
  if (hoursUntilSession >= 12) {
    return 'FREE_RESCHEDULE';
  }
  return 'SAME_DAY_MISS';
}
