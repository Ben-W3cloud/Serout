import { Request, Response, NextFunction } from 'express';
import { generateRoutes } from '../services/route.service.js';
import { logger } from '../utils/logger.js';

export async function getRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const { intent } = req.body;
    logger.info({ intentType: intent.type }, 'Generating routes');

    const routes = await generateRoutes(intent);

    res.json({ success: true, routes });
  } catch (error) {
    next(error);
  }
}
