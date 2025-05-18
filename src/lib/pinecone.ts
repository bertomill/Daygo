import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone client singleton
let pineconeInstance: Pinecone | null = null;

// Check environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isBuildTime = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PHASE === 'phase-production-build';

// Mock Pinecone index for development without API key
const createMockIndex = () => {
  console.log('Creating mock Pinecone index for development/build');
  return {
    upsert: async (vectors) => {
      console.log('[PINECONE MOCK] Pinecone upsert called with', vectors.length, 'vectors');
      return { upsertedCount: vectors.length };
    },
    query: async ({ vector, topK, filter }) => {
      console.log(`[PINECONE MOCK] Pinecone query called with filter:`, filter);
      return { matches: [] };
    },
    deleteOne: async (id) => {
      console.log(`[PINECONE MOCK] Pinecone deleteOne called for ID: ${id}`);
      return {};
    },
    deleteMany: async (ids) => {
      console.log(`[PINECONE MOCK] Pinecone deleteMany called for ${ids.length} IDs`);
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
      console.warn('[PINECONE] API key not found. Using mock implementation.');
      // Return a placeholder instance that won't actually be used
      // The mock index will be returned instead
      return {} as Pinecone;
    }
    
    try {
      console.log('[PINECONE] Initializing Pinecone client with API key');
      pineconeInstance = new Pinecone({
        apiKey,
      });
      console.log('[PINECONE] Pinecone client initialized successfully');
    } catch (error) {
      console.error('[PINECONE] Error initializing Pinecone client:', error);
      return {} as Pinecone;
    }
  }
  
  return pineconeInstance;
}

// Index name for journal entries
export const JOURNAL_INDEX_NAME = 'journal-embeddings';

// Get or create the journal index
export async function getJournalIndex() {
  console.log('[PINECONE] Getting journal index:', JOURNAL_INDEX_NAME);
  console.log('[PINECONE] Environment:', process.env.NODE_ENV);
  console.log('[PINECONE] Has API key:', !!process.env.PINECONE_API_KEY);
  
  const apiKey = process.env.PINECONE_API_KEY;
  
  // Return mock index if no API key
  if (!apiKey) {
    console.warn('[PINECONE] API key not configured, using mock index');
    return createMockIndex() as any;
  }
  
  // At build time, return mock index
  if (isBuildTime) {
    console.warn('[PINECONE] Build time detected, using mock index');
    return createMockIndex() as any;
  }
  
  try {
    const pinecone = getPinecone();
    
    // Check if our index exists
    console.log('[PINECONE] Checking if index exists');
    const indexList = await pinecone.listIndexes();
    console.log('[PINECONE] Available indexes:', indexList.indexes?.map(i => i.name).join(', ') || 'none');
    
    // Create index if it doesn't exist
    if (!indexList.indexes?.some(index => index.name === JOURNAL_INDEX_NAME)) {
      console.log(`[PINECONE] Creating new index: ${JOURNAL_INDEX_NAME}`);
      
      try {
        await pinecone.createIndex({
          name: JOURNAL_INDEX_NAME,
          dimension: 1536, // Dimension for OpenAI embeddings
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to initialize
        console.log('[PINECONE] Waiting for index to initialize...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('[PINECONE] Index initialization wait complete');
      } catch (createError) {
        console.error('[PINECONE] Error creating index:', createError);
        throw createError;
      }
    }
    
    // Return the index
    console.log('[PINECONE] Returning index:', JOURNAL_INDEX_NAME);
    return pinecone.index(JOURNAL_INDEX_NAME);
  } catch (error) {
    console.error('[PINECONE] Error setting up index:', error);
    
    // In development or build, return mock
    if (isDevelopment || isBuildTime) {
      console.warn('[PINECONE] Returning mock index after error');
      return createMockIndex() as any;
    }
    
    throw error;
  }
} 