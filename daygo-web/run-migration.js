const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function runMigration() {
  console.log('Running migration: add avatar_url to profiles...')

  try {
    // Add avatar_url column
    console.log('1. Adding avatar_url column to profiles table...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    })

    if (alterError && !alterError.message.includes('already exists')) {
      console.error('Error adding column:', alterError)
    } else {
      console.log('✓ avatar_url column added successfully')
    }

    // Create storage bucket
    console.log('2. Creating avatars storage bucket...')
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5242880 // 5MB
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError)
    } else {
      console.log('✓ avatars bucket created successfully')
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nNote: Storage policies need to be set up manually in the Supabase Dashboard:')
    console.log('Go to Storage > avatars > Policies and add the following policies:')
    console.log('- INSERT: bucket_id = \'avatars\' AND auth.uid()::text = (storage.foldername(name))[1]')
    console.log('- UPDATE: bucket_id = \'avatars\' AND auth.uid()::text = (storage.foldername(name))[1]')
    console.log('- DELETE: bucket_id = \'avatars\' AND auth.uid()::text = (storage.foldername(name))[1]')
    console.log('- SELECT: bucket_id = \'avatars\' (public)')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
