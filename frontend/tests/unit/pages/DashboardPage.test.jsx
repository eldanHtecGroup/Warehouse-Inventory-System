import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import categoryApi from '../../../src/api/category.api.js';
import productApi from '../../../src/api/product.api.js';
import stockMovementApi from '../../../src/api/stockMovement.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import DashboardPage from '../../../src/pages/DashboardPage.jsx';
import { renderWithProviders } from '../../helpers/render.jsx';
import { buildList, buildMovement, buildProduct, buildStockSummary } from '../../helpers/fixtures.js';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, 'getStockSummary').mockResolvedValue(buildStockSummary());
    vi.spyOn(productApi, 'list').mockResolvedValue(buildList([buildProduct({ name: 'Green Tea', quantity: 0 })]));
    vi.spyOn(stockMovementApi, 'list').mockResolvedValue(buildList([buildMovement()]));
  });

  it('shows totals, stock per category, low stock and recent changes', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('$400.50', { selector: '.stat-card__value' })).toBeInTheDocument();
    expect(screen.getByText('200', { selector: '.stat-card__value' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Snacks' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Green Tea' })).toHaveAttribute('href', '/products/1');
    expect(screen.getByText('Supplier delivery')).toBeInTheDocument();
    expect(screen.getByText('1', { selector: '.stat-card__value' }).closest('.stat-card')).toHaveClass('stat-card--warning');

    expect(productApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ maxQuantity: 10, sortBy: 'quantity' }),
      expect.anything(),
    );
  });

  it('shows empty states', async () => {
    categoryApi.getStockSummary.mockResolvedValue({ categories: [], totals: { productCount: 0, totalQuantity: 0, totalValue: 0 } });
    productApi.list.mockResolvedValue(buildList([]));
    stockMovementApi.list.mockResolvedValue(buildList([]));

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('No categories yet')).toBeInTheDocument();
    expect(await screen.findByText('All products are well stocked')).toBeInTheDocument();
    expect(await screen.findByText('No stock changes yet')).toBeInTheDocument();
  });

  it('shows errors per section with retry', async () => {
    categoryApi.getStockSummary.mockRejectedValueOnce(new ApiError('Summary down', 500));
    productApi.list.mockRejectedValueOnce(new ApiError('Products down', 500));
    stockMovementApi.list.mockRejectedValueOnce(new ApiError('History down', 500));

    const { user } = renderWithProviders(<DashboardPage />);

    const alert = await screen.findByText('Summary down');
    expect(await screen.findByText('Products down')).toBeInTheDocument();
    expect(await screen.findByText('History down')).toBeInTheDocument();

    await user.click(within(alert.closest('[role="alert"]')).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('$400.50', { selector: '.stat-card__value' })).toBeInTheDocument();
  });
});
