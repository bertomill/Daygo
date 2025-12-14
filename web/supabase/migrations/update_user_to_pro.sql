-- Update user to Pro status
-- Run this in Supabase SQL Editor

UPDATE profiles
SET
  subscription_tier = 'pro',
  subscription_status = 'active',
  subscription_current_period_end = NOW() + INTERVAL '1 month'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'bertmill19@gmail.com'
);
