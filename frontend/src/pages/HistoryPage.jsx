import { useCallback } from 'react';

import stockMovementApi from '../api/stockMovement.api.js';
import useFetch from '../hooks/useFetch.js';
import useQueryParams from '../hooks/useQueryParams.js';
import { dateInputToIso } from '../utils/queryString.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import MovementFilters from '../components/stockMovement/MovementFilters.jsx';
import MovementTable from '../components/stockMovement/MovementTable.jsx';

const DEFAULT_QUERY = { order: 'desc', page: '1', limit: '20' };
const FILTER_KEYS = ['type', 'from', 'to', 'order'];

const HistoryPage = () => {
  const [query, updateQuery] = useQueryParams(DEFAULT_QUERY);

  // The URL keeps plain dates (YYYY-MM-DD); the API expects timestamps covering whole days
  const fetchMovements = useCallback(
    (options) =>
      stockMovementApi.list(
        { ...query, from: dateInputToIso(query.from), to: dateInputToIso(query.to, { endOfDay: true }) },
        options,
      ),
    [query],
  );
  const { data, error, isLoading, refetch } = useFetch(fetchMovements);

  const movements = data?.data ?? [];
  // Name/code are snapshots stored on each movement, so they're available even for deleted products
  const productLabel = query.productId && movements[0] ? `${movements[0].productName} (${movements[0].productCode})` : null;

  const handleFilterChange = (updates) => updateQuery({ ...updates, page: undefined });
  const handleReset = () =>
    updateQuery({ ...Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])), page: undefined });

  return (
    <>
      <PageHeader title="Stock history" subtitle="Every inventory change, including those of deleted products" />

      {query.productId && (
        <p className="filter-chip">
          Showing changes for <strong>{productLabel ?? `product #${query.productId}`}</strong>
          <button
            type="button"
            className="icon-button"
            aria-label="Show all products"
            onClick={() => updateQuery({ productId: undefined, page: undefined })}
          >
            ×
          </button>
        </p>
      )}

      <MovementFilters query={query} onChange={handleFilterChange} onReset={handleReset} />

      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {isLoading && !data && <Loader />}
      {data &&
        (movements.length ? (
          <div className={isLoading ? 'is-refreshing' : undefined} aria-busy={isLoading}>
            <MovementTable movements={movements} />
            <Pagination
              meta={data.meta}
              onPageChange={(page) => updateQuery({ page })}
              onLimitChange={(limit) => updateQuery({ limit, page: undefined })}
            />
          </div>
        ) : (
          <EmptyState title="No stock changes match your filters" />
        ))}
    </>
  );
};

export default HistoryPage;
