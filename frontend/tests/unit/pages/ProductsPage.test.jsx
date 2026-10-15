import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import categoryApi from '../../../src/api/category.api.js';
import productApi from '../../../src/api/product.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import ProductsPage from '../../../src/pages/ProductsPage.jsx';
import { currentLocation, renderWithProviders } from '../../helpers/render.jsx';
import { buildCategory, buildList, buildProduct } from '../../helpers/fixtures.js';

const lastListQuery = () => productApi.list.mock.calls.at(-1)[0];

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, 'getAll').mockResolvedValue([buildCategory(), buildCategory({ id: 2, name: 'Snacks' })]);
    vi.spyOn(productApi, 'list').mockResolvedValue(
      buildList([buildProduct(), buildProduct({ id: 2, name: 'Orange Juice', code: 'BEV-002' })]),
    );
  });

  it('loads products with the default sorting and paging', async () => {
    renderWithProviders(<ProductsPage />, { route: '/products' });

    expect(await screen.findByRole('link', { name: 'Orange Juice' })).toBeInTheDocument();
    expect(lastListQuery()).toEqual({ sortBy: 'name', order: 'asc', page: '1', limit: '20' });
  });

  it('keeps filters and sorting in the URL and resets to page 1', async () => {
    const { user } = renderWithProviders(<ProductsPage />, { route: '/products?page=3' });
    await screen.findByRole('link', { name: 'Orange Juice' });

    await user.selectOptions(screen.getByLabelText('Category'), 'Snacks');
    await waitFor(() => expect(currentLocation()).toBe('/products?categoryId=2'));
    expect(lastListQuery()).toMatchObject({ categoryId: '2', page: '1' });

    await user.click(screen.getByRole('button', { name: /Price/ }));
    await waitFor(() => expect(currentLocation()).toBe('/products?categoryId=2&sortBy=price'));

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    await waitFor(() => expect(currentLocation()).toBe('/products?sortBy=price'));
  });

  it('changes page and page size', async () => {
    productApi.list.mockResolvedValue(buildList([buildProduct()], { total: 45, totalPages: 3 }));
    const { user } = renderWithProviders(<ProductsPage />, { route: '/products' });
    await screen.findByText('Page 1 of 3');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(currentLocation()).toBe('/products?page=2'));

    await user.selectOptions(screen.getByLabelText('Per page'), '50');
    await waitFor(() => expect(currentLocation()).toBe('/products?limit=50'));
  });

  it('adjusts stock from the list and reloads it', async () => {
    vi.spyOn(productApi, 'increaseStock').mockResolvedValue({ product: buildProduct({ quantity: 121 }), movement: {} });
    const { user } = renderWithProviders(<ProductsPage />, { route: '/products' });
    await screen.findByRole('link', { name: 'Orange Juice' });

    await user.click(screen.getAllByRole('button', { name: 'Adjust stock' })[0]);
    const dialog = screen.getByRole('dialog', { name: /Adjust stock/ });
    await user.click(within(dialog).getByRole('button', { name: 'Increase stock' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(productApi.increaseStock).toHaveBeenCalledWith(1, { quantity: 1, reason: undefined });
    expect(productApi.list).toHaveBeenCalledTimes(2);
  });

  it('deletes a product after confirmation', async () => {
    vi.spyOn(productApi, 'remove').mockResolvedValue(null);
    const { user } = renderWithProviders(<ProductsPage />, { route: '/products' });
    await screen.findByRole('link', { name: 'Orange Juice' });

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    const dialog = screen.getByRole('dialog', { name: 'Delete product?' });
    expect(dialog).toHaveTextContent('"Orange Juice" will be removed');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(productApi.remove).toHaveBeenCalledWith(2);
    expect(await screen.findByRole('status')).toHaveTextContent('"Orange Juice" was deleted.');
    await waitFor(() => expect(productApi.list).toHaveBeenCalledTimes(2));
  });

  it('goes back a page when the last product on a page is deleted', async () => {
    productApi.list.mockResolvedValue(buildList([buildProduct()], { page: 2, total: 21, totalPages: 2 }));
    vi.spyOn(productApi, 'remove').mockResolvedValue(null);
    const { user } = renderWithProviders(<ProductsPage />, { route: '/products?page=2' });
    await screen.findByText('Page 2 of 2');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(currentLocation()).toBe('/products'));
  });

  it('shows a toast when deleting fails', async () => {
    vi.spyOn(productApi, 'remove').mockRejectedValue(new ApiError('Server error', 500));
    const { user } = renderWithProviders(<ProductsPage />, { route: '/products' });
    await screen.findByRole('link', { name: 'Orange Juice' });

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('shows empty states for no products and no matches', async () => {
    productApi.list.mockResolvedValue(buildList([]));
    const { unmount } = renderWithProviders(<ProductsPage />, { route: '/products' });
    expect(await screen.findByText('No products yet')).toBeInTheDocument();
    unmount();

    const { user } = renderWithProviders(<ProductsPage />, { route: '/products?search=zzz' });
    expect(await screen.findByText('No products match your filters')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Reset filters' })[1]);
    await waitFor(() => expect(currentLocation()).toBe('/products'));
  });

  it('shows API errors such as invalid filter ranges', async () => {
    productApi.list.mockRejectedValue(
      new ApiError('Validation failed', 400, [{ field: 'query.minPrice', message: 'minPrice must be less than or equal to maxPrice' }]),
    );
    renderWithProviders(<ProductsPage />, { route: '/products?minPrice=5&maxPrice=1' });

    expect(await screen.findByText('minPrice must be less than or equal to maxPrice')).toBeInTheDocument();
  });
});
