import { Router } from 'express';
import testRoutes from './testRoutes.js';
import userRoutes from './authRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';

const router = Router();

router.use(testRoutes);
router.use(userRoutes);
router.use(recommendationRoutes);

export default router;
