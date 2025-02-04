import nodemailer from 'nodemailer';
import { ApiError } from './error.js';
import logger from './logger.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import type { ReviewDocument } from '../types/mongodb.js';

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

export const sendReviewRequest = async (
  email: string,
  hotelName: string,
  hotelId: string,
  googleReviewLink: string
): Promise<void> => {
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
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a73e8; font-size: 24px; margin: 0;">How was your stay?</h1>
              <p style="color: #202124; font-size: 18px; margin-top: 10px;">
                Thank you for choosing ${hotelName}
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <p style="color: #5f6368; font-size: 16px; margin-bottom: 20px;">
                We'd love to hear about your experience
              </p>
              
              <div style="margin: 30px 0;">
                <a href="${positiveLink}" style="display: inline-block; background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 0 10px; font-weight: 500;">
                  😊 Great Experience
                </a>
                
                <a href="${negativeLink}" style="display: inline-block; background-color: #ea4335; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 0 10px; font-weight: 500;">
                  😔 Could Be Better
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8eaed;">
              <p style="color: #5f6368; font-size: 12px;">
                This email was sent by ${hotelName}'s review management system.<br>
                If you did not stay at our hotel, please ignore this email.
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
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a73e8; font-size: 24px; margin: 0;">New Review Received</h1>
              <p style="color: #202124; font-size: 18px; margin-top: 10px;">
                A guest has shared their feedback about ${hotel.name}
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #202124;">Guest Name:</strong>
                <span style="color: #5f6368;">${review.guestName}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #202124;">Rating:</strong>
                <span style="color: ${review.rating >= 4 ? '#34a853' : '#ea4335'};">
                  ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                </span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #202124;">Stay Date:</strong>
                <span style="color: #5f6368;">${review.stayDate.toLocaleDateString()}</span>
              </div>
              
              <div>
                <strong style="color: #202124;">Review:</strong>
                <p style="color: #5f6368; margin: 10px 0; line-height: 1.5;">
                  ${review.reviewText}
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.VITE_APP_URL}/dashboard" 
                 style="display: inline-block; background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500;">
                View in Dashboard
              </a>
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