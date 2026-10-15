import { useCallback, useState } from 'react';
import { Link } from 'react-router';

import productApi from '../api/product.api.js';
import { ROUTES } from '../constants/routes.js';
import useCategories from '../hooks/useCategories.js';
import useFetch from '../hooks/useFetch.js';
import useQueryParams from '../hooks/useQueryParams.js';
import useToast from '../hooks/useToast.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ProductFilters from '../components/product/ProductFilters.jsx';
import ProductTable from '../components/product/ProductTable.jsx';
import StockAdjustForm from '../components/product/StockAdjustForm.jsx';

const DEFAULT_QUERY = { sortBy: 'name', order: 'asc', page: '1', limit: '20' };
const FILTER_KEYS = ['search', 'categoryId', 'inStock', 'minPrice', 'maxPrice', 'minQuantity', 'maxQuantity'];

const ProductsPage = () => {
  const { showToast } = useToast();
  const { categories } = useCategories();
  const [query, updateQuery] = useQueryParams(DEFAULT_QUERY);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback((options) => productApi.list(query, options), [query]);
  const { data, error, isLoading, refetch } = useFetch(fetchProducts);

  const products = data?.data ?? [];
  const hasFilters = FILTER_KEYS.some((key) => query[key] !== undefined);

  // Any change to filters or sorting starts again from the first page
  const handleFilterChange = (updates) => updateQuery({ ...updates, page: undefined });
  const handleReset = () =>
    updateQuery({ ...Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])), page: undefined });
  const handleSort = (sortBy, order) => updateQuery({ sortBy, order, page: undefined });

  const handleAdjusted = () => {
    setAdjustingProduct(null);
    refetch();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await productApi.remove(deletingProduct.id);
      showToast({ message: `"${deletingProduct.name}" was deleted.` });
      setDeletingProduct(null);
      // Step back if the last product on this page was removed
      if (products.length === 1 && data.meta.page > 1) updateQuery({ page: data.meta.page - 1 });
      else refetch();
    } catch (deleteError) {
      showToast({ type: 'error', message: deleteError.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Search, filter and sort your product catalogue"
        actions={
          <Link to={ROUTES.PRODUCT_NEW} className="button button--primary">
            + Add product
          </Link>
        }
      />

      <ProductFilters query={query} categories={categories} onChange={handleFilterChange} onReset={handleReset} />

      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {isLoading && !data && <Loader />}

      {data &&
        (products.length ? (
          <div className={isLoading ? 'is-refreshing' : undefined} aria-busy={isLoading}>
            <ProductTable
              products={products}
              sortBy={query.sortBy}
              order={query.order}
              onSort={handleSort}
              onAdjustStock={setAdjustingProduct}
              onDelete={setDeletingProduct}
            />
            <Pagination
              meta={data.meta}
              onPageChange={(page) => updateQuery({ page })}
              onLimitChange={(limit) => updateQuery({ limit, page: undefined })}
            />
          </div>
        ) : (
          <EmptyState title={hasFilters ? 'No products match your filters' : 'No products yet'}>
            {hasFilters ? (
              <button type="button" className="button" onClick={handleReset}>
                Reset filters
              </button>
            ) : (
              <Link to={ROUTES.PRODUCT_NEW}>Add your first product</Link>
            )}
          </EmptyState>
        ))}

      <Modal
        isOpen={Boolean(adjustingProduct)}
        title={`Adjust stock: ${adjustingProduct?.name ?? ''}`}
        onClose={() => setAdjustingProduct(null)}
      >
        {adjustingProduct && <StockAdjustForm product={adjustingProduct} onAdjusted={handleAdjusted} />}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingProduct)}
        title="Delete product?"
        message={`"${deletingProduct?.name}" will be removed. Its stock history is kept.`}
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProduct(null)}
      />
    </>
  );
};

export default ProductsPage;
