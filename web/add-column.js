require('dotenv').config({ path: '.env.local' })

async function addColumn() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        query: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT'
      })
    }
  )

  const data = await response.text()
  console.log('Response:', data)
}

addColumn().catch(console.error)
