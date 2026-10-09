import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SupportContactPage from '@/pages/SupportContactPage';
import { useSupportContact } from '@/hooks/useComplaints';

vi.mock('@/hooks/useComplaints');

const contact = {
  phone: '+251911000000',
  telegramHandle: '@akewtutor_support',
  hours: 'Mon-Fri, 9:00-17:00 EAT',
};

const mockHook = (state: { data?: typeof contact; isLoading?: boolean; error?: Error | null }) =>
  vi.mocked(useSupportContact).mockReturnValue({
    data: state.data,
    isLoading: state.isLoading ?? false,
    error: state.error ?? null,
  } as never);

const renderPage = () => render(createElement(SupportContactPage));

describe('SupportContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders static content, no submit action anywhere on the page', () => {
    mockHook({ data: contact });
    const { container } = renderPage();

    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('input[type="submit"]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('phone/telegramHandle/hours render from useSupportContact()', () => {
    mockHook({ data: contact });
    renderPage();

    expect(screen.getByText(contact.phone)).toBeInTheDocument();
    expect(screen.getByText(contact.telegramHandle)).toBeInTheDocument();
    expect(screen.getByText(contact.hours)).toBeInTheDocument();
  });

  it('links the phone and the Telegram handle', () => {
    mockHook({ data: contact });
    renderPage();

    expect(screen.getByRole('link', { name: contact.phone })).toHaveAttribute(
      'href',
      'tel:+251911000000'
    );
    expect(screen.getByRole('link', { name: contact.telegramHandle })).toHaveAttribute(
      'href',
      'https://t.me/akewtutor_support'
    );
  });

  it('shows a loading state', () => {
    mockHook({ isLoading: true });
    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(contact.phone)).toBeNull();
  });

  it('shows a fallback error when the contact details cannot load', () => {
    mockHook({ error: new Error('boom') });
    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
