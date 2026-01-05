const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProfileAvatar() {
  console.log('Fetching all profiles with avatar_url...\n')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, avatar_url')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No profiles found')
    return
  }

  console.log('Profiles found:', data.length)
  data.forEach((profile, index) => {
    console.log(`\nProfile ${index + 1}:`)
    console.log('  ID:', profile.id)
    console.log('  Avatar URL:', profile.avatar_url || '(null)')
  })

  // Check storage files
  console.log('\n\nChecking storage files...')
  const { data: files, error: filesError } = await supabase.storage
    .from('avatars')
    .list()

  if (filesError) {
    console.error('Storage error:', filesError)
    return
  }

  if (files && files.length > 0) {
    console.log('\nFiles in avatars bucket:')
    files.forEach(file => {
      console.log('  -', file.name)
    })

    // List files in subdirectories
    for (const file of files) {
      if (file.id === null) { // It's a folder
        const { data: subFiles } = await supabase.storage
          .from('avatars')
          .list(file.name)

        if (subFiles && subFiles.length > 0) {
          console.log(`\n  Files in ${file.name}/:`)
          subFiles.forEach(subFile => {
            console.log('    -', subFile.name)
          })
        }
      }
    }
  } else {
    console.log('No files found in avatars bucket')
  }
}

checkProfileAvatar()
