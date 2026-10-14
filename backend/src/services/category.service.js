import categoryRepository from '../repositories/category.repository.js';
import ApiError from '../utils/ApiError.js';

const getAllCategories = () => categoryRepository.findAll();

const getCategoryById = (id) => {
  const category = categoryRepository.findById(id);
  if (!category) throw ApiError.notFound(`Category with id ${id} not found`);
  return category;
};

const assertNameAvailable = (name, excludeId) => {
  const existing = categoryRepository.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict(`Category "${name}" already exists`);
  }
};

const createCategory = (data) => {
  assertNameAvailable(data.name);
  return categoryRepository.create(data);
};

const updateCategory = (id, data) => {
  getCategoryById(id);
  if (data.name !== undefined) assertNameAvailable(data.name, id);
  return categoryRepository.update(id, data);
};

const deleteCategory = (id) => {
  const category = getCategoryById(id);
  if (category.productCount > 0) {
    throw ApiError.conflict(
      `Category "${category.name}" still has ${category.productCount} product(s); move or delete them first`,
    );
  }
  categoryRepository.remove(id);
};

const getStockSummary = () => {
  const categories = categoryRepository.getStockSummary();
  const totals = categories.reduce(
    (acc, c) => ({
      productCount: acc.productCount + c.productCount,
      totalQuantity: acc.totalQuantity + c.totalQuantity,
      totalValue: acc.totalValue + c.totalValue,
    }),
    { productCount: 0, totalQuantity: 0, totalValue: 0 },
  );
  totals.totalValue = Math.round(totals.totalValue * 100) / 100;
  return { categories, totals };
};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getStockSummary,
};
