/*
  # Review System Schema

  1. New Tables
    - `hotels`
      - `id` (uuid, primary key)
      - `name` (text)
      - `google_review_link` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `hotel_id` (uuid, foreign key)
      - `guest_name` (text)
      - `stay_date` (date)
      - `rating` (integer)
      - `review_text` (text)
      - `created_at` (timestamp)
      - `is_internal` (boolean)
      - `email_sent` (boolean)
      - `response_text` (text)
      - `responded_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for hotel staff to manage their own hotel's reviews
    - Add policies for admins to manage all reviews
*/

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  google_review_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  stay_date date NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_internal boolean DEFAULT true,
  email_sent boolean DEFAULT false,
  response_text text,
  responded_at timestamptz,
  CONSTRAINT fk_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- Enable RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for hotels
CREATE POLICY "Hotel staff can view their own hotel"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT hotel_id FROM auth.users
      WHERE auth.uid() = id
    )
  );

CREATE POLICY "Admins can manage all hotels"
  ON hotels
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND role = 'admin'
    )
  );

-- Create policies for reviews
CREATE POLICY "Hotel staff can view their hotel's reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT hotel_id FROM auth.users
      WHERE auth.uid() = id
    )
  );

CREATE POLICY "Hotel staff can respond to their hotel's reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    hotel_id IN (
      SELECT hotel_id FROM auth.users
      WHERE auth.uid() = id
    )
  )
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM auth.users
      WHERE auth.uid() = id
    )
  );

CREATE POLICY "Admins can manage all reviews"
  ON reviews
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_internal ON reviews(is_internal);