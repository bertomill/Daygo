-- Add onboarding_completed field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have onboarding completed (they're already using the app)
UPDATE profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;
