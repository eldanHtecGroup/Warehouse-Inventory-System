import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import productApi from '../../../src/api/product.api.js';
import { ApiError } from '../../../src/api/httpClient.js';
import ProductDetails from '../../../src/components/product/ProductDetails.jsx';
import ProductFilters from '../../../src/components/product/ProductFilters.jsx';
import ProductForm from '../../../src/components/product/ProductForm.jsx';
import ProductTable from '../../../src/components/product/ProductTable.jsx';
import StockAdjustForm from '../../../src/components/product/StockAdjustForm.jsx';
import StockBadge from '../../../src/components/product/StockBadge.jsx';
import { renderWithProviders } from '../../helpers/render.jsx';
import { buildCategory, buildProduct } from '../../helpers/fixtures.js';

describe('StockBadge', () => {
  it.each([
    [0, 'Out of stock', 'badge--danger'],
    [10, 'Low stock', 'badge--warning'],
    [11, 'In stock', 'badge--success'],
  ])('quantity %i is "%s"', (quantity, label, className) => {
    renderWithProviders(<StockBadge quantity={quantity} />);
    const badge = screen.getByTitle(label);
    expect(badge).toHaveClass(className);
    expect(badge).toHaveTextContent(`${quantity} (${label})`);
  });
});

describe('ProductDetails', () => {
  it('shows all product information', () => {
    renderWithProviders(<ProductDetails product={buildProduct({ price: 2.5, quantity: 4, description: 'Fizzy' })} />);
    expect(screen.getByText('BEV-001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beverages' })).toHaveAttribute('href', '/products?categoryId=1');
    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument(); // stock value
    expect(screen.getByText('Fizzy')).toBeInTheDocument();
  });

  it('shows a placeholder without description', () => {
    renderWithProviders(<ProductDetails product={buildProduct()} />);
    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});

describe('ProductTable', () => {
  it('lists products and wires up the row actions', async () => {
    const product = buildProduct();
    const handlers = { onSort: vi.fn(), onAdjustStock: vi.fn(), onDelete: vi.fn() };
    const { user } = renderWithProviders(<ProductTable products={[product]} sortBy="name" order="asc" {...handlers} />);

    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByRole('link', { name: product.name })).toHaveAttribute('href', '/products/1');
    expect(within(row).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/products/1/edit');

    await user.click(within(row).getByRole('button', { name: 'Adjust stock' }));
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: /Quantity/ }));

    expect(handlers.onAdjustStock).toHaveBeenCalledWith(product);
    expect(handlers.onDelete).toHaveBeenCalledWith(product);
    expect(handlers.onSort).toHaveBeenCalledWith('quantity', 'asc');
  });
});

describe('ProductFilters', () => {
  afterEach(() => vi.useRealTimers());

  const categories = [buildCategory(), buildCategory({ id: 2, name: 'Snacks' })];

  it('applies select filters immediately', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <ProductFilters query={{}} categories={categories} onChange={onChange} onReset={vi.fn()} />,
    );

    await user.selectOptions(screen.getByLabelText('Category'), 'Snacks');
    await user.selectOptions(screen.getByLabelText('Availability'), 'false');

    expect(onChange.mock.calls).toEqual([[{ categoryId: '2' }], [{ inStock: 'false' }]]);
  });

  it('debounces typed filters and batches them into one update', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderWithProviders(<ProductFilters query={{}} categories={categories} onChange={onChange} onReset={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: ' tea ' } });
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '1' } });
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(400));
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ search: 'tea', minPrice: '1' });
  });

  it('reset clears the inputs and cancels pending updates', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onReset = vi.fn();
    renderWithProviders(
      <ProductFilters query={{ maxQuantity: '5' }} categories={categories} onChange={onChange} onReset={onReset} />,
    );
    expect(screen.getByLabelText('Maximum quantity')).toHaveValue(5);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'tea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    act(() => vi.advanceTimersByTime(400));

    expect(onReset).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(screen.getByLabelText('Maximum quantity')).toHaveValue(null);
  });

  it('syncs the inputs when the URL changes from outside', () => {
    const props = { categories, onChange: vi.fn(), onReset: vi.fn() };
    const { rerender } = renderWithProviders(<ProductFilters query={{ search: 'tea' }} {...props} />);
    expect(screen.getByLabelText('Search')).toHaveValue('tea');

    rerender(<ProductFilters query={{}} {...props} />);
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });
});

