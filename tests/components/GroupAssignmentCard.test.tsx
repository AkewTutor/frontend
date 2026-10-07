import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GroupAssignmentCard from '@/components/matching/GroupAssignmentCard';
import type { CohortMember } from '@/types';

const member: CohortMember = {
  id: 'u1',
  role: 'TUTOR',
  displayName: 'Selam Tesfaye',
  profilePictureUrl: 'https://example.com/selam.jpg',
};

describe('GroupAssignmentCard', () => {
  it('renders only the display name and the photo', () => {
    const { container } = render(<GroupAssignmentCard member={member} />);
    expect(container.textContent).toBe('Selam Tesfaye');
    expect(container.querySelector('img')?.getAttribute('src')).toBe(member.profilePictureUrl);
    expect(screen.queryByText('TUTOR')).toBeNull();
    expect(container.textContent).not.toContain('u1');
  });

  it('never renders extra fields even if the object carries them (visibility floor)', () => {
    const drifted = {
      ...member,
      qualifications: 'PhD Mathematics',
      email: 'selam@example.com',
      phone: '+251911000000',
    } as unknown as CohortMember;

    const { container } = render(<GroupAssignmentCard member={drifted} />);

    expect(container.textContent).not.toContain('PhD Mathematics');
    expect(container.textContent).not.toContain('selam@example.com');
    expect(container.textContent).not.toContain('+251911000000');
    expect(container.innerHTML).not.toContain('PhD Mathematics');
    expect(container.innerHTML).not.toContain('selam@example.com');
  });

  it('renders an initials fallback, not a broken image, when there is no photo', () => {
    const { container } = render(
      <GroupAssignmentCard member={{ ...member, profilePictureUrl: null }} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('ST');
    expect(screen.getByText('Selam Tesfaye')).toBeInTheDocument();
  });
});
