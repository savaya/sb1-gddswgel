import express from 'express';
import auth from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import Hotel from '../models/Hotel.js';
import { ApiError } from '../lib/error.js';

const router = express.Router();

router.post('/', auth, validate(schemas.createHotel), async (req, res) => {
  const hotel = new Hotel(req.body);
  await hotel.save();
  res.status(201).json(hotel);
});

router.get('/', auth, async (_req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
});

router.get('/:id', auth, async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }
  res.json(hotel);
});

router.patch('/:id', auth, async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }
  res.json(hotel);
});

router.delete('/:id', auth, async (req, res) => {
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }
  res.json({ message: 'Hotel deleted successfully' });
});

export default router;