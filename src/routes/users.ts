import express from 'express';
import bcrypt from 'bcryptjs';
import auth from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import User from '../models/User.js';
import { ApiError } from '../lib/error.js';

const router = express.Router();

router.post('/', auth, validate(schemas.createUser), async (req, res) => {
  const { username, email, password, role, hotel } = req.body;
  
  // Check for existing username or email
  const exists = await User.findOne({ 
    $or: [{ username }, { email }] 
  });
  
  if (exists) {
    throw new ApiError(409, 'Username or email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role,
    hotel
  });

  await user.save();
  res.status(201).json({ ...user.toObject(), password: undefined });
});

router.get('/', auth, async (_req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

router.patch('/:id', auth, validate(schemas.updateUser), async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // If updating email, check if it's already in use
    if (updates.email) {
      const existingEmail = await User.findOne({ 
        email: updates.email,
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        throw new ApiError(409, 'Email already in use');
      }
    }
    
    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error updating user');
  }
});

router.delete('/:id', auth, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ message: 'User deleted successfully' });
});

export default router;