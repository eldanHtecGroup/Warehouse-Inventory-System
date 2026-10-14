import { Router } from 'express';
import productController from '../controllers/product.controller.js';
import validate from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import {
  createProductBody,
  updateProductBody,
  stockAdjustmentBody,
  listProductsQuery,
} from '../validators/product.validator.js';
import { listProductMovementsQuery } from '../validators/stockMovement.validator.js';

const router = Router();

router.get('/', validate({ query: listProductsQuery }), productController.getAll);
router.get('/:id', validate({ params: idParams }), productController.getById);
router.post('/', validate({ body: createProductBody }), productController.create);
router.patch('/:id', validate({ params: idParams, body: updateProductBody }), productController.update);
router.delete('/:id', validate({ params: idParams }), productController.remove);

router.post(
  '/:id/stock/increase',
  validate({ params: idParams, body: stockAdjustmentBody }),
  productController.increaseStock,
);
router.post(
  '/:id/stock/decrease',
  validate({ params: idParams, body: stockAdjustmentBody }),
  productController.decreaseStock,
);
router.get(
  '/:id/stock-movements',
  validate({ params: idParams, query: listProductMovementsQuery }),
  productController.getStockMovements,
);

export default router;
