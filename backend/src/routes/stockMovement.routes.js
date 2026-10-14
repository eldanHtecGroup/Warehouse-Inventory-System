import { Router } from 'express';
import stockMovementController from '../controllers/stockMovement.controller.js';
import validate from '../middlewares/validate.js';
import { listMovementsQuery } from '../validators/stockMovement.validator.js';

const router = Router();

router.get('/', validate({ query: listMovementsQuery }), stockMovementController.getAll);

export default router;
