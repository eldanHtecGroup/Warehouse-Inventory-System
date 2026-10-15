import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ErrorBoundary from '../../../src/components/common/ErrorBoundary.jsx';
import MainLayout from '../../../src/layouts/MainLayout.jsx';

let shouldThrow;
const Bomb = () => {
  if (shouldThrow) throw new Error('render failed');
  return <p>Recovered</p>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React reports caught errors to console.error by default
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when nothing fails', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('shows a fallback instead of a blank page and can retry', async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/');

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('clears the error when the reset key changes', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKey="/b">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});

describe('MainLayout error boundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('keeps the navbar usable when a page crashes and recovers on navigation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<h1>Home</h1>} />
            <Route path="/products" element={<Bomb />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
