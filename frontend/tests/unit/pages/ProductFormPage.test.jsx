import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import categoryApi from '../../../src/api/category.api.js';
import productApi from '../../../src/api/product.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import ProductFormPage from '../../../src/pages/ProductFormPage.jsx';
import { currentLocation, renderWithProviders } from '../../helpers/render.jsx';
import { buildCategory, buildProduct } from '../../helpers/fixtures.js';

const renderNew = () => renderWithProviders(<ProductFormPage />, { route: '/products/new', path: '/products/new' });
const renderEdit = () =>
  renderWithProviders(<ProductFormPage />, { route: '/products/1/edit', path: '/products/:id/edit' });

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, 'getAll').mockResolvedValue([buildCategory()]);
  });

  it('creates a product and opens it', async () => {
    vi.spyOn(productApi, 'create').mockResolvedValue(buildProduct({ id: 7, name: 'Lemonade' }));
    const { user } = renderNew();

    expect(screen.getByRole('heading', { name: 'Add product' })).toBeInTheDocument();
    await user.type(await screen.findByLabelText('Name'), 'Lemonade');
    await user.type(screen.getByLabelText(/Code/), 'BEV-100');
    await user.selectOptions(screen.getByLabelText('Category'), 'Beverages');
    await user.type(screen.getByLabelText('Price'), '1.5');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => expect(currentLocation()).toBe('/products/7'));
    expect(productApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lemonade', quantity: 0 }));
    expect(screen.getByRole('status')).toHaveTextContent('"Lemonade" was created.');
  });

  it('cancel on a new product returns to the list', async () => {
    const { user } = renderNew();
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(currentLocation()).toBe('/products');
  });

  it('edits an existing product', async () => {
    vi.spyOn(productApi, 'getById').mockResolvedValue(buildProduct());
    vi.spyOn(productApi, 'update').mockResolvedValue(buildProduct({ name: 'Still Water' }));
    const { user } = renderEdit();

    const name = await screen.findByLabelText('Name');
    expect(name).toHaveValue('Sparkling Water 1.5L');
    await user.clear(name);
    await user.type(name, 'Still Water');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(currentLocation()).toBe('/products/1'));
    expect(productApi.update).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Still Water' }));
  });

  it('cancel while editing returns to the product', async () => {
    vi.spyOn(productApi, 'getById').mockResolvedValue(buildProduct());
    const { user } = renderEdit();
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(currentLocation()).toBe('/products/1');
  });

  it('shows load errors with retry', async () => {
    vi.spyOn(productApi, 'getById').mockRejectedValueOnce(new ApiError('Server error', 500)).mockResolvedValue(buildProduct());
    const { user } = renderEdit();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Name')).toHaveValue('Sparkling Water 1.5L');
  });

  it('retries loading categories when they fail', async () => {
    categoryApi.getAll.mockRejectedValueOnce(new ApiError('Categories down', 500));
    const { user } = renderNew();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
  });
});
