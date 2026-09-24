import { Router } from "express";
import { update } from '../controllers/managerController.js';

const router = Router();

// TODO - Add Swagger documentation
router.put('/managers', update);

export default router;
