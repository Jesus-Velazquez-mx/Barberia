import { Router } from "express";
import { update } from '../controllers/userController.js';

const router = Router();

// TODO - Add Swagger documentation
router.put('/user', update);

export default router;