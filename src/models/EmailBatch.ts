import mongoose from 'mongoose';
import type { EmailBatchDocument } from '../types/mongodb.js';

const emailBatchSchema = new mongoose.Schema<EmailBatchDocument>({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    index: true
  },
  emails: [{
    email: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    error: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true
  }
});

const EmailBatch = mongoose.model<EmailBatchDocument>('EmailBatch', emailBatchSchema);
export default EmailBatch;