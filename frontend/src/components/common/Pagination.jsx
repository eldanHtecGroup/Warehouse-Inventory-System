import { PAGE_SIZE_OPTIONS } from '../../constants/inventory.js';
import { formatNumber } from '../../utils/formatters.js';

const Pagination = ({ meta, onPageChange, onLimitChange }) => {
  if (!meta || meta.total === 0) return null;

  const { page, limit, total, totalPages } = meta;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__summary">
        {formatNumber(first)}–{formatNumber(last)} of {formatNumber(total)}
      </span>
      {onLimitChange && (
        <label className="pagination__limit">
          Per page
          <select value={limit} onChange={(event) => onLimitChange(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="pagination__buttons">
        <button type="button" className="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button type="button" className="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
