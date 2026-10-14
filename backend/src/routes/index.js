import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import stockMovementRoutes from './stockMovement.routes.js';
import docsRoutes from './docs.routes.js';

const router = Router();

router.use('/docs', docsRoutes);
router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/stock-movements', stockMovementRoutes);

export default router;
