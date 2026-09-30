import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

function FocusTrapFixture({ onEscape }: { onEscape?: () => void }) {
  const trapRef = useFocusTrap<HTMLDivElement>(true, { onEscape });

  return (
    <div ref={trapRef} role="group" aria-label="Focus trap">
      <button type="button">First</button>
      <button type="button">Last</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('should return a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current.current).toBeNull();
  });

  it('should store previous active element when trap is activated', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(<FocusTrapFixture />);
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('should call onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();
    render(<FocusTrapFixture onEscape={onEscape} />);

    fireEvent.keyDown(screen.getByRole('group', { name: 'Focus trap' }), { key: 'Escape' });

    expect(onEscape).toHaveBeenCalled();
  });

  it('should focus first element when activated', () => {
    render(<FocusTrapFixture />);

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('should trap Tab navigation within container', () => {
    render(<FocusTrapFixture />);

    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();

    // Tab from last element should focus first
    fireEvent.keyDown(last, { key: 'Tab' });

    expect(first).toHaveFocus();
  });
});
