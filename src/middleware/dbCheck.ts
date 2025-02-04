import { Request, Response, NextFunction } from 'express';
import { checkConnection } from '../lib/db.js';
import { ApiError } from '../lib/error.js';

export const dbConnectionCheck = async (_req: Request, _res: Response, next: NextFunction) => {
  if (!checkConnection()) {
    throw new ApiError(503, 'Database connection is not available');
  }
  next();
};