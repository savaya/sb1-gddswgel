import mongoose from 'mongoose';
import type { UserDocument } from '../types/mongodb.js';

const userSchema = new mongoose.Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    index: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    index: true
  },
  lastLogin: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create compound indexes for common queries
userSchema.index({ role: 1, hotel: 1 });
userSchema.index({ username: 1, role: 1 });

const User = mongoose.model<UserDocument>('User', userSchema);
export default User;