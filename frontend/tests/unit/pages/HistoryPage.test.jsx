import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import stockMovementApi from '../../../src/api/stockMovement.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import HistoryPage from '../../../src/pages/HistoryPage.jsx';
import { currentLocation, renderWithProviders } from '../../helpers/render.jsx';
import { buildList, buildMovement } from '../../helpers/fixtures.js';

const lastQuery = () => stockMovementApi.list.mock.calls.at(-1)[0];

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.spyOn(stockMovementApi, 'list').mockResolvedValue(buildList([buildMovement()], { total: 30, totalPages: 2 }));
  });

  it('lists movements newest first by default', async () => {
    renderWithProviders(<HistoryPage />, { route: '/history' });

    expect(await screen.findByText('Supplier delivery')).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ order: 'desc', page: '1', limit: '20', from: undefined, to: undefined });
  });

  it('converts date filters to full-day timestamps', async () => {
    renderWithProviders(<HistoryPage />, { route: '/history?from=2026-10-01&to=2026-10-02' });
    await screen.findByText('Supplier delivery');

    const { from, to } = lastQuery();
    expect(new Date(from).getHours()).toBe(0);
    expect(new Date(to).getHours()).toBe(23);
  });

  it('applies filters through the URL and resets them', async () => {
    const { user } = renderWithProviders(<HistoryPage />, { route: '/history?page=2' });
    await screen.findByText('Supplier delivery');

    await user.selectOptions(screen.getByLabelText('Type'), 'DECREASE');
    await waitFor(() => expect(currentLocation()).toBe('/history?type=DECREASE'));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(currentLocation()).toBe('/history?type=DECREASE&from=2026-10-01'));

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    await waitFor(() => expect(currentLocation()).toBe('/history'));
  });

  it('paginates', async () => {
    const { user } = renderWithProviders(<HistoryPage />, { route: '/history' });
    await screen.findByText('Supplier delivery');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(currentLocation()).toBe('/history?page=2'));

    await user.selectOptions(screen.getByLabelText('Per page'), '50');
    await waitFor(() => expect(currentLocation()).toBe('/history?limit=50'));
  });

  it('shows and clears the product filter using the snapshot name', async () => {
    const { user } = renderWithProviders(<HistoryPage />, { route: '/history?productId=1' });

    expect(await screen.findByText('Sparkling Water 1.5L (BEV-001)', { selector: 'strong' })).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ productId: '1' });

    await user.click(screen.getByRole('button', { name: 'Show all products' }));
    await waitFor(() => expect(currentLocation()).toBe('/history'));
  });

  it('falls back to the product id when there are no movements', async () => {
    stockMovementApi.list.mockResolvedValue(buildList([]));
    renderWithProviders(<HistoryPage />, { route: '/history?productId=9' });

    expect(await screen.findByText('No stock changes match your filters')).toBeInTheDocument();
    expect(screen.getByText('product #9')).toBeInTheDocument();
  });

  it('shows errors', async () => {
    stockMovementApi.list.mockRejectedValue(new ApiError('Server error', 500));
    renderWithProviders(<HistoryPage />, { route: '/history' });
    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });
});
