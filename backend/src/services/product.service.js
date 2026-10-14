import db from '../db/index.js';
import productRepository from '../repositories/product.repository.js';
import categoryRepository from '../repositories/category.repository.js';
import stockMovementRepository from '../repositories/stockMovement.repository.js';
import ApiError from '../utils/ApiError.js';
import { MOVEMENT_TYPES } from '../utils/constants.js';

const listProducts = (filters) => {
  const { items, total } = productRepository.findMany(filters);
  return {
    items,
    meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
};

const getProductById = (id) => {
  const product = productRepository.findById(id);
  if (!product) throw ApiError.notFound(`Product with id ${id} not found`);
  return product;
};

const assertCategoryExists = (categoryId) => {
  if (!categoryRepository.findById(categoryId)) {
    throw ApiError.badRequest(`Category with id ${categoryId} does not exist`);
  }
};

const assertCodeAvailable = (code, excludeId) => {
  const existing = productRepository.findByCode(code);
  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict(`Product with code "${code}" already exists`);
  }
};

const recordMovement = (product, type, quantityChange, reason) =>
  stockMovementRepository.create({
    productId: product.id,
    productName: product.name,
    productCode: product.code,
    type,
    quantityChange,
    quantityBefore: product.quantity - quantityChange,
    quantityAfter: product.quantity,
    reason,
  });

// All writes that touch stock run in a transaction so the product row
// and its stock movement record are always saved (or rolled back) together.

const createProduct = db.transaction((data) => {
  assertCategoryExists(data.categoryId);
  assertCodeAvailable(data.code);
  const product = productRepository.create(data);
  recordMovement(product, MOVEMENT_TYPES.INITIAL, product.quantity, 'Initial stock');
  return product;
});

const updateProduct = (id, data) => {
  getProductById(id);
  if (data.categoryId !== undefined) assertCategoryExists(data.categoryId);
  if (data.code !== undefined) assertCodeAvailable(data.code, id);
  return productRepository.update(id, data);
};

const deleteProduct = db.transaction((id) => {
  const product = getProductById(id);
  recordMovement({ ...product, quantity: 0 }, MOVEMENT_TYPES.REMOVED, -product.quantity, 'Product deleted');
  productRepository.remove(id);
});

const adjustStock = db.transaction((id, quantityChange, reason) => {
  const product = getProductById(id);
  const newQuantity = product.quantity + quantityChange;

  if (newQuantity < 0) {
    throw ApiError.unprocessable(
      `Insufficient stock for "${product.code}": requested ${-quantityChange}, available ${product.quantity}`,
    );
  }

  const updated = productRepository.updateQuantity(id, newQuantity);
  const type = quantityChange > 0 ? MOVEMENT_TYPES.INCREASE : MOVEMENT_TYPES.DECREASE;
  const movement = recordMovement(updated, type, quantityChange, reason);
  return { product: updated, movement };
});

const increaseStock = (id, { quantity, reason }) => adjustStock(id, quantity, reason);

const decreaseStock = (id, { quantity, reason }) => adjustStock(id, -quantity, reason);

export default {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  increaseStock,
  decreaseStock,
};
