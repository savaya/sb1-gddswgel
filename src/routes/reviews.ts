import express from 'express';
import auth from '../middleware/auth.js';
import Hotel from '../models/Hotel.js';
import EmailBatch from '../models/EmailBatch.js';
import Review from '../models/Review.js';
import { ApiError } from '../lib/error.js';
import { sendReviewRequest, sendInternalReviewNotification } from '../lib/email.js';
import { validateEmails } from '../lib/validators.js';
import logger from '../lib/logger.js';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import type { UserDocument } from '../types/mongodb.js';

const router = express.Router();

// Verify email token
const verifyEmailToken = (token: string): { email: string; hotelId: string } => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return decoded as { email: string; hotelId: string };
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired token');
    }
};

// Submit internal review
router.post('/internal', async (req, res) => {
    try {
        const { hotelId, guestName, stayDate, rating, reviewText, token } = req.body;

        if (!token) {
            throw new ApiError(401, 'No token provided');
        }

        // Quick validation
        if (!guestName?.trim() || !stayDate || !rating || !reviewText?.trim()) {
            throw new ApiError(400, 'Missing required fields');
        }

        // Verify token and get email
        const { email, hotelId: tokenHotelId } = verifyEmailToken(token);

        // Verify hotelId matches
        if (tokenHotelId !== hotelId) {
            throw new ApiError(400, 'Invalid hotel ID');
        }

        // Create review document
        const review = await Review.create({
            hotelId: new Types.ObjectId(hotelId),
            guestName: guestName.trim(),
            email,
            stayDate: new Date(stayDate),
            rating,
            reviewText: reviewText.trim(),
            isInternal: true,
            emailSent: true,
            createdAt: new Date(),
        });

        // Send notification email asynchronously - don't await
        sendInternalReviewNotification(hotelId, review).catch((error) => {
            logger.error('Failed to send review notification:', error);
        });

        res.status(201).json(review);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error creating review');
    }
});

// Get reviews
router.get('/', auth, async (req, res) => {
    const { hotelId } = req.query;
    const user = req.user as UserDocument;

    // For admin users, require hotelId
    if (user.role === 'admin' && !hotelId) {
        throw new ApiError(400, 'Please select a hotel');
    }

    // For regular users, use their assigned hotel
    if (user.role !== 'admin' && !user.hotel) {
        throw new ApiError(400, 'No hotel assigned to user');
    }

    const targetHotelId = user.role === 'admin' ? hotelId : user.hotel;

    const reviews = await Review.find({
        hotelId: targetHotelId,
        isInternal: true,
    })
        .sort({ createdAt: -1 })
        .lean();

    res.json({ reviews });
});

// Send review requests
router.post('/send-requests', auth, async (req, res) => {
    const { emails, hotelId } = req.body;
    const user = req.user as UserDocument;

    // Admin users must provide a hotelId
    if (user.role === 'admin' && !hotelId) {
        throw new ApiError(400, 'Please select a hotel');
    }

    // Regular users must have an assigned hotel
    if (user.role !== 'admin' && !user.hotel) {
        throw new ApiError(400, 'No hotel assigned to user');
    }

    const targetHotelId = user.role === 'admin' ? hotelId : user.hotel;

    if (!Array.isArray(emails) || emails.length === 0) {
        throw new ApiError(400, 'No email addresses provided');
    }

    const validEmails = validateEmails(emails);
    if (validEmails.length === 0) {
        throw new ApiError(400, 'No valid email addresses provided');
    }

    const hotel = await Hotel.findById(targetHotelId);
    if (!hotel) {
        throw new ApiError(404, 'Hotel not found');
    }

    // Create email batch
    const emailBatch = new EmailBatch({
        hotelId: targetHotelId,
        emails: validEmails.map((email: string) => ({
            email,
            status: 'pending' as const,
        })),
    });

    await emailBatch.save();

    // Process emails
    for (const emailEntry of emailBatch.emails) {
        try {
            // Generate token for this email
            const token = jwt.sign({ email: emailEntry.email, hotelId: targetHotelId }, process.env.JWT_SECRET || 'your-secret-key', {
                expiresIn: '7d',
            });

            await sendReviewRequest(emailEntry.email, hotel.name, hotel._id.toString(), hotel.googleReviewLink || '', token);
            emailEntry.status = 'sent';
            emailEntry.sentAt = new Date();
        } catch (error) {
            emailEntry.status = 'failed';
            emailEntry.error = (error as Error).message;
            logger.error('Error sending review request:', { email: emailEntry.email, error });
        }
    }

    // Update batch status
    emailBatch.status = emailBatch.emails.every((entry) => entry.status === 'sent') ? 'completed' : 'failed';
    emailBatch.completedAt = new Date();
    await emailBatch.save();

    const results = {
        success: emailBatch.emails.filter((entry) => entry.status === 'sent').length,
        failed: emailBatch.emails.filter((entry) => entry.status === 'failed').length,
        batchId: emailBatch._id,
    };

    res.json({
        message: `Review requests processed: ${results.success} sent, ${results.failed} failed`,
        results,
    });
});

// Get email batches
router.get('/email-batches', auth, async (req, res) => {
    const { hotelId } = req.query;
    const user = req.user as UserDocument;

    // For admin users without hotelId, return all batches
    const query = user.role === 'admin' ? (hotelId ? { hotelId } : {}) : { hotelId: user.hotel };

    // Regular users must have an assigned hotel
    if (user.role !== 'admin' && !user.hotel) {
        throw new ApiError(400, 'No hotel assigned to user');
    }

    const batches = await EmailBatch.find(query).sort({ createdAt: -1 }).limit(50).lean();

    const formattedBatches = batches.map((batch) => ({
        _id: batch._id,
        createdAt: batch.createdAt,
        completedAt: batch.completedAt,
        emailCount: batch.emails.length,
        sentCount: batch.emails.filter((entry) => entry.status === 'sent').length,
        failedCount: batch.emails.filter((entry) => entry.status === 'failed').length,
        status: batch.status,
        emails: batch.emails.map((entry) => ({
            email: entry.email,
            status: entry.status,
            sentAt: entry.sentAt,
            error: entry.error,
        })),
    }));

    res.json(formattedBatches);
});

export default router;
