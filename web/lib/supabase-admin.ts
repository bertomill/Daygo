import { createClient } from '@supabase/supabase-js'

// Admin client for server-side operations (bypasses RLS)
// Using untyped client to avoid type conflicts with dynamic updates
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
