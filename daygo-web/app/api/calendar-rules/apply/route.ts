import { NextRequest } from 'next/server'
import OpenAI from 'openai'

// Define the shape of an individual calendar rule from the DB/user
interface CalendarRule {
  id: string
  rule_text: string
  is_active: boolean
  priority: number
}

// Event format for a scheduled event
interface ScheduleEvent {
  title: string
  start_time: string
  end_time: string
  description?: string
}

// User habit definition
interface Habit {
  name: string
  description: string | null
}

// User todo item
interface Todo {
  text: string
  completed: boolean
}

// User goal structure
interface Goal {
  title: string
  description: string | null
}

// User vision statement
interface Vision {
  text: string
}

// User mantra (affirmation)
interface Mantra {
  text: string
}

// User scheduling preferences
interface SchedulingPreferences {
  wake_time: string  // e.g., "07:00"
  bed_time: string   // e.g., "22:00"
}

// Format of the incoming POST request body
interface RequestBody {
  rules: CalendarRule[]           // List of calendar rules the user has
  existingEvents: ScheduleEvent[] // Already scheduled events for the day
  habits: Habit[]                 // User's daily habits
  todos: Todo[]                   // User's todos for the day
  goals: Goal[]                   // User's goals
  visions: Vision[]               // User's vision statements (long term)
  mantras: Mantra[]               // User's mantras/affirmations
  date: string                    // The date being scheduled (YYYY-MM-DD)
  dailyNote?: string              // User's notes about the day (e.g., "dinner with family 6-8pm")
  preferences?: SchedulingPreferences // User's scheduling preferences
}

