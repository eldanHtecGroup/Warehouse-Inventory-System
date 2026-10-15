import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ConfirmDialog from '../../../src/components/common/ConfirmDialog.jsx';
import EmptyState from '../../../src/components/common/EmptyState.jsx';
import ErrorMessage from '../../../src/components/common/ErrorMessage.jsx';
import FormField from '../../../src/components/common/FormField.jsx';
import Loader from '../../../src/components/common/Loader.jsx';
import Modal from '../../../src/components/common/Modal.jsx';
import PageHeader from '../../../src/components/common/PageHeader.jsx';
import Pagination from '../../../src/components/common/Pagination.jsx';
import SortableHeader from '../../../src/components/common/SortableHeader.jsx';
import StatCard from '../../../src/components/common/StatCard.jsx';
import { buildMeta } from '../../helpers/fixtures.js';

describe('Loader / EmptyState / StatCard / PageHeader', () => {
  it('render their content', () => {
    render(
      <>
        <Loader />
        <EmptyState title="Nothing here">
          <a href="/x">Add one</a>
        </EmptyState>
        <StatCard label="Products" value="10" tone="warning" />
        <PageHeader title="Products" subtitle="All of them" actions={<button type="button">Add</button>} />
      </>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add one' })).toBeInTheDocument();
    expect(screen.getByText('10').closest('.stat-card')).toHaveClass('stat-card--warning');
    expect(screen.getByRole('heading', { level: 1, name: 'Products' })).toBeInTheDocument();
    expect(screen.getByText('All of them')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('ErrorMessage', () => {
  it('shows the message, validation details and a retry button', async () => {
    const onRetry = vi.fn();
    const error = { message: 'Validation failed', details: [{ field: 'query.minPrice', message: 'Too high' }] };
    render(<ErrorMessage error={error} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
    expect(screen.getByText('Too high')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('falls back to a generic message without retry', () => {
    render(<ErrorMessage error={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('FormField', () => {
  it('links the label and shows a hint', () => {
    render(
      <FormField label="Name" hint="Product name">
        <input />
      </FormField>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAccessibleDescription('Product name');
  });

  it('marks the control invalid and shows the error instead of the hint', () => {
    render(
      <FormField label="Name" hint="Product name" error="Required">
        <input />
      </FormField>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
  });
});

describe('Modal / ConfirmDialog', () => {
  it('renders content only while open and closes via the close button', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} title="Edit" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen title="Edit" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();

    rerender(
      <Modal isOpen={false} title="Edit" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  it('ConfirmDialog calls confirm/cancel and shows the pending state', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog isOpen title="Delete?" message="Sure?" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();

    rerender(<ConfirmDialog isOpen isPending title="Delete?" message="Sure?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: 'Working...' })).toBeDisabled();
  });
});

describe('Pagination', () => {
  it('renders nothing when there are no results', () => {
    const { container } = render(<Pagination meta={buildMeta({ total: 0 })} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the range and navigates between pages', async () => {
    const onPageChange = vi.fn();
    const onLimitChange = vi.fn();
    render(
      <Pagination
        meta={buildMeta({ page: 2, limit: 10, total: 35, totalPages: 4 })}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />,
    );

    expect(screen.getByText('11–20 of 35')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.selectOptions(screen.getByLabelText('Per page'), '50');

    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
    expect(onLimitChange).toHaveBeenCalledWith(50);
  });

  it('disables buttons at the edges and hides the page size without a handler', () => {
    render(<Pagination meta={buildMeta({ page: 1, totalPages: 1, total: 3 })} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.queryByLabelText('Per page')).not.toBeInTheDocument();
  });
});

describe('SortableHeader', () => {
  const renderHeader = (props) =>
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader field="price" label="Price" {...props} />
          </tr>
        </thead>
      </table>,
    );

  it('sorts ascending when an inactive column is clicked', async () => {
    const onSort = vi.fn();
    renderHeader({ sortBy: 'name', order: 'desc', onSort });
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(screen.getByRole('button', { name: /Price/ }));
    expect(onSort).toHaveBeenCalledWith('price', 'asc');
  });

  it('flips the order of the active column', async () => {
    const onSort = vi.fn();
    const { unmount } = renderHeader({ sortBy: 'price', order: 'asc', onSort });
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(screen.getByRole('button', { name: /Price/ }));
    expect(onSort).toHaveBeenLastCalledWith('price', 'desc');
    unmount();

    renderHeader({ sortBy: 'price', order: 'desc', onSort });
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(screen.getByRole('button', { name: /Price/ }));
    expect(onSort).toHaveBeenLastCalledWith('price', 'asc');
  });
});
