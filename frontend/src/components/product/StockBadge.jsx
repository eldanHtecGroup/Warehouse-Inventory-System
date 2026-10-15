import { LOW_STOCK_THRESHOLD } from '../../constants/inventory.js';
import { formatNumber } from '../../utils/formatters.js';

const getStockStatus = (quantity) => {
  if (quantity === 0) return { tone: 'danger', label: 'Out of stock' };
  if (quantity <= LOW_STOCK_THRESHOLD) return { tone: 'warning', label: 'Low stock' };
  return { tone: 'success', label: 'In stock' };
};

const StockBadge = ({ quantity }) => {
  const { tone, label } = getStockStatus(quantity);
  return (
    <span className={`badge badge--${tone}`} title={label}>
      {formatNumber(quantity)}
      <span className="visually-hidden"> ({label})</span>
    </span>
  );
};

export default StockBadge;
