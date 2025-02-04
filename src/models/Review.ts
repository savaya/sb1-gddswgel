import mongoose from 'mongoose';
import type { ReviewDocument } from '../types/mongodb.js';

const reviewSchema = new mongoose.Schema<ReviewDocument>({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    index: true
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  stayDate: {
    type: Date,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  reviewText: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  isInternal: {
    type: Boolean,
    default: true,
    index: true
  },
  emailSent: {
    type: Boolean,
    default: false,
    index: true
  },
  responseText: {
    type: String,
    trim: true
  },
  respondedAt: {
    type: Date,
    sparse: true,
    index: true
  }
});

// Create compound indexes for common queries
reviewSchema.index({ hotelId: 1, createdAt: -1 });
reviewSchema.index({ hotelId: 1, rating: -1 });
reviewSchema.index({ hotelId: 1, isInternal: 1 });

const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);
export default Review;