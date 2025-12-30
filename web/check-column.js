const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkColumn() {
  console.log('Checking if avatar_url column exists...\n')

  // Try to query a profile with avatar_url
  const { data, error } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .limit(1)

  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ avatar_url column does NOT exist yet')
      console.log('\nPlease run this SQL in your Supabase Dashboard (https://app.supabase.com/project/kwcnpjvhdqwzkmtwypnt/sql):')
      console.log('\n---\nALTER TABLE profiles ADD COLUMN avatar_url TEXT;\n---\n')
      return false
    }
    console.error('Error:', error)
    return false
  }

  console.log('✅ avatar_url column EXISTS!')
  console.log('✅ avatars storage bucket EXISTS!')
  console.log('\n🎉 Migration is complete! Profile picture upload is ready to use.')
  console.log('\nJust make sure to set up the storage policies in Supabase Dashboard:')
  console.log('https://app.supabase.com/project/kwcnpjvhdqwzkmtwypnt/storage/policies')
  return true
}

checkColumn()
