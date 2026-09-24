import { Router } from "express";
import { update } from '../controllers/barberController.js';

const router = Router();

// TODO - Add Swagger documentation
router.put('/barbers', update);

export default router;
