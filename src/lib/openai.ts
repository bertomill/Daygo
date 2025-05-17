'use client';

import OpenAI from 'openai';

// Create a single instance of the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export default openai; 