import express from 'express';
import Review from '../models/Review.js';
import { ApiError } from '../lib/error.js';
import { sendInternalReviewNotification } from '../lib/email.js';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';

const router = express.Router();

// Cache token verifications
const tokenCache = new Map<string, { email: string; hotelId: string; expires: number }>();

// Verify email token with caching
const verifyEmailToken = (token: string): { email: string; hotelId: string } => {
    try {
        // Check cache first
        const cached = tokenCache.get(token);
        if (cached && cached.expires > Date.now()) {
            return { email: cached.email, hotelId: cached.hotelId };
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { email: string; hotelId: string; exp?: number };

        // Cache the result
        tokenCache.set(token, {
            email: decoded.email,
            hotelId: decoded.hotelId,
            expires: (decoded.exp || 0) * 1000,
        });

        return { email: decoded.email, hotelId: decoded.hotelId };
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired token');
    }
};

// Submit internal review - optimized version
router.post('/internal', async (req, res) => {
    const { hotelId, guestName, stayDate, rating, reviewText, token } = req.body;

    if (!token || !hotelId) {
        throw new ApiError(401, 'Invalid request');
    }

    // Quick validation
    if (!guestName?.trim() || !stayDate || !rating || !reviewText?.trim()) {
        throw new ApiError(400, 'Missing required fields');
    }

    try {
        // Verify token and get email - now cached
        const { email, hotelId: tokenHotelId } = verifyEmailToken(token);

        // Quick validation
        if (tokenHotelId !== hotelId) {
            throw new ApiError(400, 'Invalid hotel ID');
        }

        // Create review document - minimal fields for speed
        const review = await Review.create({
            hotelId: new Types.ObjectId(hotelId),
            guestName: guestName.trim(),
            email,
            stayDate: new Date(stayDate),
            rating,
            reviewText: reviewText.trim(),
            isInternal: true,
            emailSent: true,
        });

        // Send success response immediately
        res.status(201).json(review);

        // Process email notification in the background
        setImmediate(() => {
            sendInternalReviewNotification(hotelId, review).catch((error) => logger.error('Failed to send review notification:', error));
        });
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error creating review');
    }
});
