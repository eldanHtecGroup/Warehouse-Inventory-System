import { Router } from 'express';
import categoryController from '../controllers/category.controller.js';
import validate from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { createCategoryBody, updateCategoryBody } from '../validators/category.validator.js';

const router = Router();

router.get('/', categoryController.getAll);
// Must be registered before /:id so "stock-summary" is not treated as an id
router.get('/stock-summary', categoryController.getStockSummary);
router.get('/:id', validate({ params: idParams }), categoryController.getById);
router.post('/', validate({ body: createCategoryBody }), categoryController.create);
router.patch('/:id', validate({ params: idParams, body: updateCategoryBody }), categoryController.update);
router.delete('/:id', validate({ params: idParams }), categoryController.remove);

export default router;
