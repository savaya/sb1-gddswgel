import { Types } from 'mongoose';

export interface MongoBaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserDocument extends MongoBaseDocument {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  hotel?: Types.ObjectId;
  lastLogin: Date;
}

export interface HotelDocument extends MongoBaseDocument {
  name: string;
  googleReviewLink?: string;
}

export interface ReviewDocument {
  _id?: Types.ObjectId;
  hotelId: Types.ObjectId;
  guestName: string;
  email?: string;
  stayDate: Date;
  rating: number;
  reviewText: string;
  isInternal: boolean;
  emailSent: boolean;
  responseText?: string;
  respondedAt?: Date;
  createdAt: Date;
}

export interface EmailEntryDocument {
  _id: Types.ObjectId;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
}

export interface EmailBatchDocument extends MongoBaseDocument {
  hotelId: Types.ObjectId;
  emails: EmailEntryDocument[];
  completedAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}