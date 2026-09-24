import { Router } from 'express';
import testRoutes from './testRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import managerRoutes from './managerRoutes.js';
import barberRoutes from './barberRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';

const router = Router();

router.use(testRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(managerRoutes);
router.use(barberRoutes);
router.use(recommendationRoutes);

export default router;
