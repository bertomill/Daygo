// Self-contained agent script that runs inside an E2B sandbox.
// It uses the Anthropic SDK with tool use to query Supabase notes.
// Input: JSON string passed as first CLI argument with { messages, userId, systemContext }
// Output: Final assistant response printed to stdout

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const input = JSON.parse(process.argv[2]);
const { messages, userId, systemContext } = input;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const tools: Anthropic.Tool[] = [
  {
    name: 'search_notes',
    description:
      'Search notes by text query matching title or content. Use this when the user asks to find notes about a specific topic or asks general questions about their notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search text to match against note titles and content',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter_notes_by_tags',
    description:
      'Filter notes by one or more tags. Use this when the user asks about notes with specific tags or categories.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to filter by (lowercase)',
        },
      },
      required: ['tags'],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  if (name === 'search_notes') {
    const query = input.query as string;
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, tags, is_starred, created_at, updated_at')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) return JSON.stringify({ error: error.message });

    const notes = (data || []).map((n: any) => ({
      title: n.title,
      content: stripHtml(n.content).substring(0, 500),
      tags: n.tags,
      is_starred: n.is_starred,
      updated_at: n.updated_at,
    }));
    return JSON.stringify({ count: notes.length, notes });
  }

  if (name === 'filter_notes_by_tags') {
    const tags = input.tags as string[];
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, tags, is_starred, created_at, updated_at')
      .eq('user_id', userId)
      .overlaps('tags', tags)
      .order('updated_at', { ascending: false });

    if (error) return JSON.stringify({ error: error.message });

    const notes = (data || []).map((n: any) => ({
      title: n.title,
      content: stripHtml(n.content).substring(0, 500),
      tags: n.tags,
      is_starred: n.is_starred,
      updated_at: n.updated_at,
    }));
    return JSON.stringify({ count: notes.length, notes });
  }

  return JSON.stringify({ error: 'Unknown tool' });
}

async function run() {
  const anthropicMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })
  );

  let iterations = 0;
  const maxIterations = 3;

  while (iterations < maxIterations) {
    iterations++;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemContext,
      tools,
      messages: anthropicMessages,
    });

    // Check if we need to handle tool use
    if (response.stop_reason === 'tool_use') {
      // Add assistant message with all content blocks
      anthropicMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Process each tool use block
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Add tool results as user message
      anthropicMessages.push({
        role: 'user',
        content: toolResults,
      });
    } else {
      // End turn - extract text and print to stdout
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      const finalText = textBlocks.map((b) => b.text).join('');
      process.stdout.write(finalText);
      return;
    }
  }

  // If we hit max iterations, make one final call without tools
  const finalResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemContext,
    messages: anthropicMessages,
  });

  const textBlocks = finalResponse.content.filter(
    (b): b is Anthropic.TextBlock => b.type === 'text'
  );
  process.stdout.write(textBlocks.map((b) => b.text).join(''));
}

run().catch((err) => {
  console.error('Agent error:', err);
  process.exit(1);
});
