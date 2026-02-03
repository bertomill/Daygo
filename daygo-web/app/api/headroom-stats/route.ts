import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(request: NextRequest) {
  try {
    const calendarId = process.env.HEADROOM_CALENDAR_ID
    if (!calendarId) {
      return NextResponse.json(
        { error: 'Headroom calendar ID not configured' },
        { status: 500 }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Google tokens for this user
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokens) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      )
    }

    // Check if token needs refresh
    const tokenExpiry = new Date(tokens.token_expiry)
    let accessToken = tokens.access_token

    if (tokenExpiry <= new Date()) {
      oauth2Client.setCredentials({ refresh_token: tokens.refresh_token })
      const { credentials } = await oauth2Client.refreshAccessToken()
      accessToken = credentials.access_token!

      // Save refreshed token
      await supabaseAdmin
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: new Date(credentials.expiry_date!).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }

    oauth2Client.setCredentials({ access_token: accessToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Get all events from the Headroom AI calendar (all time)
    const farPast = new Date('2020-01-01')
    const farFuture = new Date('2030-12-31')

    console.log('Fetching Headroom calendar events for calendar:', calendarId)

    const response = await calendar.events.list({
      calendarId,
      timeMin: farPast.toISOString(),
      timeMax: farFuture.toISOString(),
      singleEvents: true,
      maxResults: 2500,
    })

    const events = response.data.items || []
    console.log('Found events:', events.length)

    // Count total events as "intro calls"
    const totalCalls = events.length

    // Calculate MoM: count events this month vs last month
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const thisMonthCalls = events.filter(e => {
      const eventDate = new Date(e.start?.dateTime || e.start?.date || '')
      return eventDate >= startOfThisMonth
    }).length

    const lastMonthCalls = events.filter(e => {
      const eventDate = new Date(e.start?.dateTime || e.start?.date || '')
      return eventDate >= startOfLastMonth && eventDate <= endOfLastMonth
    }).length

    let momChange: number | null = null
    if (lastMonthCalls > 0) {
      momChange = ((thisMonthCalls - lastMonthCalls) / lastMonthCalls) * 100
      momChange = Math.round(momChange * 10) / 10
    }

    return NextResponse.json({
      totalCalls,
      thisMonthCalls,
      lastMonthCalls,
      momChange,
    })
  } catch (error) {
    console.error('Headroom stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Headroom stats' },
      { status: 500 }
    )
  }
}
