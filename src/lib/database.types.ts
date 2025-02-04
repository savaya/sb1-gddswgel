import { Types } from 'mongoose';

export interface MongoBaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserDocument extends MongoBaseDocument {
  username: string;
  role: 'admin' | 'user';
  hotel?: Types.ObjectId;
  lastLogin: Date;
}

export interface HotelDocument extends MongoBaseDocument {
  name: string;
  googleReviewLink?: string;
}

export interface ReviewDocument extends MongoBaseDocument {
  hotelId: Types.ObjectId;
  guestName: string;
  stayDate: Date;
  rating: number;
  reviewText: string;
  isInternal: boolean;
  emailSent: boolean;
  responseText?: string;
  respondedAt?: Date;
}