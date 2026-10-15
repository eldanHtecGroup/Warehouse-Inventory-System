import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useFetch from '../../../src/hooks/useFetch.js';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useFetch', () => {
  it('starts loading, then exposes the data', async () => {
    const request = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useFetch(request));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ data: 'result', error: null });
    expect(request).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  it('exposes errors', async () => {
    const error = new Error('Boom');
    const request = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useFetch(request));

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.isLoading).toBe(false);
  });

  it('refetch runs the request again and keeps the previous data while loading', async () => {
    const second = deferred();
    const request = vi.fn().mockResolvedValueOnce('first').mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useFetch(request));
    await waitFor(() => expect(result.current.data).toBe('first'));

    act(() => result.current.refetch());

    expect(result.current).toMatchObject({ isLoading: true, data: 'first' });
    await act(async () => second.resolve('second'));
    expect(result.current).toMatchObject({ isLoading: false, data: 'second' });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('refetches when the request function changes and aborts the stale request', async () => {
    const slow = deferred();
    const signals = [];
    const first = vi.fn(({ signal }) => {
      signals.push(signal);
      return slow.promise;
    });
    const second = vi.fn().mockResolvedValue('second');

    const { result, rerender } = renderHook(({ fn }) => useFetch(fn), { initialProps: { fn: first } });
    rerender({ fn: second });

    expect(signals[0].aborted).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('second'));

    // A late rejection of the aborted request must not overwrite the newer result
    await act(async () => slow.reject(new DOMException('Aborted', 'AbortError')));
    expect(result.current).toMatchObject({ data: 'second', error: null });
  });

  it('aborts the request on unmount', () => {
    let signal;
    const { unmount } = renderHook(() =>
      useFetch((options) => {
        signal = options.signal;
        return new Promise(() => {});
      }),
    );
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
