const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStorageSetup() {
  console.log('Checking storage setup...\n')

  // Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError)
    return
  }

  const avatarsBucket = buckets.find(b => b.id === 'avatars')

  if (avatarsBucket) {
    console.log('✅ Avatars bucket exists')
    console.log('   Public:', avatarsBucket.public)
    console.log('   File size limit:', avatarsBucket.file_size_limit || 'unlimited')
  } else {
    console.log('❌ Avatars bucket NOT found')
    return
  }

  // Try to test upload with service role
  console.log('\nTesting upload permissions...')

  const testFile = Buffer.from('test')
  const testPath = 'test/test.txt'

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(testPath, testFile, { upsert: true })

  if (uploadError) {
    console.log('❌ Upload test failed:', uploadError.message)
  } else {
    console.log('✅ Upload test successful (service role)')

    // Clean up test file
    await supabase.storage.from('avatars').remove([testPath])
  }

  console.log('\n⚠️  Note: You still need to set up RLS policies in the Supabase Dashboard')
  console.log('The policies control what authenticated users can do.')
  console.log('\nCheck policies at: https://app.supabase.com/project/kwcnpjvhdqwzkmtwypnt/storage/policies')
}

checkStorageSetup()
