import { Router } from "express";
import { update } from '../controllers/userController.js';

const router = Router();

// TODO - Add Swagger documentation
router.put('/users', update);

export default router;