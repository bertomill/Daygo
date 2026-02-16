import { NextRequest } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'
import { supabaseAdmin } from '@/lib/supabase-admin'
import fs from 'fs'
import path from 'path'

// Read the agent script at build time so we can inject it into the sandbox
const agentCode = fs.readFileSync(
  path.join(process.cwd(), 'app/api/notes-chat/agent.ts'),
  'utf-8'
)

export async function POST(request: NextRequest) {
  let sbx: Sandbox | null = null

  try {
    if (!process.env.E2B_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'E2B API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages, userId } = await request.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all tags for system context
    const { data: tagsData } = await supabaseAdmin
      .from('notes')
      .select('tags')
      .eq('user_id', userId)

    const allTags = [...new Set((tagsData || []).flatMap((n: any) => n.tags || []))].sort()

    const systemContext = `You are a helpful notes assistant. The user has a collection of personal notes and you can search through them using the tools available to you.

Available tags in the user's notes: ${allTags.length > 0 ? allTags.join(', ') : 'No tags yet'}

When the user asks about their notes, use the appropriate tool to find relevant notes. Summarize what you find clearly and concisely. If no notes match, let them know. Don't use excessive emojis. Be conversational and helpful.`

    // Create E2B sandbox
    sbx = await Sandbox.create({
      envs: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    })

    // Install dependencies in the sandbox
    await sbx.commands.run('npm install @anthropic-ai/sdk @supabase/supabase-js tsx', {
      timeoutMs: 60000,
    })

    // Write the agent script into the sandbox
    await sbx.files.write('/home/user/agent.ts', agentCode)

    // Prepare input for the agent
    const agentInput = JSON.stringify({ messages, userId, systemContext })

    // Run the agent script - escape the JSON for shell safety
    const result = await sbx.commands.run(
      `npx tsx /home/user/agent.ts '${agentInput.replace(/'/g, "'\\''")}'`,
      { timeoutMs: 120000 }
    )

    // Kill sandbox
    await sbx.kill()
    sbx = null

    const output = result.stdout || ''

    if (result.exitCode !== 0) {
      console.error('Agent stderr:', result.stderr)
      return new Response(
        JSON.stringify({ error: 'Agent failed: ' + (result.stderr || 'Unknown error') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the output back to the client
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(output))
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
    // Clean up sandbox on error
    if (sbx) {
      try {
        await sbx.kill()
      } catch {
        // Ignore cleanup errors
      }
    }

    console.error('Error in notes chat:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to process chat: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
