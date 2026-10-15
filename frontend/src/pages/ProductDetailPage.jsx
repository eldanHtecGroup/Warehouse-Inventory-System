import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import productApi from '../api/product.api.js';
import { ROUTES, productEditPath, productHistoryPath } from '../constants/routes.js';
import useFetch from '../hooks/useFetch.js';
import useToast from '../hooks/useToast.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ProductDetails from '../components/product/ProductDetails.jsx';
import StockAdjustForm from '../components/product/StockAdjustForm.jsx';
import MovementTable from '../components/stockMovement/MovementTable.jsx';

const HISTORY_PAGE_SIZE = 10;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [historyPage, setHistoryPage] = useState(1);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProduct = useCallback((options) => productApi.getById(id, options), [id]);
  const fetchHistory = useCallback(
    (options) => productApi.getStockMovements(id, { page: historyPage, limit: HISTORY_PAGE_SIZE }, options),
    [id, historyPage],
  );

  const product = useFetch(fetchProduct);
  const history = useFetch(fetchHistory);

  const handleAdjusted = () => {
    product.refetch();
    if (historyPage === 1) history.refetch();
    else setHistoryPage(1);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await productApi.remove(id);
      showToast({ message: `"${product.data.name}" was deleted.` });
      navigate(ROUTES.PRODUCTS);
    } catch (error) {
      showToast({ type: 'error', message: error.message });
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  if (product.error?.status === 404) {
    return (
      <>
        <PageHeader title="Product not found" />
        <EmptyState title="This product doesn't exist or has been deleted.">
          <p>
            <Link to={productHistoryPath(id)}>View its stock history</Link> ·{' '}
            <Link to={ROUTES.PRODUCTS}>Back to products</Link>
          </p>
        </EmptyState>
      </>
    );
  }

  if (product.error) return <ErrorMessage error={product.error} onRetry={product.refetch} />;
  if (!product.data) return <Loader />;

  return (
    <>
      <p className="breadcrumb">
        <Link to={ROUTES.PRODUCTS}>← Products</Link>
      </p>
      <PageHeader
        title={product.data.name}
        subtitle={product.data.categoryName}
        actions={
          <>
            <Link to={productEditPath(id)} className="button">
              Edit
            </Link>
            <button type="button" className="button button--danger-ghost" onClick={() => setIsConfirmingDelete(true)}>
              Delete
            </button>
          </>
        }
      />

      <div className="detail-grid">
        <section className="card">
          <h2>Details</h2>
          <ProductDetails product={product.data} />
        </section>

        <section className="card">
          <h2>Adjust stock</h2>
          <StockAdjustForm product={product.data} onAdjusted={handleAdjusted} />
        </section>
      </div>

      <section className="section">
        <div className="section__header">
          <h2>Stock history</h2>
          <Link to={productHistoryPath(id)}>Open in history</Link>
        </div>
        {history.error && <ErrorMessage error={history.error} onRetry={history.refetch} />}
        {history.isLoading && !history.data && <Loader />}
        {history.data &&
          (history.data.data.length ? (
            <div className={history.isLoading ? 'is-refreshing' : undefined} aria-busy={history.isLoading}>
              <MovementTable movements={history.data.data} showProduct={false} />
              <Pagination meta={history.data.meta} onPageChange={setHistoryPage} />
            </div>
          ) : (
            <EmptyState title="No stock changes recorded yet" />
          ))}
      </section>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete product?"
        message={`"${product.data.name}" will be removed. Its stock history is kept.`}
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </>
  );
};

export default ProductDetailPage;
