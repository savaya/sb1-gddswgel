import mongoose from 'mongoose';
import type { HotelDocument } from '../types/mongodb.js';

const hotelSchema = new mongoose.Schema<HotelDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  googleReviewLink: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

hotelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for common queries
hotelSchema.index({ name: 1, createdAt: -1 });

const Hotel = mongoose.model<HotelDocument>('Hotel', hotelSchema);
export default Hotel;