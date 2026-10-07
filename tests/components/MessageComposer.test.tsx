import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MessageComposer from '@/components/messaging/MessageComposer';
import type { MessageThread } from '@/types';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/hooks/useMessaging', () => ({
  useSendMessage: () => ({ mutate, isPending: false }),
}));

function type(value: string) {
  fireEvent.change(screen.getByLabelText('Message'), { target: { value } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessageComposer', () => {
  it('blocks an empty body before any mutate call', () => {
    render(<MessageComposer cohortId="c1" threadStatus="ACTIVE" />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText('Message').closest('form')!);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('blocks a 2001-char body but allows exactly 2000', () => {
    render(<MessageComposer cohortId="c1" threadStatus="ACTIVE" />);
    type('a'.repeat(2001));
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText('Message').closest('form')!);
    expect(mutate).not.toHaveBeenCalled();

    type('a'.repeat(2000));
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('renders disabled with the closed copy for CLOSED_BY_ADMIN', () => {
    render(<MessageComposer cohortId="c1" threadStatus="CLOSED_BY_ADMIN" />);
    expect(screen.getByText('This conversation has been closed.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('renders disabled with archived copy for ARCHIVED', () => {
    render(<MessageComposer cohortId="c1" threadStatus="ARCHIVED" />);
    expect(screen.getByText('This conversation is archived.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('sends the body and clears the input on success', () => {
    mutate.mockImplementation((_body, opts) => opts.onSuccess());
    render(<MessageComposer cohortId="c1" threadStatus="ACTIVE" />);
    type('hello');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(mutate).toHaveBeenCalledWith('hello', expect.any(Object));
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('keeps the text and shows an inline message on a 403 send error', () => {
    mutate.mockImplementation((_body, opts) => opts.onError({ response: { status: 403 } }));
    render(<MessageComposer cohortId="c1" threadStatus="ACTIVE" />);
    type('hello');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/no longer available/i);
    expect(screen.getByLabelText('Message')).toHaveValue('hello');
  });

  it('keeps the text and shows a retry message on another send error', () => {
    mutate.mockImplementation((_body, opts) => opts.onError({ response: { status: 500 } }));
    render(<MessageComposer cohortId="c1" threadStatus="ACTIVE" />);
    type('hello');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be sent/i);
    expect(screen.getByLabelText('Message')).toHaveValue('hello');
  });

  it.each<MessageThread['status']>(['ACTIVE', 'ARCHIVED', 'CLOSED_BY_ADMIN'])(
    'has no attachment or upload affordance at all when status is %s',
    (status) => {
      const { container } = render(<MessageComposer cohortId="c1" threadStatus={status} />);
      expect(container.querySelector('input[type="file"]')).toBeNull();
      expect(screen.queryByRole('button', { name: /attach|upload|file|image|photo/i })).toBeNull();
      expect(screen.queryByText(/attach|upload/i)).toBeNull();
      expect(screen.queryByLabelText(/attach|upload/i)).toBeNull();
    }
  );
});
