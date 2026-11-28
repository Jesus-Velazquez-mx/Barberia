import { Router } from 'express';
import testRoutes from './testRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import managerRoutes from './managerRoutes.js';
import barberRoutes from './barberRoutes.js';
import receptionistRoutes from './receptionistRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import { health } from '../controllers/healthController.js';
import shopRoutes from './shopRoutes.js';
import offeredServicesRoutes from './offeredServiceRoutes.js';
import suppliesCategoryRoutes from './suppliesCategoryRoutes.js';
import suppliesRoutes from './supplyRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import serviceCategoryRoutes from './serviceCategoryRoutes.js';
import shiftRoutes from './shiftRoutes.js';
import clientRoutes from './clientRoutes.js';
import notificationLogRoutes from './notificationLogRoutes.js';
import businessTimezoneRoutes from './businessTimezoneRoutes.js';
import reportRoutes from './reportRoutes.js';
import styleRoutes from './styleRoutes.js';

const router = Router();

router.use(testRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(clientRoutes);
router.use(managerRoutes);
router.use(barberRoutes);
router.use(receptionistRoutes);
router.use(recommendationRoutes);
router.use(shopRoutes);
router.use(offeredServicesRoutes);
router.use(suppliesCategoryRoutes);
router.use(suppliesRoutes);
router.use(appointmentRoutes);
router.use(shiftRoutes);
router.use(serviceCategoryRoutes);
router.use(notificationLogRoutes);
router.use(businessTimezoneRoutes);
router.use(reportRoutes);
router.use(styleRoutes);

router.get('/health', health);

export default router;
