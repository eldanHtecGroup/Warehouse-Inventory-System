import categoryService from '../services/category.service.js';

const getAll = (req, res) => {
  res.status(200).json({ data: categoryService.getAllCategories() });
};

const getById = (req, res) => {
  res.status(200).json({ data: categoryService.getCategoryById(req.validated.params.id) });
};

const getStockSummary = (req, res) => {
  res.status(200).json({ data: categoryService.getStockSummary() });
};

const create = (req, res) => {
  res.status(201).json({ data: categoryService.createCategory(req.validated.body) });
};

const update = (req, res) => {
  const { params, body } = req.validated;
  res.status(200).json({ data: categoryService.updateCategory(params.id, body) });
};

const remove = (req, res) => {
  categoryService.deleteCategory(req.validated.params.id);
  res.status(204).send();
};

export default { getAll, getById, getStockSummary, create, update, remove };
