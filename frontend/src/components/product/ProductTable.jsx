import { Link } from 'react-router';

import { productDetailPath, productEditPath } from '../../constants/routes.js';
import { PRODUCT_SORT_FIELDS } from '../../constants/inventory.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import SortableHeader from '../common/SortableHeader.jsx';
import StockBadge from './StockBadge.jsx';

const ProductTable = ({ products, sortBy, order, onSort, onAdjustStock, onDelete }) => {
  const header = (field, className) => (
    <SortableHeader
      field={field}
      label={PRODUCT_SORT_FIELDS[field]}
      sortBy={sortBy}
      order={order}
      onSort={onSort}
      className={className}
    />
  );

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {header('name')}
            {header('code')}
            {header('category')}
            {header('price', 'table__num')}
            {header('quantity', 'table__num')}
            {header('updatedAt')}
            <th className="table__actions">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <Link to={productDetailPath(product.id)} className="table__primary-link">
                  {product.name}
                </Link>
              </td>
              <td>
                <code>{product.code}</code>
              </td>
              <td>{product.categoryName}</td>
              <td className="table__num">{formatCurrency(product.price)}</td>
              <td className="table__num">
                <StockBadge quantity={product.quantity} />
              </td>
              <td className="table__muted">{formatDate(product.updatedAt)}</td>
              <td className="table__actions">
                <button type="button" className="button button--small" onClick={() => onAdjustStock(product)}>
                  Adjust stock
                </button>
                <Link to={productEditPath(product.id)} className="button button--small">
                  Edit
                </Link>
                <button type="button" className="button button--small button--danger-ghost" onClick={() => onDelete(product)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
