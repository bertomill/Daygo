import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { feedback, userEmail } = await request.json()

    if (!feedback?.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'DayGo Feedback <feedback@daygo.app>',
      to: 'bertmill19@gmail.com',
      subject: `DayGo Feedback from ${userEmail || 'Anonymous User'}`,
      html: `
        <h2>New Feedback from DayGo</h2>
        <p><strong>From:</strong> ${userEmail || 'Anonymous'}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 8px;">
          ${feedback.replace(/\n/g, '<br>')}
        </div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">Sent from DayGo Web App</p>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
