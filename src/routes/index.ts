import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import productRoutes from './products';
import orderRoutes from './orders';


const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

export default router;