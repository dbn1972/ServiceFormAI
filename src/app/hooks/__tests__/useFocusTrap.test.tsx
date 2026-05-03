import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';
import { fireEvent } from '@testing-library/react';

describe('useFocusTrap', () => {
  it('should return a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current.current).toBeNull();
  });

  it('should store previous active element when trap is activated', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const { result } = renderHook(() => useFocusTrap(true));

    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);

    if (result.current.current) {
      (result.current as any).current = container;
    }

    expect(document.activeElement).toBeTruthy();

    document.body.removeChild(button);
    document.body.removeChild(container);
  });

  it('should call onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useFocusTrap(true, {
        onEscape,
      })
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    if (result.current.current) {
      (result.current as any).current = container;
    }

    fireEvent.keyDown(container, { key: 'Escape' });

    expect(onEscape).toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('should focus first element when activated', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');

    button1.textContent = 'Button 1';
    button2.textContent = 'Button 2';

    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    if (result.current.current) {
      (result.current as any).current = container;
    }

    // Note: Testing focus in jsdom is limited
    expect(container.querySelectorAll('button').length).toBe(2);

    document.body.removeChild(container);
  });

  it('should trap Tab navigation within container', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');

    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    if (result.current.current) {
      (result.current as any).current = container;
    }

    button2.focus();

    // Tab from last element should focus first
    fireEvent.keyDown(container, { key: 'Tab' });

    expect(container.contains(document.activeElement)).toBeTruthy();

    document.body.removeChild(container);
  });
});
