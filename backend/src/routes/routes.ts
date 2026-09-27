import { Router } from 'express';
import testRoutes from './testRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import managerRoutes from './managerRoutes.js';
import barberRoutes from './barberRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import { health } from '../controllers/healthController.js';

const router = Router();

router.use(testRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(managerRoutes);
router.use(barberRoutes);
router.use(recommendationRoutes);

router.get('/health', health);

export default router;
