import { Link } from 'react-router';

import { productsByCategoryPath } from '../../constants/routes.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';

// `categories` are category records merged with their stock summary (totalQuantity, totalValue)
const CategoryTable = ({ categories, onEdit, onDelete }) => (
  <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th className="table__num">Products</th>
          <th className="table__num">Units in stock</th>
          <th className="table__num">Stock value</th>
          <th className="table__actions">
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => {
          const hasProducts = category.productCount > 0;
          return (
            <tr key={category.id}>
              <td>
                <Link to={productsByCategoryPath(category.id)} className="table__primary-link">
                  {category.name}
                </Link>
              </td>
              <td className="table__muted">{category.description || '-'}</td>
              <td className="table__num">{formatNumber(category.productCount)}</td>
              <td className="table__num">{formatNumber(category.totalQuantity)}</td>
              <td className="table__num">{formatCurrency(category.totalValue)}</td>
              <td className="table__actions">
                <button type="button" className="button button--small" onClick={() => onEdit(category)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="button button--small button--danger-ghost"
                  onClick={() => onDelete(category)}
                  disabled={hasProducts}
                  title={hasProducts ? 'Move or delete the products in this category first' : undefined}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default CategoryTable;
