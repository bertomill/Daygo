import { NextRequest } from 'next/server'

// ElevenLabs voice IDs
const ELEVENLABS_VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM',    // Calm, warm female
  bella: 'EXAVITQu4vr4xnSDxMaL',     // Soft female
  antoni: 'ErXwobaYiN019PkySvjV',    // Warm male
  arnold: 'VR6AewLTigWG4xSOukaG',    // Deep male
  adam: 'pNInz6obpgDQGcFmaJgB',      // Deep male
  domi: 'AZnzlk1XvdvUeBnXmlld',      // Strong female
  elli: 'MF3mGyEYCl7XYWbV9V6O',      // Young female
  josh: 'TxGEqnHWrfWFTfGW9XjX',      // Deep male
  sam: 'yoZ06aMxZJJ28mfd3POQ',       // Raspy male
} as const

type Voice = keyof typeof ELEVENLABS_VOICES

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { visions, voice = 'rachel', speed = 1.0 } = await request.json() as {
      visions: { text: string }[]
      voice?: Voice
      speed?: number
    }

    if (!visions || visions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No visions provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get voice ID (default to rachel)
    const voiceId = ELEVENLABS_VOICES[voice] || ELEVENLABS_VOICES.rachel

    // Map speed to stability (lower speed = higher stability for slower speech)
    const stability = Math.min(1.0, Math.max(0.0, 1.1 - speed))

    // Transform visions: strip HTML and convert first-person to second-person
    const transformedVisions = visions.map(v => {
      let text = v.text.replace(/<[^>]*>/g, '')
      text = text
        .replace(/\bI'm\b/gi, 'You are')
        .replace(/\bI am\b/gi, 'You are')
        .replace(/\bI\b/g, 'You')
        .replace(/\bmy\b/gi, 'your')
        .replace(/\bme\b/gi, 'you')
      return text
    })

    // Create the script with pauses between each
    const script = transformedVisions.join('. ... ')

    // Generate audio using ElevenLabs TTS
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: `ElevenLabs error: ${response.status} - ${errorText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return the audio directly as a stream
    const buffer = Buffer.from(await response.arrayBuffer())

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
