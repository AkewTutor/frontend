import type { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { selectTutorErrorMessage } from '@/utils/selectTutorError';

const err = (status?: number, data?: unknown) =>
  ({ response: status ? { status, data } : undefined }) as unknown as AxiosError;

describe('selectTutorErrorMessage', () => {
  it('409 says the student already has a pending or active match', () => {
    expect(selectTutorErrorMessage(err(409))).toBe('You already have a pending or active match.');
  });

  it('400 shows the server message', () => {
    expect(selectTutorErrorMessage(err(400, { message: 'Selected tutor is not eligible' }))).toBe(
      'Selected tutor is not eligible'
    );
  });

  it('400 without a usable message falls back to the generic text', () => {
    expect(selectTutorErrorMessage(err(400, {}))).toMatch(/could not select/i);
  });

  it('other errors and network failures use the generic text', () => {
    expect(selectTutorErrorMessage(err(500))).toMatch(/could not select/i);
    expect(selectTutorErrorMessage(err())).toMatch(/could not select/i);
  });
});
