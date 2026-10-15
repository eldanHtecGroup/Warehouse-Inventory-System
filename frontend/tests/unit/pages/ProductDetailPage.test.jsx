import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import productApi from '../../../src/api/product.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import ProductDetailPage from '../../../src/pages/ProductDetailPage.jsx';
import { currentLocation, renderWithProviders } from '../../helpers/render.jsx';
import { buildList, buildMovement, buildProduct } from '../../helpers/fixtures.js';

const renderPage = () => renderWithProviders(<ProductDetailPage />, { route: '/products/1', path: '/products/:id' });

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.spyOn(productApi, 'getById').mockResolvedValue(buildProduct({ quantity: 5 }));
    vi.spyOn(productApi, 'getStockMovements').mockResolvedValue(buildList([buildMovement()], { total: 12, totalPages: 2, limit: 10 }));
  });

  it('shows details, the adjust form and paginated history', async () => {
    const { user } = renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Sparkling Water 1.5L' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Adjust stock' })).toBeInTheDocument();
    expect(await screen.findByText('Supplier delivery')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/products/1/edit');
    expect(productApi.getStockMovements).toHaveBeenCalledWith('1', { page: 1, limit: 10 }, expect.anything());

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(productApi.getStockMovements).toHaveBeenLastCalledWith('1', { page: 2, limit: 10 }, expect.anything()),
    );
  });

  it('reloads the product and history after a stock adjustment', async () => {
    vi.spyOn(productApi, 'increaseStock').mockResolvedValue({ product: buildProduct({ quantity: 6 }), movement: {} });
    const { user } = renderPage();
    await screen.findByText('Supplier delivery');

    // From page 2 the history jumps back to the newest entries
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Increase stock' }));

    await waitFor(() => expect(productApi.getById).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(productApi.getStockMovements).toHaveBeenLastCalledWith('1', { page: 1, limit: 10 }, expect.anything()),
    );
  });

  it('refetches history in place when already on the first page', async () => {
    vi.spyOn(productApi, 'increaseStock').mockResolvedValue({ product: buildProduct({ quantity: 6 }), movement: {} });
    const { user } = renderPage();
    await screen.findByText('Supplier delivery');

    await user.click(screen.getByRole('button', { name: 'Increase stock' }));
    await waitFor(() => expect(productApi.getStockMovements).toHaveBeenCalledTimes(2));
  });

  it('deletes the product and returns to the list', async () => {
    vi.spyOn(productApi, 'remove').mockResolvedValue(null);
    const { user } = renderPage();
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(currentLocation()).toBe('/products'));
    expect(productApi.remove).toHaveBeenCalledWith('1');
  });

  it('keeps the page and shows a toast when deleting fails', async () => {
    vi.spyOn(productApi, 'remove').mockRejectedValue(new ApiError('Server error', 500));
    const { user } = renderPage();
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(currentLocation()).toBe('/products/1');
  });

  it('shows a not-found state that links to the history of deleted products', async () => {
    productApi.getById.mockRejectedValue(new ApiError('Product with id 1 not found', 404));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View its stock history' })).toHaveAttribute('href', '/history?productId=1');
  });

  it('shows other errors with retry', async () => {
    productApi.getById.mockRejectedValueOnce(new ApiError('Server error', 500));
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sparkling Water 1.5L' })).toBeInTheDocument();
  });

  it('shows history errors and an empty history', async () => {
    productApi.getStockMovements.mockRejectedValueOnce(new ApiError('History down', 500)).mockResolvedValue(buildList([]));
    const { user } = renderPage();

    const alert = (await screen.findByText('History down')).closest('[role="alert"]');
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No stock changes recorded yet')).toBeInTheDocument();
  });
});
