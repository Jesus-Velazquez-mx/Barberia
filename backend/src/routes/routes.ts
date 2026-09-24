import { Router } from 'express';
import testRoutes from './testRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';

const router = Router();

router.use(testRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(recommendationRoutes);

export default router;
