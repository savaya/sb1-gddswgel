/*
  # Add Review Analytics Tables and Functions

  1. New Tables
    - `review_analytics`
      - `id` (uuid, primary key)
      - `hotel_id` (uuid, foreign key to hotels)
      - `total_reviews` (integer)
      - `average_rating` (numeric)
      - `response_rate` (numeric)
      - `last_updated` (timestamptz)

  2. Functions
    - `update_review_analytics()`: Updates analytics for a specific hotel
    - `refresh_all_analytics()`: Updates analytics for all hotels

  3. Security
    - Enable RLS on `review_analytics` table
    - Add policies for hotel staff and admins
*/

-- Create review analytics table
CREATE TABLE IF NOT EXISTS review_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  total_reviews integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  response_rate numeric(5,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  CONSTRAINT fk_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- Enable RLS
ALTER TABLE review_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hotel staff can view their hotel's analytics"
  ON review_analytics
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT hotel_id FROM auth.users
      WHERE auth.uid() = id
    )
  );

CREATE POLICY "Admins can manage all analytics"
  ON review_analytics
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

-- Create function to update analytics for a specific hotel
CREATE OR REPLACE FUNCTION update_review_analytics(hotel_id_param uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO review_analytics (hotel_id, total_reviews, average_rating, response_rate)
  SELECT
    hotel_id_param,
    COUNT(*),
    COALESCE(AVG(rating), 0),
    COALESCE((COUNT(CASE WHEN responded_at IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100), 0)
  FROM reviews
  WHERE hotel_id = hotel_id_param
  ON CONFLICT (hotel_id)
  DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    response_rate = EXCLUDED.response_rate,
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to refresh all analytics
CREATE OR REPLACE FUNCTION refresh_all_analytics()
RETURNS void AS $$
DECLARE
  hotel_record RECORD;
BEGIN
  FOR hotel_record IN SELECT id FROM hotels LOOP
    PERFORM update_review_analytics(hotel_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_analytics_hotel_id ON review_analytics(hotel_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_last_updated ON review_analytics(last_updated);

-- Create trigger to update analytics when reviews change
CREATE OR REPLACE FUNCTION trigger_update_review_analytics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_review_analytics(COALESCE(NEW.hotel_id, OLD.hotel_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER review_analytics_update
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_update_review_analytics();