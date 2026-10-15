import { Link } from 'react-router';

import { productHistoryPath } from '../../constants/routes.js';
import { formatDate, formatNumber, formatQuantityChange } from '../../utils/formatters.js';
import MovementTypeBadge from './MovementTypeBadge.jsx';

const changeClass = (value) => {
  if (value > 0) return 'quantity-change quantity-change--up';
  if (value < 0) return 'quantity-change quantity-change--down';
  return 'quantity-change';
};

// Product names/codes are snapshots from the time of the change, so they stay
// readable after a product is renamed or deleted. Links go to the product's
// full history, which also works for deleted products.
const MovementTable = ({ movements, showProduct = true }) => (
  <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          {showProduct && <th>Product</th>}
          <th>Type</th>
          <th className="table__num">Change</th>
          <th className="table__num">Before → After</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id}>
            <td className="table__nowrap">{formatDate(movement.createdAt)}</td>
            {showProduct && (
              <td>
                <Link to={productHistoryPath(movement.productId)} className="table__primary-link">
                  {movement.productName}
                </Link>{' '}
                <code className="table__muted">{movement.productCode}</code>
              </td>
            )}
            <td>
              <MovementTypeBadge type={movement.type} />
            </td>
            <td className="table__num">
              <span className={changeClass(movement.quantityChange)}>{formatQuantityChange(movement.quantityChange)}</span>
            </td>
            <td className="table__num table__nowrap">
              {formatNumber(movement.quantityBefore)} → {formatNumber(movement.quantityAfter)}
            </td>
            <td className="table__muted">{movement.reason || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MovementTable;
