import { Router } from 'express';
import itemController from '../controllers/item.controller.js';
import validate from '../middlewares/validate.js';
import { createItemSchema, updateItemSchema } from '../validators/item.validator.js';

const router = Router();

router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);
router.post('/', validate(createItemSchema), itemController.create);
router.put('/:id', validate(updateItemSchema), itemController.update);
router.delete('/:id', itemController.remove);

export default router;
