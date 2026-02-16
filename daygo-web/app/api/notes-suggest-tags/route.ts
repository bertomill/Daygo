import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const { content, title, existingTags, allTags } = await request.json()

    if (!content && !title) {
      return NextResponse.json({ suggestedTags: [] })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const plainContent = content
      ? content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : ''

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You suggest tags for a note. Return a JSON array of up to 5 lowercase tag strings.

The user already uses these tags: ${allTags.length > 0 ? allTags.join(', ') : 'none yet'}

Rules:
- Prefer reusing tags from the user's existing vocabulary when they fit
- Only invent new tags if nothing existing applies
- Tags should be 1-2 words, lowercase, no spaces (use hyphens)
- Do NOT include tags already on this note: ${existingTags.length > 0 ? existingTags.join(', ') : 'none'}
- Return ONLY a JSON array, no other text`,
        },
        {
          role: 'user',
          content: `Title: ${title || 'Untitled'}\n\nContent: ${plainContent.substring(0, 2000)}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    })

    const raw = response.choices[0]?.message?.content?.trim() || '[]'
    let suggestedTags: string[]
    try {
      suggestedTags = JSON.parse(raw)
      if (!Array.isArray(suggestedTags)) suggestedTags = []
      suggestedTags = suggestedTags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase().trim())
        .filter((t) => t.length > 0 && !existingTags.includes(t))
        .slice(0, 5)
    } catch {
      suggestedTags = []
    }

    return NextResponse.json({ suggestedTags })
  } catch (error) {
    console.error('Error suggesting tags:', error)
    return NextResponse.json({ suggestedTags: [] })
  }
}
