import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create OpenAI instance with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Add system message for template generation
    const templateMessages = [
      ...messages,
      {
        role: "system",
        content: `Based on the conversation, generate a journal template in JSON format. Include a name, description, and array of fields. Each field should have name, type (text, textarea, boolean, or mantra), label, placeholder, and required properties. Return ONLY valid JSON without extra text.`
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: templateMessages,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '';
    
    // Clean up potential markdown formatting
    const cleanJson = content.replace(/```json|```/g, '').trim();
    
    try {
      // Parse the response to ensure it's valid JSON
      const parsedTemplate = JSON.parse(cleanJson);
      return NextResponse.json({ template: parsedTemplate });
    } catch (parseError) {
      console.error('Error parsing template JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse template JSON', content },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 