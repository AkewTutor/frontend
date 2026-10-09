import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLibraryPage from '@/pages/admin/AdminLibraryPage';
import { useCohortMaterials, useAdminOverrideMaterial } from '@/hooks/useLibrary';

vi.mock('@/hooks/useLibrary', () => ({
  useCohortMaterials: vi.fn(),
  useAdminOverrideMaterial: vi.fn(),
}));

const mockUseCohortMaterials = vi.mocked(useCohortMaterials);
const mockUseAdminOverrideMaterial = vi.mocked(useAdminOverrideMaterial);

function renderPage(search = '?cohortId=c1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/library${search}`]}>
      <Routes>
        <Route path="/admin/library" element={<AdminLibraryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminLibraryPage', () => {
  let mutate: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks();
    mutate = vi.fn();
    mockUseAdminOverrideMaterial.mockReturnValue({ mutate, isPending: false } as never);
  });

  it('No cohortId in query string -> EmptyState, no fetch', () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [] },
      isLoading: false,
    } as never);
    renderPage('');
    expect(screen.getByText('No cohort selected')).toBeInTheDocument();
    expect(mockUseCohortMaterials).toHaveBeenCalledWith(undefined);
  });

  it('Lists materials for the cohort', () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [{ id: 'm1', title: 'Mat1' }] },
      isLoading: false,
    } as never);
    renderPage();
    expect(screen.getByText('Mat1')).toBeInTheDocument();
  });

  it('Rename rejects blank/whitespace title', async () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [{ id: 'm1', title: 'Mat1' }] },
      isLoading: false,
    } as never);
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Rename/i }));

    const input = screen.getByDisplayValue('Mat1');
    await user.clear(input);
    await user.type(input, '   ');

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect(saveBtn).toBeDisabled();
  });

  it('Rename trims and mutates', async () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [{ id: 'm1', title: 'Mat1' }] },
      isLoading: false,
    } as never);
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Rename/i }));

    const input = screen.getByDisplayValue('Mat1');
    await user.clear(input);
    await user.type(input, '  New  ');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1', cohortId: 'c1', title: 'New' }),
      expect.any(Object)
    );
  });

  it('Remove requires confirm (cancel path works)', async () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [{ id: 'm1', title: 'Mat1' }] },
      isLoading: false,
    } as never);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Remove/i }));
    expect(screen.getByText('Remove Material?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Remove/i }));
    await user.click(screen.getByRole('button', { name: /Confirm Remove/i }));

    expect(mutate).toHaveBeenCalledWith({ id: 'm1', cohortId: 'c1', remove: true });
  });

  it('Never sends title and remove together', async () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [{ id: 'm1', title: 'Mat1' }] },
      isLoading: false,
    } as never);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Rename/i }));
    const input = screen.getByDisplayValue('Mat1');
    await user.clear(input);
    await user.type(input, 'NewT');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    const renameCall = mutate.mock.calls[0][0];
    expect(renameCall).toHaveProperty('title');
    expect(renameCall).not.toHaveProperty('remove');
    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    await user.click(screen.getByRole('button', { name: /Remove/i }));
    await user.click(screen.getByRole('button', { name: /Confirm Remove/i }));

    const removeCall = mutate.mock.calls[1][0];
    expect(removeCall).toHaveProperty('remove');
    expect(removeCall).not.toHaveProperty('title');
  });

  it('Row vanishing after refetch is the success signal', async () => {
    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [{ id: 'm1', title: 'Mat1' }] },
      isLoading: false,
    } as never);
    const { rerender } = renderPage();
    expect(screen.getByText('Mat1')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Remove/i }));
    await user.click(screen.getByRole('button', { name: /Confirm Remove/i }));

    mockUseCohortMaterials.mockReturnValue({
      data: { materials: [] },
      isLoading: false,
    } as never);
    rerender(
      <MemoryRouter initialEntries={[`/admin/library?cohortId=c1`]}>
        <Routes>
          <Route path="/admin/library" element={<AdminLibraryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Mat1')).not.toBeInTheDocument();
  });
});
