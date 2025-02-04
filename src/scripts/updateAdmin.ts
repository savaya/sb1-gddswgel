import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from '../models/User.js';
import connectDB from '../lib/db.js';

config();

const updateAdminUser = async () => {
  try {
    await connectDB();
    
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }

    admin.email = 'admin@example.com';
    await admin.save();

    console.log('Admin user updated successfully');
    console.log('Username: admin');
    console.log('Email: admin@example.com');
    
  } catch (error) {
    console.error('Error updating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
};

updateAdminUser();