import { NextRequest } from 'next/server'
import OpenAI from 'openai'

interface CalendarRule {
  id: string
  rule_text: string
  is_active: boolean
  priority: number
}

interface ScheduleEvent {
  title: string
  start_time: string
  end_time: string
  description?: string
}

interface Habit {
  name: string
  description: string | null
}

interface Todo {
  text: string
  completed: boolean
}

interface Goal {
  title: string
  description: string | null
}

interface Vision {
  text: string
}

interface Mantra {
  text: string
}

interface RequestBody {
  rules: CalendarRule[]
  existingEvents: ScheduleEvent[]
  habits: Habit[]
  todos: Todo[]
  goals: Goal[]
  visions: Vision[]
  mantras: Mantra[]
  date: string
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

    const body = await request.json() as RequestBody
    const { rules, existingEvents, habits, todos, goals, visions, mantras, date } = body

    // Filter only active rules
    const activeRules = rules.filter(r => r.is_active)

    // Build context for the AI
    const rulesContext = activeRules.length > 0
      ? activeRules
          .sort((a, b) => a.priority - b.priority)
          .map((r, i) => `${i + 1}. ${r.rule_text}`)
          .join('\n')
      : 'No specific rules - plan the day intelligently based on context'

    const existingEventsContext = existingEvents.length > 0
      ? existingEvents.map(e => `- ${e.title}: ${e.start_time} - ${e.end_time}`).join('\n')
      : 'No existing events - the day is open'

    const habitsContext = habits.length > 0
      ? habits.map(h => `- ${h.name}${h.description ? `: ${h.description}` : ''}`).join('\n')
      : 'No habits defined'

    const todosContext = todos.length > 0
      ? todos.filter(t => !t.completed).map(t => `- ${t.text}`).join('\n')
      : 'No pending todos'

    const completedTodosContext = todos.filter(t => t.completed).length

    const goalsContext = goals.length > 0
      ? goals.map(g => `- ${g.title}${g.description ? `: ${g.description}` : ''}`).join('\n')
      : 'No goals defined'

    const visionsContext = visions.length > 0
      ? visions.map(v => `- ${v.text}`).join('\n')
      : 'No visions defined'

    const mantrasContext = mantras.length > 0
      ? mantras.map(m => `- "${m.text}"`).join('\n')
      : 'No mantras defined'

    const systemPrompt = `You are an intelligent daily planner AI. Your job is to create a productive, balanced day schedule based on the user's context - their vision, goals, habits, todos, and any specific scheduling rules.

IMPORTANT: ALWAYS create a schedule. Even if the user has minimal context, create a productive day structure.

PLANNING PHILOSOPHY:
- Create a realistic, achievable schedule that respects human energy levels
- Morning (6-12): Best for focused, creative, or challenging work
- Early afternoon (12-2): Good for lunch and lighter tasks
- Afternoon (2-5): Good for collaborative work, meetings, or routine tasks
- Evening (5-10): Wind down, exercise, personal time, reflection

SCHEDULING RULES:
1. Only schedule between 6:00 AM (06:00:00) and 10:00 PM (22:00:00)
2. NEVER overlap with existing events
3. Use 30-minute increments ONLY (e.g., 09:00, 09:30, 10:00, 10:30)
4. MINIMUM event duration is 30 minutes - NO shorter events
5. DO NOT create "Break" events - gaps between events ARE the breaks
6. Schedule todos as focused work blocks (30-90 min each)
7. Consider habits when planning - if they have a habit, schedule time for it
8. Align work blocks with their goals and vision
9. Leave gaps between events for natural breaks and transitions

EVENT DURATIONS (all must be 30+ minutes):
- Focused work: 60-90 minutes
- Exercise/habits: 30-60 minutes
- Meals: 30-45 minutes
- Quick tasks: 30 minutes minimum

RESPONSE FORMAT:
Respond with ONLY a valid JSON array. No explanation, no markdown, no code blocks.
Each event:
- "title": string (clear, action-oriented name - NOT "Break")
- "start_time": "HH:MM:00" (24-hour format, 30-min increments only: 00 or 30)
- "end_time": "HH:MM:00" (24-hour format, 30-min increments only: 00 or 30)
- "description": string (optional, brief context)

Example response (just the array, nothing else):
[{"title": "Morning Focus Block", "start_time": "09:00:00", "end_time": "10:30:00", "description": "Deep work session"}, {"title": "Lunch", "start_time": "12:00:00", "end_time": "12:30:00"}]

NEVER return an empty array unless ALL time slots are already filled with existing events.`

