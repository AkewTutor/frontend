/** Relative-path-only guard (open-redirect protection). Single '/', no '//', no backslash, no scheme. */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('\\')) return null;
  return value;
}
