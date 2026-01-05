const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupPolicies() {
  console.log('Setting up storage policies for avatars bucket...\n')

  const policies = [
    {
      name: 'Users can upload their own avatar',
      action: 'INSERT',
      definition: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]"
    },
    {
      name: 'Users can update their own avatar',
      action: 'UPDATE',
      definition: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]"
    },
    {
      name: 'Users can delete their own avatar',
      action: 'DELETE',
      definition: "bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]"
    },
    {
      name: 'Anyone can view avatars',
      action: 'SELECT',
      definition: "bucket_id = 'avatars'"
    }
  ]

  console.log('⚠️  Note: Storage policies must be created via the Supabase Dashboard SQL editor.\n')
  console.log('Please run this SQL in the dashboard:\n')
  console.log('---')

  policies.forEach(policy => {
    const sql = `
CREATE POLICY "${policy.name}"
ON storage.objects FOR ${policy.action}
TO ${policy.action === 'SELECT' ? 'public' : 'authenticated'}
${policy.action === 'INSERT' ? 'WITH CHECK' : 'USING'} (${policy.definition});`
    console.log(sql)
  })

  console.log('---\n')
  console.log('Dashboard URL: https://app.supabase.com/project/kwcnpjvhdqwzkmtwypnt/sql/new')
}

setupPolicies()
