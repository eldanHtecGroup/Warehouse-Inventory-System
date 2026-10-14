import stockMovementRepository from '../repositories/stockMovement.repository.js';
import productRepository from '../repositories/product.repository.js';
import ApiError from '../utils/ApiError.js';

const listMovements = (filters) => {
  const { items, total } = stockMovementRepository.findMany(filters);
  return {
    items,
    meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
};

// History of an existing product. History of deleted products remains
// available through listMovements({ productId }).
const listProductMovements = (productId, filters) => {
  if (!productRepository.findById(productId)) {
    throw ApiError.notFound(`Product with id ${productId} not found`);
  }
  return listMovements({ ...filters, productId });
};

export default { listMovements, listProductMovements };
