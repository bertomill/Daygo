import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleCalendarService } from '@/lib/services/googleCalendar'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const isConnected = await googleCalendarService.isConnected(user.id)
    if (!isConnected) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    const events = await googleCalendarService.getEvents(user.id, date)

    // Transform Google Calendar events to a simpler format
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled',
      description: event.description || null,
      start_time: event.start?.dateTime
        ? new Date(event.start.dateTime).toTimeString().slice(0, 8)
        : '00:00:00',
      end_time: event.end?.dateTime
        ? new Date(event.end.dateTime).toTimeString().slice(0, 8)
        : '23:59:59',
      is_all_day: !event.start?.dateTime,
    }))

    return NextResponse.json({ events: transformedEvents })
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