// The entrypoint for POST requests to this route
export async function POST(request: NextRequest) {
  try {
    // Make sure we have an OpenAI API key in our environment
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Parse JSON body from incoming request
    const body = await request.json() as RequestBody
    const { rules, existingEvents, habits, todos, goals, visions, mantras, date, dailyNote, preferences } = body

    // Default scheduling preferences
    const wakeTime = preferences?.wake_time || '07:00'
    const bedTime = preferences?.bed_time || '22:00'

    // Only use active rules for the AI context, and order by priority (lower comes first)
    const activeRules = rules.filter(r => r.is_active)

    // Prepare a string summarizing all active rules
    const rulesContext = activeRules.length > 0
      ? activeRules
          .sort((a, b) => a.priority - b.priority)
          .map((r, i) => `${i + 1}. ${r.rule_text}`)
          .join('\n')
      : 'No specific rules - plan the day intelligently based on context'

    // Summarize existing events for the day
    const existingEventsContext = existingEvents.length > 0
      ? existingEvents.map(e => `- ${e.title}: ${e.start_time} - ${e.end_time}`).join('\n')
      : 'No existing events - the day is open'

    // Summarize habits for the AI's context
    const habitsContext = habits.length > 0
      ? habits.map(h => `- ${h.name}${h.description ? `: ${h.description}` : ''}`).join('\n')
      : 'No habits defined'

    // Summarize todos (only incomplete)
    const todosContext = todos.length > 0
      ? todos.filter(t => !t.completed).map(t => `- ${t.text}`).join('\n')
      : 'No pending todos'

    // Number of completed todos (for context)
    const completedTodosContext = todos.filter(t => t.completed).length

    // Summarize goals
    const goalsContext = goals.length > 0
      ? goals.map(g => `- ${g.title}${g.description ? `: ${g.description}` : ''}`).join('\n')
      : 'No goals defined'

    // Summarize user visions
    const visionsContext = visions.length > 0
      ? visions.map(v => `- ${v.text}`).join('\n')
      : 'No visions defined'

    // Summarize mantras (affirmations)
    const mantrasContext = mantras.length > 0
      ? mantras.map(m => `- "${m.text}"`).join('\n')
      : 'No mantras defined'

    // This is the "system" prompt for OpenAI
    const systemPrompt = `You are a daily planner AI. Create a schedule based on the user's habits, todos, goals, visions, and daily mantras.

IMPORTANT: ALWAYS create a schedule that fills the ENTIRE day from wake time to bed time. Ignore the current time - schedule ALL time slots even if they appear to be "in the past." The user wants a complete day plan.

CONSTRAINTS:
1. Only schedule between ${wakeTime} and ${bedTime} (user's wake and bed times)
2. Fill the entire day from wake time to bed time
3. NEVER overlap with existing events
4. Use 30-minute increments ONLY (e.g., 09:00, 09:30, 10:00)
5. PREFER larger time blocks (1-4 hours) for focused work - use 30-minute blocks only for short tasks like meals, breaks, or quick activities
6. DO NOT create "Break" events - gaps between events ARE the breaks
7. Schedule time for ALL habits - they are the user's daily commitments
8. Work towards the user's goals and vision
9. Let the user's daily mantras guide the tone and focus of the day

RESPONSE FORMAT:
Respond with ONLY a valid JSON array. No explanation, no markdown, no code blocks.
Each event:
- "title": string (clear, action-oriented name)
- "start_time": "HH:MM:00" (24-hour format, 30-min increments only)
- "end_time": "HH:MM:00" (24-hour format, 30-min increments only)
- "description": string (optional, brief context)

Example: [{"title": "Deep Work", "start_time": "09:00:00", "end_time": "10:30:00"}]

NEVER return an empty array unless ALL time slots are filled.`

    // This is the "user" prompt for OpenAI, which provides all relevant context for the day
    const userPrompt = `Today's date: ${date}
Wake time: ${wakeTime} | Bed time: ${bedTime}

=== EXISTING EVENTS (DO NOT OVERLAP) ===
${existingEventsContext}

=== TODAY'S NOTES (IMPORTANT CONTEXT - schedule around these) ===
${dailyNote || 'No specific notes for today'}

=== TODAY'S TODOS ===
${todosContext}
${completedTodosContext > 0 ? `(${completedTodosContext} already completed today)` : ''}

=== HABITS (schedule time for these) ===
${habitsContext}

=== GOALS ===
${goalsContext}

=== VISION ===
${visionsContext}

=== TODAY'S MANTRAS (user's focus for the day) ===
${mantrasContext}

Create a schedule from ${wakeTime} to ${bedTime}. Respond with only a JSON array.`

    // Logging what we're about to send to OpenAI
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

    // Call the OpenAI Chat Completion API
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',   // Use GPT-5.2 model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 4000, // Large enough to cover full schedules
      temperature: 0.5,            // Some randomness, but not too much
    })

    // Log the full OpenAI completion response
    console.log('Full completion response:', JSON.stringify(completion, null, 2))
    // Extract the text portion of the result
    const responseText = completion.choices[0]?.message?.content || '[]'
    console.log('OpenAI response:', responseText)

    // Parse the JSON response, which should be an array schedule
    let events: ScheduleEvent[] = []
    try {
      // Remove common Markdown/formatting code blocks (defensive against AI outputs)
      let cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      console.log('Cleaned response:', cleanedResponse)

      // Extract the first JSON array found in the string
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0])
        console.log('Parsed events:', events.length)
      } else {
        console.log('No JSON array found in response')
      }
    } catch (parseError) {
      // If anything goes wrong parsing, notify the client but don't 500
      console.error('Failed to parse AI response:', responseText, parseError)
      return new Response(
        JSON.stringify({ error: 'Failed to parse scheduling response', events: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Normalize and validate all proposed events
    // - Add :00 seconds if missing in start_time or end_time
    // - Drop events with bad/missing fields, wrong order, or bad time formats
    const validEvents = events.map(event => {
      // Ensure time fields are in "HH:MM:00" format
      let startTime = event.start_time
      let endTime = event.end_time

      // If time is in HH:MM only, expand to HH:MM:00
      if (startTime && /^\d{1,2}:\d{2}$/.test(startTime)) {
        startTime = startTime.padStart(5, '0') + ':00'
      }
      if (endTime && /^\d{1,2}:\d{2}$/.test(endTime)) {
        endTime = endTime.padStart(5, '0') + ':00'
      }

      return { ...event, start_time: startTime, end_time: endTime }
    }).filter(event => {
      // Drop events with missing required fields
      if (!event.title || !event.start_time || !event.end_time) {
        console.log('Invalid event (missing fields):', event)
        return false
      }
      // Drop events with malformed time strings
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:00$/
      if (!timeRegex.test(event.start_time) || !timeRegex.test(event.end_time)) {
        console.log('Invalid event (bad time format):', event)
        return false
      }
      // Drop events where end is BEFORE OR EQUAL TO start
      if (event.start_time >= event.end_time) {
        console.log('Invalid event (end before start):', event)
        return false
      }
      return true
    })

    // Remove any overlapping events (prefer keeping earlier ones)
    const nonOverlappingEvents: typeof validEvents = []
    // Sort chronologically by start_time
    for (const event of validEvents.sort((a, b) => a.start_time.localeCompare(b.start_time))) {
      // Check if overlaps with another event already added
      const overlaps = nonOverlappingEvents.some(existing => {
        // Events overlap if their times are not strictly apart
        return (event.start_time < existing.end_time && event.end_time > existing.start_time)
      })
      // Check overlap with original existing (user-supplied) events too
      const overlapsExisting = existingEvents.some(existing => {
        return (event.start_time < existing.end_time && event.end_time > existing.start_time)
      })
      if (!overlaps && !overlapsExisting) {
        nonOverlappingEvents.push(event)
      } else {
        console.log('Removed overlapping event:', event.title, event.start_time, '-', event.end_time)
      }
    }

    // Final response: Only non-overlapping, valid events
    console.log('Returning', nonOverlappingEvents.length, 'non-overlapping events')
    return new Response(
      JSON.stringify({
        events: nonOverlappingEvents,  // The AI-generated, validated, non-overlapping schedule
        debug: {                      // Debugging info for the frontend/client
          rawResponse: responseText.substring(0, 500), // Truncated for big completions
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
    // On any unhandled/internal error, return a generic message and 500 status
    console.error('Error applying calendar rules:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to apply rules: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
