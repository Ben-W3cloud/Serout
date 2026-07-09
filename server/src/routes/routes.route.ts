import { Router } from 'express';
import { getRoutes } from '../controllers/routes.controller.js';
import { validate } from '../middleware/validate.js';
import { RoutesRequestSchema } from '../types/intent.js';

const router = Router();

router.post('/routes', validate(RoutesRequestSchema), getRoutes);

export default router;