    const userPrompt = `Today's date: ${date}

=== USER'S VISION (their bigger picture) ===
${visionsContext}

=== USER'S MANTRAS (their daily affirmations) ===
${mantrasContext}

=== USER'S GOALS (what they're working toward) ===
${goalsContext}

=== USER'S HABITS (daily practices to maintain) ===
${habitsContext}

=== TODAY'S TODOS (tasks to complete) ===
${todosContext}
${completedTodosContext > 0 ? `(${completedTodosContext} already completed today)` : ''}

=== EXISTING EVENTS (DO NOT OVERLAP) ===
${existingEventsContext}

=== SCHEDULING PREFERENCES/RULES ===
${rulesContext}

Based on all this context, create a productive day schedule. Consider their vision and goals when prioritizing tasks. Schedule their habits at appropriate times. Create focused work blocks for their todos. Remember to only respond with a JSON array.`

    console.log('Calling OpenAI to plan day...')
    console.log('Context:', {
      rulesCount: activeRules.length,
      existingEventsCount: existingEvents.length,
      habitsCount: habits.length,
      todosCount: todos.length,
      goalsCount: goals.length,
      visionsCount: visions.length,
      mantrasCount: mantras.length,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 4000,
      temperature: 0.5,
    })

    console.log('Full completion response:', JSON.stringify(completion, null, 2))
    const responseText = completion.choices[0]?.message?.content || '[]'
    console.log('OpenAI response:', responseText)

    // Parse the JSON response
    let events: ScheduleEvent[] = []
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      console.log('Cleaned response:', cleanedResponse)

      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0])
        console.log('Parsed events:', events.length)
      } else {
        console.log('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText, parseError)
      return new Response(
        JSON.stringify({ error: 'Failed to parse scheduling response', events: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Normalize and validate events
    const validEvents = events.map(event => {
      // Normalize time format - add :00 seconds if missing
      let startTime = event.start_time
      let endTime = event.end_time

      // If time is in HH:MM format, add :00
      if (startTime && /^\d{1,2}:\d{2}$/.test(startTime)) {
        startTime = startTime.padStart(5, '0') + ':00'
      }
      if (endTime && /^\d{1,2}:\d{2}$/.test(endTime)) {
        endTime = endTime.padStart(5, '0') + ':00'
      }

      return { ...event, start_time: startTime, end_time: endTime }
    }).filter(event => {
      if (!event.title || !event.start_time || !event.end_time) {
        console.log('Invalid event (missing fields):', event)
        return false
      }
      // Validate time format (with or without leading zero)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:00$/
      if (!timeRegex.test(event.start_time) || !timeRegex.test(event.end_time)) {
        console.log('Invalid event (bad time format):', event)
        return false
      }
      // Ensure end is after start
      if (event.start_time >= event.end_time) {
        console.log('Invalid event (end before start):', event)
        return false
      }
      return true
    })

    // Remove overlapping events (keep earlier ones)
    const nonOverlappingEvents: typeof validEvents = []
    for (const event of validEvents.sort((a, b) => a.start_time.localeCompare(b.start_time))) {
      const overlaps = nonOverlappingEvents.some(existing => {
        // Check if event overlaps with existing
        return (event.start_time < existing.end_time && event.end_time > existing.start_time)
      })
      // Also check against original existing events
      const overlapsExisting = existingEvents.some(existing => {
        return (event.start_time < existing.end_time && event.end_time > existing.start_time)
      })
      if (!overlaps && !overlapsExisting) {
        nonOverlappingEvents.push(event)
      } else {
        console.log('Removed overlapping event:', event.title, event.start_time, '-', event.end_time)
      }
    }

    console.log('Returning', nonOverlappingEvents.length, 'non-overlapping events')
    return new Response(
      JSON.stringify({
        events: nonOverlappingEvents,
        debug: {
          rawResponse: responseText.substring(0, 500),
          parsedCount: events.length,
          validCount: validEvents.length,
          context: {
            rules: activeRules.length,
            existingEvents: existingEvents.length,
            habits: habits.length,
            todos: todos.length,
            goals: goals.length,
            visions: visions.length,
            mantras: mantras.length,
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error applying calendar rules:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to apply rules: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
