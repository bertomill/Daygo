import { NextRequest } from 'next/server'
import OpenAI from 'openai'

type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

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

    const { visions, voice = 'nova', speed = 0.95, name } = await request.json() as {
      visions: { text: string }[]
      voice?: Voice
      speed?: number
      name?: string
    }

    if (!visions || visions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No visions provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate voice
    const validVoices: Voice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const selectedVoice = validVoices.includes(voice) ? voice : 'nova'

    // Validate speed (0.25 to 4.0)
    const selectedSpeed = Math.min(4.0, Math.max(0.25, speed))

    // Personalized greeting
    const greeting = name
      ? `${name}, take a deep breath. ... These are your visions. ... This is who you are becoming. ...`
      : `Take a deep breath. ... These are your visions. ... This is who you are becoming. ...`

    // Transform visions into affirmations
    // Strip HTML tags and convert "I'm" statements to "You are" statements
    const affirmations = visions.map(v => {
      // Remove HTML tags
      let text = v.text.replace(/<[^>]*>/g, '')
      // Convert common first-person patterns to second-person
      text = text
        .replace(/\bI'm\b/gi, 'You are')
        .replace(/\bI am\b/gi, 'You are')
        .replace(/\bI\b/g, 'You')
        .replace(/\bmy\b/gi, 'your')
        .replace(/\bme\b/gi, 'you')
      return text
    })

    // Create inspiring closing message
    const closing = name
      ? `... ${name}, these visions are not dreams. ... They are your destiny. ... Every day, you are stepping into this future. ... Trust the process. ... You've got this.`
      : `... These visions are not dreams. ... They are your destiny. ... Every day, you are stepping into this future. ... Trust the process. ... You've got this.`

    // Create the affirmation script with pauses between each
    const script = `${greeting} ... ${affirmations.join('. ... ')}. ${closing}`

    // Generate audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: script,
      speed: selectedSpeed,
    })

    // Return the audio directly as a stream
    const buffer = Buffer.from(await mp3Response.arrayBuffer())

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating vision TTS:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to generate audio: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
