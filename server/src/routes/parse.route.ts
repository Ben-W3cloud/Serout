import { Router } from 'express';
import { parseMessage } from '../controllers/parse.controller.js';
import { validate } from '../middleware/validate.js';
import { ParseRequestSchema } from '../types/intent.js';

const router = Router();

router.post('/parse', validate(ParseRequestSchema), parseMessage);

export default router;
