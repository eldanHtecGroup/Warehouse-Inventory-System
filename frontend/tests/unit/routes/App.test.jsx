import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import categoryApi from '../../../src/api/category.api.js';
import productApi from '../../../src/api/product.api.js';
import stockMovementApi from '../../../src/api/stockMovement.api.js';
import App from '../../../src/App.jsx';
import ToastProvider from '../../../src/context/ToastProvider.jsx';
import AppRouter from '../../../src/routes/AppRouter.jsx';
import { buildList, buildStockSummary } from '../../helpers/fixtures.js';

const renderAt = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </MemoryRouter>,
  );

describe('AppRouter', () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, 'getAll').mockResolvedValue([]);
    vi.spyOn(categoryApi, 'getStockSummary').mockResolvedValue(buildStockSummary());
    vi.spyOn(productApi, 'list').mockResolvedValue(buildList([]));
    vi.spyOn(stockMovementApi, 'list').mockResolvedValue(buildList([]));
  });

  it.each([
    ['/', 'Dashboard'],
    ['/products', 'Products'],
    ['/products/new', 'Add product'],
    ['/categories', 'Categories'],
    ['/history', 'Stock history'],
    ['/does-not-exist', 'Page not found'],
  ])('renders %s inside the layout', async (route, heading) => {
    renderAt(route);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('App mounts with the browser router on the dashboard', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });
});
