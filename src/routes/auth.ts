import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validate, schemas } from '../middleware/validate.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { ApiError } from '../lib/error.js';

const router = express.Router();

router.post('/login', validate(schemas.login), async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ username })
                        .populate('hotel', 'name googleReviewLink');
  
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  res.json({ 
    token, 
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hotel: user.hotel,
      lastLogin: user.lastLogin
    }
  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    throw new ApiError(401, 'No refresh token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { _id: string };
    const user = await User.findById(decoded._id)
                          .populate('hotel', 'name googleReviewLink');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    const newToken = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({ 
      token: newToken, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        hotel: user.hotel,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
});

router.post('/logout', auth, (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

export default router;