import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.MAKERSLOUNGE_SUPABASE_URL
    const supabaseKey = process.env.MAKERSLOUNGE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Makerslounge Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get count of all profiles
    const { count: totalCount, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Makerslounge Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch Makerslounge data', details: error.message },
        { status: 500 }
      )
    }

    // Calculate MoM growth: total users now vs total users 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Total users 30 days ago (users created before that date)
    const { count: usersThirtyDaysAgo } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo.toISOString())

    // Calculate MoM growth in total users
    let momChange: number | null = null
    if (usersThirtyDaysAgo && usersThirtyDaysAgo > 0) {
      momChange = (((totalCount || 0) - usersThirtyDaysAgo) / usersThirtyDaysAgo) * 100
      momChange = Math.round(momChange * 10) / 10
    }

    return NextResponse.json({
      memberCount: totalCount ?? 0,
      usersThirtyDaysAgo: usersThirtyDaysAgo || 0,
      momChange,
    })
  } catch (error) {
    console.error('Makerslounge stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
