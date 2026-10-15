import { Link } from 'react-router';

import { productsByCategoryPath } from '../../constants/routes.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import StockBadge from './StockBadge.jsx';

const ProductDetails = ({ product }) => (
  <dl className="details">
    <div>
      <dt>Name</dt>
      <dd>{product.name}</dd>
    </div>
    <div>
      <dt>Code</dt>
      <dd>
        <code>{product.code}</code>
      </dd>
    </div>
    <div>
      <dt>Category</dt>
      <dd>
        <Link to={productsByCategoryPath(product.categoryId)}>{product.categoryName}</Link>
      </dd>
    </div>
    <div>
      <dt>Price</dt>
      <dd>{formatCurrency(product.price)}</dd>
    </div>
    <div>
      <dt>Quantity in stock</dt>
      <dd>
        <StockBadge quantity={product.quantity} />
      </dd>
    </div>
    <div>
      <dt>Stock value</dt>
      <dd>{formatCurrency(product.price * product.quantity)}</dd>
    </div>
    <div className="details__wide">
      <dt>Description</dt>
      <dd>{product.description || <span className="table__muted">No description</span>}</dd>
    </div>
    <div>
      <dt>Created</dt>
      <dd>{formatDate(product.createdAt)}</dd>
    </div>
    <div>
      <dt>Last updated</dt>
      <dd>{formatDate(product.updatedAt)}</dd>
    </div>
  </dl>
);

export default ProductDetails;
