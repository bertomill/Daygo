-- Add Stripe customer ID to your profile
-- Find your customer ID in Stripe Dashboard → Customers (starts with cus_)
-- Replace 'cus_XXXXX' below with your actual customer ID, then run in Supabase SQL Editor

UPDATE profiles
SET stripe_customer_id = 'cus_TbFBmuADQfAT1m'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'bertmill19@gmail.com'
);
