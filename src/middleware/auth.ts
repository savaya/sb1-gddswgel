import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../lib/error.js';
import type { UserDocument } from '../types/mongodb.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

const auth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies.token;
    
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findOne({ _id: (decoded as any)._id })
                          .populate('hotel', 'name googleReviewLink');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token');
    }
    next(error);
  }
};

export default auth;