import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone client singleton
let pineconeInstance: Pinecone | null = null;

// Mock Pinecone index for development without API key
const createMockIndex = () => {
  return {
    upsert: async (vectors) => {
      console.log('MOCK: Pinecone upsert called with', vectors.length, 'vectors');
      return { upsertedCount: vectors.length };
    },
    query: async ({ vector, topK, filter }) => {
      console.log(`MOCK: Pinecone query called with filter:`, filter);
      return { matches: [] };
    },
    deleteOne: async (id) => {
      console.log(`MOCK: Pinecone deleteOne called for ID: ${id}`);
      return {};
    },
    deleteMany: async (ids) => {
      console.log(`MOCK: Pinecone deleteMany called for ${ids.length} IDs`);
      return {};
    }
  };
};

// Initialize Pinecone client
export function getPinecone() {
  if (!pineconeInstance) {
    // Check for API key
    const apiKey = process.env.PINECONE_API_KEY;
    
    if (!apiKey) {
      console.warn('Pinecone API key not found. Using mock implementation for development.');
      // Return a placeholder instance that won't actually be used
      // The mock index will be returned instead
      return {} as Pinecone;
    }
    
    pineconeInstance = new Pinecone({
      apiKey,
    });
  }
  
  return pineconeInstance;
}

// Index name for journal entries
export const JOURNAL_INDEX_NAME = 'journal-embeddings';

// Get or create the journal index
export async function getJournalIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  
  // Return mock index if no API key
  if (!apiKey) {
    console.warn('Using mock Pinecone index (PINECONE_API_KEY not configured)');
    return createMockIndex() as any;
  }
  
  const pinecone = getPinecone();
  
  try {
    // Check if our index exists
    const indexList = await pinecone.listIndexes();
    
    // Create index if it doesn't exist
    if (!indexList.indexes?.some(index => index.name === JOURNAL_INDEX_NAME)) {
      console.log(`Creating new Pinecone index: ${JOURNAL_INDEX_NAME}`);
      
      await pinecone.createIndex({
        name: JOURNAL_INDEX_NAME,
        dimension: 1536, // Dimension for OpenAI embeddings
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1' // Changed from us-west-2 to us-east-1
          }
        }
      });
      
      // Wait for index to initialize
      console.log('Waiting for index to initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Return the index
    return pinecone.index(JOURNAL_INDEX_NAME);
  } catch (error) {
    console.error('Error setting up Pinecone index:', error);
    throw error;
  }
} 