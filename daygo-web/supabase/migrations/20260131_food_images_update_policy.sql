-- Add UPDATE policy for food_images table
-- This allows users to update their own food images (e.g., adding labels)

CREATE POLICY "Users can update own food images" ON food_images
  FOR UPDATE USING (auth.uid() = user_id);
