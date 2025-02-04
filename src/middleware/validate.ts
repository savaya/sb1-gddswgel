import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/error.js';

const validate = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(400, error.errors[0].message);
      }
      next(error);
    }
  };
};

const schemas = {
  login: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6)
  }),
  
  createUser: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'user']),
    hotel: z.string().optional()
  }),
  
  updateUser: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['admin', 'user']).optional(),
    hotel: z.string().optional()
  }).strict(),
  
  createHotel: z.object({
    name: z.string().min(2).max(100),
    googleReviewLink: z.string().url().optional()
  }),
  
  createReview: z.object({
    hotelId: z.string(),
    guestName: z.string().min(2).max(100),
    stayDate: z.string().datetime(),
    rating: z.number().min(1).max(5),
    reviewText: z.string().min(10)
  })
};

export { validate, schemas };