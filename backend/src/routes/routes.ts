import { Router } from 'express';
import testRoutes from './testRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import managerRoutes from './managerRoutes.js';
import barberRoutes from './barberRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import { health } from '../controllers/healthController.js';
import shopRoutes from './shopRoutes.js';

const router = Router();

router.use(testRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(managerRoutes);
router.use(barberRoutes);
router.use(recommendationRoutes);
router.use(shopRoutes);

router.get('/health', health);

export default router;
