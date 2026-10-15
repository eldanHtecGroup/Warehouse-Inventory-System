import { Link } from 'react-router';

import { productsByCategoryPath } from '../../constants/routes.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';

// Total stock per category, with each category's share of all units in stock
const CategoryStockTable = ({ summary }) => {
  const { categories, totals } = summary;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Category</th>
            <th className="table__num">Products</th>
            <th className="table__num">Units in stock</th>
            <th className="table__share">Share of units</th>
            <th className="table__num">Stock value</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const share = totals.totalQuantity ? (category.totalQuantity / totals.totalQuantity) * 100 : 0;
            return (
              <tr key={category.categoryId}>
                <td>
                  <Link to={productsByCategoryPath(category.categoryId)} className="table__primary-link">
                    {category.categoryName}
                  </Link>
                </td>
                <td className="table__num">{formatNumber(category.productCount)}</td>
                <td className="table__num">{formatNumber(category.totalQuantity)}</td>
                <td className="table__share">
                  <div className="share-bar" aria-hidden="true">
                    <div className="share-bar__fill" style={{ width: `${share}%` }} />
                  </div>
                  <span className="share-bar__label">{share.toFixed(1)}%</span>
                </td>
                <td className="table__num">{formatCurrency(category.totalValue)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="table__num">{formatNumber(totals.productCount)}</td>
            <td className="table__num">{formatNumber(totals.totalQuantity)}</td>
            <td className="table__share" />
            <td className="table__num">{formatCurrency(totals.totalValue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CategoryStockTable;
