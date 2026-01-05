import { NextRequest, NextResponse } from 'next/server'
import { googleCalendarService } from '@/lib/services/googleCalendar'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This is the user ID
    const error = searchParams.get('error')

    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(new URL('/today?gcal_error=denied', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/today?gcal_error=missing_params', request.url))
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code)

    // Save tokens to database
    await googleCalendarService.saveTokens(
      state, // user ID from state
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date
    )

    // Redirect back to today page with success message
    return NextResponse.redirect(new URL('/today?gcal_connected=true', request.url))
  } catch (error) {
    console.error('Error in Google Calendar callback:', error)
    return NextResponse.redirect(new URL('/today?gcal_error=exchange_failed', request.url))
  }
}
