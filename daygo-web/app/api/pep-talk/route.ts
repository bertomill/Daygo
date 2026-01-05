import { NextRequest } from 'next/server'
import OpenAI from 'openai'

interface Goal {
  title: string
  description: string | null
  metric_name: string
  metric_current: number
  metric_target: number
  deadline: string | null
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { goals } = await request.json() as { goals: Goal[] }

    if (!goals || goals.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No goals provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const goalsContext = goals.map((goal) => {
      const progress = goal.metric_target > 0
        ? Math.round((goal.metric_current / goal.metric_target) * 100)
        : 0
      const deadlineInfo = goal.deadline
        ? `Deadline: ${goal.deadline}`
        : 'No deadline set'

      return `- "${goal.title}"${goal.description ? `: ${goal.description}` : ''}
  Progress: ${goal.metric_current}/${goal.metric_target} ${goal.metric_name} (${progress}%)
  ${deadlineInfo}`
    }).join('\n')

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a motivational coach. Generate a short, personalized pep talk (2-3 sentences) based on the user's goals and their progress. Be encouraging, specific to their goals, and actionable. Don't use hashtags or emojis. Be direct and warm.`
        },
        {
          role: 'user',
          content: `Here are my current goals:\n${goalsContext}\n\nGive me a pep talk to help me stay motivated today!`
        }
      ],
      max_tokens: 200,
      temperature: 0.8,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Error generating pep talk:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to generate pep talk: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
