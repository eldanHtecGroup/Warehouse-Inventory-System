import { Router } from 'express';
import healthRoutes from './health.routes.js';
import itemRoutes from './item.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/items', itemRoutes);

export default router;
