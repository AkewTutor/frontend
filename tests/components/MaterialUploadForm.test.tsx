import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaterialUploadForm from '@/components/class-delivery/MaterialUploadForm';
import { useUploadMaterial } from '@/hooks/useLibrary';

vi.mock('@/hooks/useLibrary', () => ({
  useUploadMaterial: vi.fn(),
}));

const mockUseUploadMaterial = vi.mocked(useUploadMaterial);

describe('MaterialUploadForm', () => {
  it('Submit disabled until both title and file are set', async () => {
    const mutate = vi.fn();
    mockUseUploadMaterial.mockReturnValue({ mutate, isPending: false } as never);
    render(<MaterialUploadForm cohortId="c1" />);

    const user = userEvent.setup();
    const titleInput = screen.getByLabelText(/Title/i);
    const fileInput = screen.getByLabelText(/File/i);
    const submitBtn = screen.getByRole('button', { name: /Upload/i });

    expect(submitBtn).toBeDisabled();

    await user.type(titleInput, 'Test Title');
    expect(submitBtn).toBeDisabled();

    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);
    expect(submitBtn).toBeEnabled();
  });
});
