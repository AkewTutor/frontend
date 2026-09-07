import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserCard from '@/components/common/UserCard';

describe('UserCard', () => {
  it('renders user name and email', () => {
    render(<UserCard name="John" email="john@example.com" />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
