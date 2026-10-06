import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CountdownTimer from '@/components/common/CountdownTimer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('CountdownTimer', () => {
  it('shows the remaining time', () => {
    render(<CountdownTimer targetIso="2026-01-01T00:01:05Z" />);
    expect(screen.getByRole('timer')).toHaveTextContent('00:01:05');
  });

  it('shows days when more than 24h remain', () => {
    render(<CountdownTimer targetIso="2026-01-03T03:14:09Z" />);
    expect(screen.getByRole('timer')).toHaveTextContent('2d 03:14:09');
  });

  it('calls onExpire exactly once', () => {
    const onExpire = vi.fn();
    render(<CountdownTimer targetIso="2026-01-01T00:00:03Z" onExpire={onExpire} />);
    expect(onExpire).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('timer')).toHaveTextContent('00:00:00');
  });

  it('calls onExpire once if the target is already past', () => {
    const onExpire = vi.fn();
    render(<CountdownTimer targetIso="2025-12-31T00:00:00Z" onExpire={onExpire} />);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('timer')).toHaveTextContent('00:00:00');
  });

  it('shows placeholders for an invalid date and never fires', () => {
    const onExpire = vi.fn();
    render(<CountdownTimer targetIso="not-a-date" onExpire={onExpire} />);
    expect(screen.getByRole('timer')).toHaveTextContent('--:--:--');
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('turns danger in the last minute only', () => {
    const { rerender } = render(<CountdownTimer targetIso="2026-01-01T00:02:00Z" />);
    expect(screen.getByRole('timer')).toHaveClass('text-ink');
    rerender(<CountdownTimer targetIso="2026-01-01T00:00:30Z" />);
    expect(screen.getByRole('timer')).toHaveClass('text-danger');
  });
});
