import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleCalendarService } from '@/lib/services/googleCalendar'

interface SyncEventRequest {
  title: string
  date: string
  start_time: string
  end_time: string
  description?: string
}

export async function POST(request: NextRequest) {
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

    const isConnected = await googleCalendarService.isConnected(user.id)
    if (!isConnected) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    const body = await request.json() as SyncEventRequest
    const { title, date, start_time, end_time, description } = body

    if (!title || !date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const googleEvent = await googleCalendarService.createEvent(
      user.id,
      title,
      date,
      start_time,
      end_time,
      description
    )

    return NextResponse.json({
      success: true,
      googleEventId: googleEvent.id
    })
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error)
    return NextResponse.json({ error: 'Failed to sync event' }, { status: 500 })
  }
}
