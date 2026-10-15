import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import categoryApi from '../../../src/api/category.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import CategoriesPage from '../../../src/pages/CategoriesPage.jsx';
import { renderWithProviders } from '../../helpers/render.jsx';
import { buildCategory, buildStockSummary } from '../../helpers/fixtures.js';

const frozen = buildCategory({ id: 3, name: 'Frozen', description: null, productCount: 0 });

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, 'getAll').mockResolvedValue([buildCategory(), frozen]);
    vi.spyOn(categoryApi, 'getStockSummary').mockResolvedValue(buildStockSummary());
  });

  it('merges categories with their stock totals', async () => {
    renderWithProviders(<CategoriesPage />);

    const row = (await screen.findByRole('link', { name: 'Beverages' })).closest('tr');
    expect(within(row).getByText('150')).toBeInTheDocument();
    expect(within(row).getByText('$300.50')).toBeInTheDocument();
    // Categories missing from the summary fall back to zero
    expect(within(screen.getByRole('link', { name: 'Frozen' }).closest('tr')).getByText('$0.00')).toBeInTheDocument();
  });

  it('creates a category', async () => {
    vi.spyOn(categoryApi, 'create').mockResolvedValue(buildCategory({ id: 4, name: 'Dairy' }));
    const { user } = renderWithProviders(<CategoriesPage />);
    await screen.findByRole('link', { name: 'Beverages' });

    await user.click(screen.getByRole('button', { name: '+ Add category' }));
    const dialog = screen.getByRole('dialog', { name: 'Add category' });
    await user.type(within(dialog).getByLabelText('Name'), 'Dairy');
    await user.click(within(dialog).getByRole('button', { name: 'Create category' }));

    expect(categoryApi.create).toHaveBeenCalledWith({ name: 'Dairy', description: null });
    expect(await screen.findByRole('status')).toHaveTextContent('Category "Dairy" was created.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(categoryApi.getAll).toHaveBeenCalledTimes(2);
  });

  it('edits a category', async () => {
    vi.spyOn(categoryApi, 'update').mockResolvedValue(buildCategory({ name: 'Drinks' }));
    const { user } = renderWithProviders(<CategoriesPage />);
    const row = (await screen.findByRole('link', { name: 'Beverages' })).closest('tr');

    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit category: Beverages' });
    await user.clear(within(dialog).getByLabelText('Name'));
    await user.type(within(dialog).getByLabelText('Name'), 'Drinks');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(categoryApi.update).toHaveBeenCalledWith(1, { name: 'Drinks', description: 'Soft drinks and juices' });
    expect(await screen.findByRole('status')).toHaveTextContent('Category "Drinks" was updated.');
  });

  it('closes the form on cancel', async () => {
    const { user } = renderWithProviders(<CategoriesPage />);
    await screen.findByRole('link', { name: 'Beverages' });

    await user.click(screen.getByRole('button', { name: '+ Add category' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes an empty category', async () => {
    vi.spyOn(categoryApi, 'remove').mockResolvedValue(null);
    const { user } = renderWithProviders(<CategoriesPage />);
    const row = (await screen.findByRole('link', { name: 'Frozen' })).closest('tr');

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(categoryApi.remove).toHaveBeenCalledWith(3);
    expect(await screen.findByRole('status')).toHaveTextContent('Category "Frozen" was deleted.');
  });

  it('shows the backend reason when deleting fails', async () => {
    vi.spyOn(categoryApi, 'remove').mockRejectedValue(new ApiError('Category "Frozen" still has 1 product(s)', 409));
    const { user } = renderWithProviders(<CategoriesPage />);
    const row = (await screen.findByRole('link', { name: 'Frozen' })).closest('tr');

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('still has 1 product(s)');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows an empty state that opens the form', async () => {
    categoryApi.getAll.mockResolvedValue([]);
    const { user } = renderWithProviders(<CategoriesPage />);

    await user.click(await screen.findByRole('button', { name: 'Create your first category' }));
    expect(screen.getByRole('dialog', { name: 'Add category' })).toBeInTheDocument();
  });

  it('shows load errors', async () => {
    categoryApi.getStockSummary.mockRejectedValue(new ApiError('Server error', 500));
    renderWithProviders(<CategoriesPage />);
    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });
});
