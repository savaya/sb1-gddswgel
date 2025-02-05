import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.js';
import logger from './logger.js';

// Create reusable transporter object using SMTP
const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        throw new ApiError(500, 'Missing SMTP configuration');
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
};

export const sendReviewRequest = async (email: string, hotelName: string, hotelId: string, googleReviewLink: string) => {
    try {
        const transporter = createTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        if (!from) {
            throw new ApiError(500, 'Missing SMTP_FROM configuration');
        }

        // Generate a JWT token for the review link
        const token = jwt.sign({ hotelId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

        const reviewLink = `${process.env.VITE_APP_URL}/review?hotel=${hotelId}&token=${token}`;

        const mailOptions = {
            from,
            to: email,
            subject: `How was your stay at ${hotelName}?`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotel Review Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #1a73e8; margin: 0 0 20px;">Share Your Experience</h1>
            
            <p style="margin-bottom: 20px;">Thank you for choosing ${hotelName}. We'd love to hear about your stay!</p>

            <div style="margin-top: 30px; text-align: center;">
                <a href="${googleReviewLink || reviewLink}" 
                   style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500;">
                    Write a Review
                </a>
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #666;">
                If you didn't stay at ${hotelName}, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
      `,
        };

        await transporter.verify();
        await transporter.sendMail(mailOptions);
        logger.info('Review request email sent successfully', { email });
    } catch (error) {
        logger.error('Failed to send email:', error);
        throw new ApiError(500, `Failed to send email: ${(error as Error).message}`);
    }
};

export const sendInternalReviewNotification = async (
    hotelId: string,
    review: { guestName: string; stayDate: Date; rating: number; reviewText: string },
) => {
    try {
        const transporter = createTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        if (!from) {
            throw new ApiError(500, 'Missing SMTP_FROM configuration');
        }

        const mailOptions = {
            from,
            to: from,
            subject: `New Review Received`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Review Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #1a73e8; margin: 0 0 20px;">New Review Received</h1>
            
            <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin: 0 0 5px;">Guest Name:</p>
                <p style="margin: 0;">${review.guestName}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin: 0 0 5px;">Stay Date:</p>
                <p style="margin: 0;">${review.stayDate.toLocaleDateString()}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin: 0 0 5px;">Rating:</p>
                <p style="margin: 0;">${'⭐'.repeat(review.rating)}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin: 0 0 5px;">Review:</p>
                <p style="margin: 0; white-space: pre-wrap;">${review.reviewText}</p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.VITE_APP_URL}/dashboard" 
                   style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500;">
                    View in Dashboard
                </a>
            </div>
        </div>
    </div>
</body>
</html>
      `,
        };

        await transporter.verify();
        await transporter.sendMail(mailOptions);
        logger.info('Review notification email sent successfully', { hotelId });
    } catch (error) {
        logger.error('Failed to send review notification:', error);
        throw new ApiError(500, 'Failed to send review notification');
    }
};