describe('ProductForm', () => {
  const categories = [buildCategory()];

  it('validates required fields before submitting', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ProductForm categories={categories} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.clear(screen.getByLabelText('Initial quantity'));
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Code is required.')).toBeInTheDocument();
    expect(screen.getByText('Price is required.')).toBeInTheDocument();
    expect(screen.getByText('Select a category.')).toBeInTheDocument();
    expect(screen.getByText(/Initial quantity must be a whole number/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates price format and length limits', async () => {
    const { user } = renderWithProviders(<ProductForm categories={categories} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x'.repeat(201) } });
    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'x'.repeat(51) } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'x'.repeat(1001) } });
    await user.type(screen.getByLabelText('Price'), '1.999');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(screen.getByText(/Name must be at most 200/)).toBeInTheDocument();
    expect(screen.getByText(/Code must be at most 50/)).toBeInTheDocument();
    expect(screen.getByText(/Description must be at most 1000/)).toBeInTheDocument();
    expect(screen.getByText(/at most 2 decimal places/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Price'));
    await user.type(screen.getByLabelText('Price'), '2000000');
    await user.click(screen.getByRole('button', { name: 'Create product' }));
    expect(screen.getByText(/Price must be at most 1000000/)).toBeInTheDocument();
  });

  it('submits a trimmed payload with the initial quantity', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const { user } = renderWithProviders(<ProductForm categories={categories} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Name'), '  Green Tea ');
    await user.type(screen.getByLabelText(/Code/), 'BEV-010');
    await user.selectOptions(screen.getByLabelText('Category'), 'Beverages');
    await user.type(screen.getByLabelText('Price'), '3.29');
    await user.clear(screen.getByLabelText('Initial quantity'));
    await user.type(screen.getByLabelText('Initial quantity'), '12');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Green Tea',
      code: 'BEV-010',
      description: null,
      price: 3.29,
      categoryId: 1,
      quantity: 12,
    });
  });

  it('edits without a quantity field and shows backend field errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError('Validation failed', 400, [{ field: 'body.code', message: 'Code already used' }]),
    );
    const { user } = renderWithProviders(
      <ProductForm product={buildProduct({ description: 'Fizzy' })} categories={categories} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );

    expect(screen.queryByLabelText('Initial quantity')).not.toBeInTheDocument();
    expect(screen.getByText(/can't be edited here/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.not.objectContaining({ quantity: expect.anything() }));
    expect(await screen.findByText('Code already used')).toBeInTheDocument();
  });

  it('shows non-field errors at the top of the form and supports cancel', async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError('Product with code "BEV-001" already exists', 409));
    const { user } = renderWithProviders(
      <ProductForm product={buildProduct()} categories={categories} onSubmit={onSubmit} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('asks for a category first when none exist', () => {
    renderWithProviders(<ProductForm categories={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Create a category' })).toHaveAttribute('href', '/categories');
  });
});

describe('StockAdjustForm', () => {
  it('increases stock and reports the new quantity', async () => {
    const product = buildProduct({ quantity: 5 });
    const onAdjusted = vi.fn();
    const result = { product: { ...product, quantity: 8 }, movement: {} };
    vi.spyOn(productApi, 'increaseStock').mockResolvedValue(result);
    const { user } = renderWithProviders(<StockAdjustForm product={product} onAdjusted={onAdjusted} />);

    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '3');
    expect(screen.getByText(/New:/)).toHaveTextContent('New: 8');
    await user.type(screen.getByLabelText(/Reason/), ' Delivery ');
    await user.click(screen.getByRole('button', { name: 'Increase stock' }));

    expect(productApi.increaseStock).toHaveBeenCalledWith(product.id, { quantity: 3, reason: 'Delivery' });
    expect(onAdjusted).toHaveBeenCalledWith(result);
    expect(await screen.findByRole('status')).toHaveTextContent('increased by 3 (now 8)');
    expect(screen.getByLabelText('Quantity')).toHaveValue(1);
  });

  it('prevents decreasing below zero', async () => {
    const spy = vi.spyOn(productApi, 'decreaseStock');
    const { user } = renderWithProviders(<StockAdjustForm product={buildProduct({ quantity: 2 })} />);

    await user.click(screen.getByRole('button', { name: /Decrease/ }));
    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '3');

    expect(screen.getByText(/Only 2 in stock/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease stock' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('button', { name: 'Decrease stock' }).closest('form'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('explains that out-of-stock products cannot be decreased', async () => {
    const { user } = renderWithProviders(<StockAdjustForm product={buildProduct({ quantity: 0 })} />);
    await user.click(screen.getByRole('button', { name: /Decrease/ }));
    expect(screen.getByText(/out of stock/)).toBeInTheDocument();
  });

  it('rejects non-whole quantities', async () => {
    const { user } = renderWithProviders(<StockAdjustForm product={buildProduct()} />);
    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '0');
    expect(screen.getByText(/whole number greater than 0/)).toBeInTheDocument();
  });

  it('shows errors returned by the backend', async () => {
    vi.spyOn(productApi, 'decreaseStock').mockRejectedValue(new ApiError('Insufficient stock', 422));
    const { user } = renderWithProviders(<StockAdjustForm product={buildProduct({ quantity: 5 })} />);

    await user.click(screen.getByRole('button', { name: /Decrease/ }));
    await user.click(screen.getByRole('button', { name: 'Decrease stock' }));

    expect(productApi.decreaseStock).toHaveBeenCalledWith(1, { quantity: 1, reason: undefined });
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient stock');
  });
});
