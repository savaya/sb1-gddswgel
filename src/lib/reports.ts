import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { ReviewDocument } from '../types/mongodb.js';

export const generatePDFReport = async (
  reviews: ReviewDocument[],
  analytics: any,
  hotelName: string
): Promise<Buffer> => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Add report content
    doc.fontSize(20).text(`Review Report - ${hotelName}`, { align: 'center' });
    doc.moveDown();
    
    // Analytics summary
    doc.fontSize(16).text('Analytics Summary');
    doc.fontSize(12)
      .text(`Total Reviews: ${analytics.totalReviews}`)
      .text(`Average Rating: ${analytics.averageRating.toFixed(1)}`)
      .text(`Response Rate: ${analytics.responseRate.toFixed(1)}%`);
    
    doc.moveDown();
    
    // Recent reviews
    doc.fontSize(16).text('Recent Reviews');
    reviews.slice(0, 10).forEach(review => {
      doc.moveDown()
        .fontSize(12)
        .text(`Guest: ${review.guestName}`)
        .text(`Rating: ${review.rating}/5`)
        .text(`Date: ${review.stayDate.toLocaleDateString()}`)
        .text(`Review: ${review.reviewText}`);
    });

    doc.end();
  });
};

export const generateCSVReport = async (
  reviews: ReviewDocument[],
  filePath: string
): Promise<void> => {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'guestName', title: 'Guest Name' },
      { id: 'stayDate', title: 'Stay Date' },
      { id: 'rating', title: 'Rating' },
      { id: 'reviewText', title: 'Review' },
      { id: 'responseText', title: 'Response' },
      { id: 'createdAt', title: 'Created At' }
    ]
  });

  await csvWriter.writeRecords(reviews.map(review => ({
    ...review,
    stayDate: review.stayDate.toISOString().split('T')[0],
    createdAt: review.createdAt.toISOString()
  })));
};