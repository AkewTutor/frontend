import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PolicyManagementPage from '@/pages/admin/PolicyManagementPage';
import { useAuthStore } from '@/store/auth.store';

const { mutate, usePolicyMock, usePublishMock } = vi.hoisted(() => ({
  mutate: vi.fn(),
  usePolicyMock: vi.fn(),
  usePublishMock: vi.fn(),
}));

vi.mock('@/hooks/usePolicy', () => ({
  usePolicy: (...args: unknown[]) => usePolicyMock(...args),
}));
vi.mock('@/hooks/useAdminPolicies', () => ({
  usePublishPolicy: () => usePublishMock(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/policies']}>
      <Routes>
        <Route path="/admin/policies" element={<PolicyManagementPage />} />
        <Route path="/" element={<p>landing page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

import type { Role } from '@/types';

function signIn(role: Role) {
  useAuthStore.setState({
    token: 't',
    user: { id: '1', email: 'a@b.co', phone: null, role },
  });
}

function publishedPolicy(version = 3, content = 'abc') {
  usePolicyMock.mockReturnValue({
    data: { title: 'T', version, content },
    isLoading: false,
    isError: false,
    error: null,
  });
}

const editor = () => screen.getByLabelText('Content (markdown)') as HTMLTextAreaElement;
const publishBtn = () => screen.getByRole('button', { name: 'Publish' });
const edit = (value: string) => fireEvent.change(editor(), { target: { value } });

beforeEach(() => {
  vi.clearAllMocks();
  signIn('ADMIN');
  publishedPolicy();
  usePublishMock.mockReturnValue({ mutate, isPending: false });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
  vi.restoreAllMocks();
});

describe('PolicyManagementPage', () => {
  it('redirects a non-admin and renders no editor', () => {
    signIn('STUDENT');
    renderPage();
    expect(screen.getByText('landing page')).toBeInTheDocument();
    expect(screen.queryByLabelText('Content (markdown)')).toBeNull();
    expect(usePublishMock).not.toHaveBeenCalled();
  });

  it('pre-fills the editor with the current published text', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Policy type'), { target: { value: 'TERMS' } });
    expect(usePolicyMock).toHaveBeenLastCalledWith('TERMS');
    expect(editor().value).toBe('abc');
  });

  it('disables Publish when content is unchanged, blank or whitespace, and enables it after a real edit', () => {
    renderPage();
    expect(publishBtn()).toBeDisabled();
    edit('   ');
    expect(publishBtn()).toBeDisabled();
    edit('');
    expect(publishBtn()).toBeDisabled();
    edit('abc updated');
    expect(publishBtn()).toBeEnabled();
  });

  it('sends nothing until confirmed: cancel leaves mutate uncalled, confirm calls it once', async () => {
    renderPage();
    edit('new text');
    fireEvent.click(publishBtn());
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(mutate).not.toHaveBeenCalled();

    fireEvent.click(publishBtn());
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm publish' }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({ type: 'PRIVACY', content: 'new text' });
  });

  it('confirm copy shows the next version and the immutability notice', async () => {
    renderPage();
    edit('new text');
    fireEvent.click(publishBtn());
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/version 4 of PRIVACY/)).toBeInTheDocument();
    expect(within(dialog).getByText(/never edited or deleted/)).toBeInTheDocument();
  });

  it('starts empty and says version 1 when nothing is published (404)', async () => {
    usePolicyMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    });
    renderPage();
    expect(editor().value).toBe('');
    edit('first draft');
    fireEvent.click(publishBtn());
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/version 1 of PRIVACY/)).toBeInTheDocument();
  });

  it('shows a success toast with the returned version and closes the dialog', async () => {
    mutate.mockImplementation((vars, opts) =>
      opts.onSuccess({ type: vars.type, version: 4, publishedAt: '' })
    );
    renderPage();
    edit('new text');
    fireEvent.click(publishBtn());
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm publish' }));
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringContaining('4'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it("keeps the admin's work when publishing fails", async () => {
    mutate.mockImplementation((_vars, opts) => opts.onError(new Error('boom')));
    renderPage();
    edit('my long edit');
    fireEvent.click(publishBtn());
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm publish' }));
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
    expect(editor().value).toBe('my long edit');
  });

  it('asks before discarding edits when the type changes; declining keeps type and edits', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    edit('unsaved');
    const select = screen.getByLabelText('Policy type') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'TERMS' } });
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(select.value).toBe('PRIVACY');
    expect(editor().value).toBe('unsaved');

    confirmSpy.mockReturnValue(true);
    fireEvent.change(select, { target: { value: 'TERMS' } });
    expect(select.value).toBe('TERMS');
    expect(editor().value).toBe('abc');
  });

  it('sanitizes admin-authored markdown in the preview', () => {
    renderPage();
    edit('# Hi <script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('[onerror]')).toBeNull();
    expect(screen.getByRole('heading', { name: /Hi/, level: 1 })).toBeInTheDocument();
  });
});
