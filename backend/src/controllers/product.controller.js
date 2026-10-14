import productService from '../services/product.service.js';
import stockMovementService from '../services/stockMovement.service.js';

const getAll = (req, res) => {
  const { items, meta } = productService.listProducts(req.validated.query);
  res.status(200).json({ data: items, meta });
};

const getById = (req, res) => {
  res.status(200).json({ data: productService.getProductById(req.validated.params.id) });
};

const create = (req, res) => {
  res.status(201).json({ data: productService.createProduct(req.validated.body) });
};

const update = (req, res) => {
  const { params, body } = req.validated;
  res.status(200).json({ data: productService.updateProduct(params.id, body) });
};

const remove = (req, res) => {
  productService.deleteProduct(req.validated.params.id);
  res.status(204).send();
};

const increaseStock = (req, res) => {
  const { params, body } = req.validated;
  res.status(200).json({ data: productService.increaseStock(params.id, body) });
};

const decreaseStock = (req, res) => {
  const { params, body } = req.validated;
  res.status(200).json({ data: productService.decreaseStock(params.id, body) });
};

const getStockMovements = (req, res) => {
  const { params, query } = req.validated;
  const { items, meta } = stockMovementService.listProductMovements(params.id, query);
  res.status(200).json({ data: items, meta });
};

export default { getAll, getById, create, update, remove, increaseStock, decreaseStock, getStockMovements };
