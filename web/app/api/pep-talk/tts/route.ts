import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    const { text, userId, date } = await request.json() as { text: string, userId: string, date: string }

    if (!text || !userId || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, userId, date' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
    })

    // Convert response to buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer())

    // Upload to Supabase Storage
    const fileName = `${userId}/${date}.mp3`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pep-talk-audio')
      .upload(fileName, buffer, {
        contentType: 'audio/mpeg',
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('Error uploading audio:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload audio file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('pep-talk-audio')
      .getPublicUrl(fileName)

    return new Response(
      JSON.stringify({ audioUrl: publicUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating TTS:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to generate audio: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
