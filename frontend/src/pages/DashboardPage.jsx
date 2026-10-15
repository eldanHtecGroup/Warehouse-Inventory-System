import { Link } from 'react-router';

import categoryApi from '../api/category.api.js';
import productApi from '../api/product.api.js';
import stockMovementApi from '../api/stockMovement.api.js';
import { LOW_STOCK_THRESHOLD } from '../constants/inventory.js';
import { ROUTES, productDetailPath } from '../constants/routes.js';
import useFetch from '../hooks/useFetch.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import PageHeader from '../components/common/PageHeader.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import CategoryStockTable from '../components/category/CategoryStockTable.jsx';
import MovementTable from '../components/stockMovement/MovementTable.jsx';
import StockBadge from '../components/product/StockBadge.jsx';

const LOW_STOCK_QUERY = { maxQuantity: LOW_STOCK_THRESHOLD, sortBy: 'quantity', order: 'asc', limit: 5 };
const LOW_STOCK_LINK = `${ROUTES.PRODUCTS}?maxQuantity=${LOW_STOCK_THRESHOLD}&sortBy=quantity`;

const fetchLowStock = (options) => productApi.list(LOW_STOCK_QUERY, options);
const fetchRecentMovements = (options) => stockMovementApi.list({ limit: 5 }, options);

const DashboardPage = () => {
  const summary = useFetch(categoryApi.getStockSummary);
  const lowStock = useFetch(fetchLowStock);
  const recent = useFetch(fetchRecentMovements);

  const totals = summary.data?.totals;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your inventory" />

      {summary.error && <ErrorMessage error={summary.error} onRetry={summary.refetch} />}

      <div className="stat-grid">
        <StatCard label="Products" value={totals ? formatNumber(totals.productCount) : '…'} />
        <StatCard label="Units in stock" value={totals ? formatNumber(totals.totalQuantity) : '…'} />
        <StatCard label="Inventory value" value={totals ? formatCurrency(totals.totalValue) : '…'} />
        <StatCard
          label={`Low stock (≤ ${LOW_STOCK_THRESHOLD})`}
          value={lowStock.data ? formatNumber(lowStock.data.meta.total) : '…'}
          tone={lowStock.data?.meta.total ? 'warning' : undefined}
        />
      </div>

      <section className="section">
        <div className="section__header">
          <h2>Stock by category</h2>
          <Link to={ROUTES.CATEGORIES}>Manage categories</Link>
        </div>
        {summary.isLoading && !summary.data && <Loader />}
        {summary.data &&
          (summary.data.categories.length ? (
            <CategoryStockTable summary={summary.data} />
          ) : (
            <EmptyState title="No categories yet">
              <Link to={ROUTES.CATEGORIES}>Create your first category</Link>
            </EmptyState>
          ))}
      </section>

      <div className="section-grid">
        <section className="section">
          <div className="section__header">
            <h2>Low stock</h2>
            <Link to={LOW_STOCK_LINK}>View all</Link>
          </div>
          {lowStock.isLoading && !lowStock.data && <Loader />}
          {lowStock.error && <ErrorMessage error={lowStock.error} onRetry={lowStock.refetch} />}
          {lowStock.data &&
            (lowStock.data.data.length ? (
              <ul className="list">
                {lowStock.data.data.map((product) => (
                  <li key={product.id} className="list__item">
                    <Link to={productDetailPath(product.id)}>{product.name}</Link>
                    <StockBadge quantity={product.quantity} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="All products are well stocked" />
            ))}
        </section>

        <section className="section">
          <div className="section__header">
            <h2>Recent stock changes</h2>
            <Link to={ROUTES.HISTORY}>Full history</Link>
          </div>
          {recent.isLoading && !recent.data && <Loader />}
          {recent.error && <ErrorMessage error={recent.error} onRetry={recent.refetch} />}
          {recent.data &&
            (recent.data.data.length ? (
              <MovementTable movements={recent.data.data} />
            ) : (
              <EmptyState title="No stock changes yet" />
            ))}
        </section>
      </div>
    </>
  );
};

export default DashboardPage;
