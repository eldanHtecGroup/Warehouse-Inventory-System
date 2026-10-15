import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../src/api/httpClient.js';
import CategoryForm from '../../../src/components/category/CategoryForm.jsx';
import CategoryStockTable from '../../../src/components/category/CategoryStockTable.jsx';
import CategoryTable from '../../../src/components/category/CategoryTable.jsx';
import Navbar from '../../../src/components/Navbar.jsx';
import MovementFilters from '../../../src/components/stockMovement/MovementFilters.jsx';
import MovementTable from '../../../src/components/stockMovement/MovementTable.jsx';
import MovementTypeBadge from '../../../src/components/stockMovement/MovementTypeBadge.jsx';
import { renderWithProviders } from '../../helpers/render.jsx';
import { buildCategory, buildMovement, buildStockSummary } from '../../helpers/fixtures.js';

describe('CategoryForm', () => {
  it('validates the name and description', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create category' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x'.repeat(101) } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'x'.repeat(501) } });
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    expect(screen.getByText(/at most 100/)).toBeInTheDocument();
    expect(screen.getByText(/at most 500/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const { user } = renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Name'), ' Frozen ');
    await user.click(screen.getByRole('button', { name: 'Create category' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Frozen', description: null });
  });

  it('pre-fills when editing and shows backend errors', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Category "Snacks" already exists', 409))
      .mockRejectedValueOnce(new ApiError('Validation failed', 400, [{ field: 'body.name', message: 'Bad name' }]));
    const onCancel = vi.fn();
    const { user } = renderWithProviders(<CategoryForm category={buildCategory()} onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByLabelText('Name')).toHaveValue('Beverages');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Bad name')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('CategoryTable', () => {
  it('shows stock totals and only allows deleting empty categories', async () => {
    const full = { ...buildCategory(), totalQuantity: 150, totalValue: 300.5 };
    const empty = { ...buildCategory({ id: 2, name: 'Frozen', description: null, productCount: 0 }), totalQuantity: 0, totalValue: 0 };
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { user } = renderWithProviders(<CategoryTable categories={[full, empty]} onEdit={onEdit} onDelete={onDelete} />);

    const [, fullRow, emptyRow] = screen.getAllByRole('row');
    expect(within(fullRow).getByText('$300.50')).toBeInTheDocument();
    expect(within(fullRow).getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(within(fullRow).getByRole('link', { name: 'Beverages' })).toHaveAttribute('href', '/products?categoryId=1');

    await user.click(within(fullRow).getByRole('button', { name: 'Edit' }));
    await user.click(within(emptyRow).getByRole('button', { name: 'Delete' }));
    expect(onEdit).toHaveBeenCalledWith(full);
    expect(onDelete).toHaveBeenCalledWith(empty);
  });
});

describe('CategoryStockTable', () => {
  it('shows totals and each category share of units', () => {
    renderWithProviders(<CategoryStockTable summary={buildStockSummary()} />);
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    const footer = screen.getAllByRole('row').at(-1);
    expect(footer).toHaveTextContent('200');
    expect(footer).toHaveTextContent('$400.50');
  });

  it('handles an inventory with no units', () => {
    const summary = {
      categories: [{ categoryId: 1, categoryName: 'Empty', productCount: 0, totalQuantity: 0, totalValue: 0 }],
      totals: { productCount: 0, totalQuantity: 0, totalValue: 0 },
    };
    renderWithProviders(<CategoryStockTable summary={summary} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});

describe('MovementTypeBadge / MovementTable', () => {
  it('labels movement types and falls back to the raw value', () => {
    renderWithProviders(
      <>
        <MovementTypeBadge type="REMOVED" />
        <MovementTypeBadge type="UNKNOWN" />
      </>,
    );
    expect(screen.getByText('Product removed')).toHaveClass('badge--danger');
    expect(screen.getByText('UNKNOWN')).toHaveClass('badge--info');
  });

  it('shows signed changes, before/after and links to the product history', () => {
    const movements = [
      buildMovement(),
      buildMovement({ id: 2, type: 'DECREASE', quantityChange: -4, quantityBefore: 120, quantityAfter: 116, reason: null }),
      buildMovement({ id: 3, type: 'INITIAL', quantityChange: 0, quantityBefore: 0, quantityAfter: 0 }),
    ];
    renderWithProviders(<MovementTable movements={movements} />);

    expect(screen.getByText('+10')).toHaveClass('quantity-change--up');
    expect(screen.getByText('-4')).toHaveClass('quantity-change--down');
    expect(screen.getByText('0', { selector: '.quantity-change' })).not.toHaveClass('quantity-change--up');
    expect(screen.getByText('120 → 116')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Sparkling Water 1.5L' })[0]).toHaveAttribute('href', '/history?productId=1');
  });

  it('can hide the product column', () => {
    renderWithProviders(<MovementTable movements={[buildMovement()]} showProduct={false} />);
    expect(screen.queryByRole('columnheader', { name: 'Product' })).not.toBeInTheDocument();
  });
});

describe('MovementFilters', () => {
  it('reports changes and resets', async () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    const { user } = renderWithProviders(
      <MovementFilters query={{ order: 'desc', from: '2026-10-01' }} onChange={onChange} onReset={onReset} />,
    );

    await user.selectOptions(screen.getByLabelText('Type'), 'DECREASE');
    await user.selectOptions(screen.getByLabelText('Order'), 'asc');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-15' } });
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(onChange.mock.calls).toEqual([[{ type: 'DECREASE' }], [{ order: 'asc' }], [{ to: '2026-10-15' }]]);
    expect(screen.getByLabelText('To')).toHaveAttribute('min', '2026-10-01');
    expect(onReset).toHaveBeenCalled();
  });
});

describe('Navbar', () => {
  it('links to every section and highlights the current one', () => {
    renderWithProviders(<Navbar />, { route: '/categories' });
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Dashboard',
      'Products',
      'Categories',
      'History',
    ]);
    expect(within(nav).getByRole('link', { name: 'Categories' })).toHaveClass('active');
  });
});
