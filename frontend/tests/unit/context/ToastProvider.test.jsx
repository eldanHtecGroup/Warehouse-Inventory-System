import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ToastProvider from '../../../src/context/ToastProvider.jsx';
import useToast from '../../../src/hooks/useToast.js';

const Trigger = ({ type, message }) => {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ type, message })}>
      Notify
    </button>
  );
};

describe('ToastProvider / useToast', () => {
  afterEach(() => vi.useRealTimers());

  it('shows success toasts as status and errors as alerts', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    rerender(
      <ToastProvider>
        <Trigger type="error" message="Failed" />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('can be dismissed manually', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Notify' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('dismisses toasts automatically', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    act(() => screen.getByRole('button', { name: 'Notify' }).click());
    expect(screen.getByText('Saved')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('useToast throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });
});
