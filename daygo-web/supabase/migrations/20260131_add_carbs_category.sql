-- Add 'carbs' to the food_images category constraint

-- Drop the existing constraint
ALTER TABLE food_images DROP CONSTRAINT IF EXISTS food_images_category_check;

-- Add the new constraint with 'carbs' included
ALTER TABLE food_images ADD CONSTRAINT food_images_category_check
  CHECK (category IN ('plants', 'meats', 'fish', 'carbs', 'fruit', 'superfoods'));
