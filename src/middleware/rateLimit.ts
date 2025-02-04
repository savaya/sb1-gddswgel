import rateLimit from 'express-rate-limit';
import { ApiError } from '../lib/error.js';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  handler: (_req, _res) => {
    throw new ApiError(429, 'Too many requests, please try again later.');
  }
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed login attempts per hour
  handler: (_req, _res) => {
    throw new ApiError(429, 'Too many login attempts, please try again later.');
  }
});