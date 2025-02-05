import nodemailer from 'nodemailer';
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

        const positiveLink = googleReviewLink || `${process.env.VITE_APP_URL}/review/external/${hotelId}`;
        const negativeLink = `${process.env.VITE_APP_URL}/review?hotel=${hotelId}`;

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

export const sendInternalReviewNotification = async (
    hotelId: string,
    review: { guestName: string; stayDate: Date; rating: number; reviewText: string; email?: string },
) => {
    try {
        const transporter = createTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        if (!from) {
            throw new ApiError(500, 'Missing SMTP_FROM configuration');
        }

        const mailOptions = {
            from,
            to: from, // Send to admin email
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

            ${
                review.email
                    ? `
            <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin: 0 0 5px;">Guest Email:</p>
                <p style="margin: 0;">${review.email}</p>
            </div>
            `
                    : ''
            }

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
