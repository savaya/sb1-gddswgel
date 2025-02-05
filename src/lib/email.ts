import nodemailer from 'nodemailer';
import { ApiError } from './error.js';
import logger from './logger.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import type { ReviewDocument } from '../types/mongodb.js';
import jwt from 'jsonwebtoken';

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

        // Generate token here instead of receiving it as parameter
        const token = jwt.sign(
            {
                hotelId: hotelId.toString(),
                email,
                type: 'review',
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' },
        );

        const positiveLink = googleReviewLink || `${process.env.VITE_APP_URL}/review/external/${hotelId}`;
        const negativeLink = `${process.env.VITE_APP_URL}/review?hotel=${hotelId}&token=${token}`;

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
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 40px auto; padding: 0 20px;">
        <!-- Email Container -->
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
            <!-- Gradient Header with Enhanced Design -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #3b82f6 100%); padding: 45px 40px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 15px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -0.5px;">
                    How was your stay?
                </h1>
                <div style="width: 100px; height: 4px; background: rgba(255,255,255,0.3); margin: 0 auto; border-radius: 2px;"></div>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 40px 30px;">
                <p style="color: #1e293b; font-size: 18px; line-height: 1.6; margin: 0 0 30px; text-align: center; font-weight: 500;">
                    Thank you for choosing <span style="color: #4f46e5; font-weight: 700;">${hotelName}</span>
                </p>

                <p style="color: #64748b; font-size: 16px; text-align: center; margin: 0 0 35px;">
                    We'd love to hear about your experience with us
                </p>

                <!-- Enhanced Rating Buttons -->
                <div style="text-align: center; margin: 0 0 40px;">
                    <div style="margin-bottom: 20px;">
                        <a href="${positiveLink}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #ffffff; padding: 16px 38px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
                            😊 Great Experience
                        </a>
                    </div>
                    <div>
                        <a href="${negativeLink}" style="display: inline-block; background: #ffffff; color: #dc2626; padding: 15px 38px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; border: 2px solid #dc2626; transition: all 0.3s ease;">
                            😔 Could Be Better
                        </a>
                    </div>
                </div>

                <!-- Decorative Element -->
                <div style="text-align: center; margin: 0 0 30px;">
                    <div style="display: inline-block;">
                        <div style="width: 50px; height: 3px; background: linear-gradient(to right, #4f46e5, transparent); display: inline-block;"></div>
                        <div style="width: 3px; height: 3px; background: #4f46e5; display: inline-block; border-radius: 50%; margin: 0 10px;"></div>
                        <div style="width: 50px; height: 3px; background: linear-gradient(to left, #4f46e5, transparent); display: inline-block;"></div>
                    </div>
                </div>

                <!-- Footer -->
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                    This email was sent from ${hotelName}'s guest feedback system.<br>
                    If you didn't stay with us recently, please disregard this message.
                </p>
            </div>
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

export const sendInternalReviewNotification = async (hotelId: string, review: ReviewDocument): Promise<void> => {
    try {
        const hotel = await Hotel.findById(hotelId);
        const hotelUser = await User.findOne({ hotel: hotelId });

        if (!hotel || !hotelUser) {
            throw new ApiError(404, 'Hotel or hotel user not found');
        }

        const transporter = createTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        if (!from) {
            throw new ApiError(500, 'Missing SMTP_FROM configuration');
        }

        const mailOptions = {
            from,
            to: hotelUser.email,
            subject: `New Review for ${hotel.name}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Review Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 40px auto; padding: 0 20px;">
        <!-- Email Container -->
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
            <!-- Enhanced Gradient Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #3b82f6 100%); padding: 45px 40px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 10px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -0.5px;">
                    New Review Received
                </h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0; font-weight: 500;">
                    Guest Feedback for ${hotel.name}
                </p>
                <div style="width: 100px; height: 4px; background: rgba(255,255,255,0.3); margin: 15px auto 0; border-radius: 2px;"></div>
            </div>

            <!-- Review Content -->
            <div style="padding: 40px;">
                <!-- Guest Info Card -->
                <div style="background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 2px 4px rgba(148, 163, 184, 0.05);">
                    <div style="margin-bottom: 25px;">
                        <!-- Guest Name and Icon -->
                        <div style="display: flex; align-items: center; margin-bottom: 20px;">
                            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                                <span style="color: #ffffff; font-size: 24px;">👤</span>
                            </div>
                            <div>
                                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 5px; font-weight: 700;">${review.guestName}</h2>
                                ${
                                    review.email
                                        ? `<p style="color: #64748b; font-size: 14px; margin: 0; font-weight: 500;">${review.email}</p>`
                                        : ''
                                }
                            </div>
                        </div>
                        
                        <!-- Stay Details -->
                        <div style="background: #ffffff; border-radius: 12px; padding: 15px; border: 1px solid rgba(148, 163, 184, 0.1);">
                            <p style="color: #64748b; font-size: 14px; margin: 0; font-weight: 500;">
                                <span style="color: #1e293b; font-weight: 600;">Stay Date:</span> ${new Date(
                                    review.stayDate,
                                ).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    <!-- Enhanced Rating Display -->
                    <div style="margin-bottom: 25px;">
                        <div style="margin-bottom: 12px;">
                            <span style="color: #1e293b; font-weight: 600; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Rating</span>
                        </div>
                        <div style="color: ${review.rating >= 4 ? '#eab308' : '#94a3b8'}; font-size: 28px; letter-spacing: 3px;">
                            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                        </div>
                    </div>

                    <!-- Enhanced Review Text Display -->
                    <div>
                        <div style="margin-bottom: 12px;">
                            <span style="color: #1e293b; font-weight: 600; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Guest Feedback</span>
                        </div>
                        <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border-left: 4px solid #4f46e5; box-shadow: 0 2px 4px rgba(148, 163, 184, 0.05);">
                            <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 0; font-style: italic;">
                                "${review.reviewText}"
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Action Button -->
                <div style="text-align: center;">
                    <a href="${process.env.VITE_APP_URL}/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.3s ease;">
                        View Full Review in Dashboard
                    </a>
                </div>
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
