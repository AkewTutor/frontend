import type { AxiosError } from 'axios';

// Message for a failed POST /matching/select-tutor.
// 409: the student already has a pending or active match (not a problem with the tutor).
// 400: the server message is already student-safe ("Selected tutor is not eligible",
//      "Choose a subject first", ...), so it is shown as is.
export function selectTutorErrorMessage(error: AxiosError): string {
  if (error.response?.status === 409) {
    return 'You already have a pending or active match.';
  }
  if (error.response?.status === 400) {
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Could not select this tutor. Please try again.';
}
