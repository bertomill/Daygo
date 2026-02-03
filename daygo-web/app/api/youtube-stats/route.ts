import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_HANDLE = 'bertovmill'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      )
    }

    // Get user from auth header (optional - for snapshot storage)
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    // Fetch YouTube data
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forHandle=${CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error('YouTube API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch YouTube data', details: errorData },
        { status: 500 }
      )
    }

    const data = await searchResponse.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    const channel = data.items[0]
    const stats = channel.statistics
    const subscriberCount = parseInt(stats.subscriberCount, 10)

    let momChange: number | null = null

    // If user is authenticated, store snapshot and calculate MoM
    if (userId) {
      const today = new Date().toISOString().split('T')[0]

      // Check if we already have a snapshot for today
      const { data: todaySnapshot } = await supabaseAdmin
        .from('metric_snapshots')
        .select('id')
        .eq('user_id', userId)
        .eq('metric_name', 'youtube_subscribers')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .single()

      // Save snapshot if we don't have one for today
      if (!todaySnapshot) {
        await supabaseAdmin
          .from('metric_snapshots')
          .insert({
            user_id: userId,
            metric_name: 'youtube_subscribers',
            value: subscriberCount,
          })
      }

      // Get snapshot from ~30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: oldSnapshot } = await supabaseAdmin
        .from('metric_snapshots')
        .select('value, created_at')
        .eq('user_id', userId)
        .eq('metric_name', 'youtube_subscribers')
        .lte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (oldSnapshot && oldSnapshot.value > 0) {
        momChange = ((subscriberCount - oldSnapshot.value) / oldSnapshot.value) * 100
      }
    }

    return NextResponse.json({
      channelId: channel.id,
      title: channel.snippet?.title,
      subscriberCount,
      videoCount: parseInt(stats.videoCount, 10),
      viewCount: parseInt(stats.viewCount, 10),
      momChange: momChange !== null ? Math.round(momChange * 10) / 10 : null,
    })
  } catch (error) {
    console.error('YouTube stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
