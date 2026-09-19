/**
 * @vitest-environment happy-dom
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });
    
    // Value shouldn't update immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    // Still shouldn't update
    expect(result.current).toBe('initial');

    // Fast-forward rest of the time
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Now it should be updated
    expect(result.current).toBe('updated');
  });
});
