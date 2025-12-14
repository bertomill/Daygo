-- Add Stripe subscription fields to profiles table
-- Run this in your Supabase SQL editor

-- Add subscription columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'canceled', 'past_due')),
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Ensure existing users have default values
UPDATE profiles
SET subscription_tier = 'free', subscription_status = 'inactive'
WHERE subscription_tier IS NULL;
