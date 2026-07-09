import { Request, Response, NextFunction } from 'express';
import { parseUserIntent } from '../services/ai.service.js';
import { logger } from '../utils/logger.js';

export async function parseMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, walletAddress } = req.body;
    logger.info({ message, walletAddress }, 'Parsing user intent');

    const result = await parseUserIntent(message);

    if (result.clarification) {
      res.json({ success: true, clarification: result.clarification });
      return;
    }

    res.json({ success: true, intent: result.intent });
  } catch (error) {
    next(error);
  }
}
