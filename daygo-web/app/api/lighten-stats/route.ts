import { NextResponse } from 'next/server'

const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY

export async function GET() {
  try {
    if (!CALENDLY_API_KEY) {
      return NextResponse.json(
        { error: 'Calendly API key not configured' },
        { status: 500 }
      )
    }

    // Get current user to find their URI
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!userResponse.ok) {
      console.error('Calendly user API error:', await userResponse.text())
      return NextResponse.json(
        { error: 'Failed to fetch Calendly user' },
        { status: 500 }
      )
    }

    const userData = await userResponse.json()
    const userUri = userData.resource.uri

    // Get all scheduled events (from Lighten AI start date onwards)
    const now = new Date()
    const lightenStartDate = new Date('2026-02-01')
    const farFuture = new Date('2030-12-31')

    // Fetch events
    const eventsResponse = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${lightenStartDate.toISOString()}&max_start_time=${farFuture.toISOString()}&count=100`,
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!eventsResponse.ok) {
      console.error('Calendly events API error:', await eventsResponse.text())
      return NextResponse.json(
        { error: 'Failed to fetch Calendly events' },
        { status: 500 }
      )
    }

    const eventsData = await eventsResponse.json()
    const events = eventsData.collection || []

    // Count total events
    const totalCalls = events.length

    // Calculate MoM: count events this month vs last month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const thisMonthCalls = events.filter((e: { start_time: string }) => {
      const eventDate = new Date(e.start_time)
      return eventDate >= startOfThisMonth
    }).length

    const lastMonthCalls = events.filter((e: { start_time: string }) => {
      const eventDate = new Date(e.start_time)
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
    console.error('Lighten stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Lighten stats' },
      { status: 500 }
    )
  }
}
