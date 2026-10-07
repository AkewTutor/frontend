import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import TutorRecommendationCard from '@/components/matching/TutorRecommendationCard';

const recommendation = {
  tutorId: 't1',
  name: 'Selam Tesfaye',
  profilePictureUrl: null,
  matchPercentage: 92,
};

function renderCard(props: Partial<React.ComponentProps<typeof TutorRecommendationCard>> = {}) {
  const onSelect = vi.fn();
  render(
    <MemoryRouter>
      <TutorRecommendationCard recommendation={recommendation} onSelect={onSelect} {...props} />
    </MemoryRouter>
  );
  return { onSelect };
}

describe('TutorRecommendationCard', () => {
  it('shows the name and match percentage and links to the tutor profile', () => {
    renderCard();
    expect(screen.getByText('Selam Tesfaye')).toBeInTheDocument();
    expect(screen.getByText('92% match')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute(
      'href',
      '/student/tutors/t1'
    );
  });

  it('calls onSelect with the tutor id', () => {
    const { onSelect } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('t1');
  });

  it('disables Select while a selection is in flight', () => {
    renderCard({ isSelecting: true });
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
  });
});
