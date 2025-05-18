import OpenAI from 'openai';

// Create OpenAI instance with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default embedding model
const EMBEDDING_MODEL = 'text-embedding-3-small';

// Generate a mock embedding vector for development purposes
function generateMockEmbedding(text: string, dimension: number = 1536): number[] {
  // Use text hash to seed a simple pseudo-random generator
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Create a deterministic but varied vector based on the hash
  const embedding = [];
  for (let i = 0; i < dimension; i++) {
    // Generate a value between -1 and 1 using a simple algorithm
    const value = Math.sin(hash * (i + 1)) / 2;
    embedding.push(value);
  }
  
  // Normalize to unit length (cosine)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Generate embeddings for a single text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. Using mock embeddings for development.');
    return generateMockEmbedding(text);
  }
  
  try {
    // Normalize text: trim whitespace and replace newlines with spaces
    const normalizedText = text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    
    if (!normalizedText) {
      throw new Error('Cannot generate embedding for empty text');
    }
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalizedText,
      encoding_format: 'float',
    });
    
    // Extract the embedding vector
    const embedding = response.data[0]?.embedding;
    
    if (!embedding) {
      throw new Error('Failed to generate embedding: No embedding returned');
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. Using mock embeddings for development.');
    return texts.map(text => generateMockEmbedding(text));
  }
  
  // Filter out empty texts
  const validTexts = texts
    .map(text => text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' '))
    .filter(text => text.length > 0);
  
  if (validTexts.length === 0) {
    return [];
  }
  
  try {
    // Generate embeddings for all texts
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts,
      encoding_format: 'float',
    });
    
    // Extract embedding vectors
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
} 