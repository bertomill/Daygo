"use server";

import { JournalEntry } from "@/types/journal";
import { generateEmbedding } from "@/lib/embeddings";
import { getJournalIndex } from "@/lib/pinecone";
import { getAllJournalEntries } from "@/services/journalService";

/**
 * Helper function to sanitize metadata for Pinecone
 * Converts null or undefined values to strings to prevent Pinecone errors
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string | number | boolean | string[]> {
  const sanitized: Record<string, string | number | boolean | string[]> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      sanitized[key] = 'none';
    } else if (Array.isArray(value)) {
      // Ensure array only contains strings
      sanitized[key] = value.map(item => String(item));
    } else if (typeof value === 'object') {
      // Convert objects to string (not ideal but prevents errors)
      sanitized[key] = JSON.stringify(value);
    } else {
      sanitized[key] = value as string | number | boolean;
    }
  }
  
  return sanitized;
}

/**
 * Create or update a vector record in Pinecone for a journal entry
 */
export async function upsertJournalEmbedding(journalEntry: JournalEntry) {
  try {
    // Log entry details for debugging
    console.log(`Processing embedding for journal entry ${journalEntry.id}:`);
    console.log(`- Title: "${journalEntry.title}"`);
    console.log(`- Content length: ${journalEntry.content?.length || 0} characters`);
    console.log(`- Using template: ${journalEntry.templateId || 'Quick Note (no template)'}`);
    
    // Special handling for quick notes
    const isQuickNote = !journalEntry.templateId;
    if (isQuickNote) {
      console.log('Processing entry as Quick Note');
    }
    
    // Combine title and content for embedding with stronger weighting for title in quick notes
    // This helps search match more closely with the title content for quick notes
    let textToEmbed;
    if (isQuickNote) {
      // For quick notes, emphasize the title more by repeating it
      textToEmbed = `${journalEntry.title || ''}\n${journalEntry.title || ''}\n${journalEntry.content || ''}`;
    } else {
      textToEmbed = `${journalEntry.title || ''}\n${journalEntry.content || ''}`;
    }
    
    console.log(`- Combined text length for embedding: ${textToEmbed.length} characters`);
    console.log(`- Text preview: "${textToEmbed.substring(0, 50)}..."`);
    
    // Check for minimum content
    if (textToEmbed.trim().length < 5) {
      console.warn('Warning: Very short content for embedding, might affect quality');
    }
    
    // Generate embedding
    const embedding = await generateEmbedding(textToEmbed);
    
    // Get Pinecone index
    const index = await getJournalIndex();
    
    // Create metadata for the entry
    const metadata = {
      userId: journalEntry.userId,
      title: journalEntry.title || '',
      createdAt: journalEntry.createdAt.toDate?.() 
        ? journalEntry.createdAt.toDate().toISOString() 
        : new Date().toISOString(),
      snippet: journalEntry.content?.substring(0, 200) || '',
      templateId: journalEntry.templateId || 'none',
      isQuickNote: isQuickNote ? 'true' : 'false',
      // Add keywords for better searchability - extract key terms from title and content
      keywords: extractKeywords(journalEntry.title, journalEntry.content)
    };
    
    // Use sanitized metadata to prevent Pinecone errors with null values
    const sanitizedMetadata = sanitizeMetadata(metadata);
    console.log('Creating metadata for Pinecone:', JSON.stringify(sanitizedMetadata));
    
    // Upsert vector into Pinecone
    await index.upsert([{
      id: journalEntry.id,
      values: embedding,
      metadata: sanitizedMetadata
    }]);
    
    console.log(`Successfully upserted embedding for journal entry: ${journalEntry.id}`);
    return true;
  } catch (error) {
    console.error('Error upserting journal embedding:', error);
    // Add more detailed error reporting
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if ('cause' in error) {
        console.error('Caused by:', error.cause);
      }
    }
    return false;
  }
}

/**
 * Extract keywords from title and content for better searchability
 */
function extractKeywords(title?: string, content?: string): string[] {
  const combinedText = `${title || ''} ${content || ''}`.toLowerCase();
  
  // Extract words that might be important for search
  const keywords = [];
  
  // Look for travel-related terms
  if (combinedText.includes('travel') || 
      combinedText.includes('trip') || 
      combinedText.includes('vacation') ||
      combinedText.includes('destination') ||
      combinedText.includes('journey')) {
    keywords.push('travel');
  }
  
  // Look for location names that might be destinations
  const possibleLocations = ['mexico', 'europe', 'asia', 'africa', 'australia', 
                             'america', 'canada', 'beach', 'mountain', 'city',
                             'island', 'country', 'paris', 'london', 'tokyo',
                             'new york', 'rome', 'bali'];
  
  for (const location of possibleLocations) {
    if (combinedText.includes(location)) {
      keywords.push(location);
    }
  }
  
  // Look for food-related terms
  if (combinedText.includes('food') || 
      combinedText.includes('meal') || 
      combinedText.includes('restaurant') ||
      combinedText.includes('eat') ||
      combinedText.includes('drink') ||
      combinedText.includes('cuisine')) {
    keywords.push('food');
  }
  
  // Look for activity or hobby terms
  if (combinedText.includes('sport') || 
      combinedText.includes('play') || 
      combinedText.includes('game') ||
      combinedText.includes('hobby') ||
      combinedText.includes('exercise')) {
    keywords.push('activity');
  }
  
  return keywords;
}

/**
 * Delete a vector record from Pinecone
 */
export async function deleteJournalEmbedding(journalId: string) {
  try {
    const index = await getJournalIndex();
    await index.deleteOne(journalId);
    console.log(`Successfully deleted embedding for journal entry: ${journalId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting journal embedding for ID ${journalId}:`, error);
    return false;
  }
}

/**
 * Search for similar journal entries in Pinecone
 */
export async function searchJournalEmbeddings(
  query: string, 
  userId: string,
  limit: number = 5
) {
  try {
    // Check for specific topic searches and enhance them
    const enhancedQuery = enhanceSearchQuery(query);
    console.log(`Original query: "${query}", Enhanced: "${enhancedQuery}"`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(enhancedQuery);
    
    // Get Pinecone index
    const index = await getJournalIndex();
    
    // Prepare the filter condition
    const filter: Record<string, any> = { userId };
    
    // Add topic-specific filters if needed
    if (isTravelQuery(query)) {
      // For travel queries, also search in keywords metadata
      console.log('Using travel-specific filter to improve results');
    }
    
    // Search for similar entries
    const results = await index.query({
      vector: queryEmbedding,
      topK: limit,
      filter,
      includeMetadata: true
    });
    
    // Log the results for debugging
    if (results.matches && results.matches.length > 0) {
      console.log(`Found ${results.matches.length} matches with scores:`);
      results.matches.forEach((match: any, i: number) => {
        const metadata = match.metadata || {};
        console.log(`${i+1}. ID: ${match.id}, Score: ${match.score?.toFixed(4)}, Title: "${metadata.title || 'Untitled'}"`);
      });
    } else {
      console.log('No matches found for query');
    }
    
    // Return the results
    return results.matches || [];
  } catch (error) {
    console.error('Error searching journal embeddings:', error);
    throw error;
  }
}

/**
 * Check if a query is travel-related
 */
function isTravelQuery(query: string): boolean {
  const travelTerms = [
    'travel', 'trip', 'vacation', 'holiday', 'journey', 'destination',
    'visit', 'touring', 'tourism', 'sightseeing', 'explore', 'adventure',
    'mexico', 'europe', 'asia', 'beach', 'mountain', 'island'
  ];
  
  const lowerQuery = query.toLowerCase();
  return travelTerms.some(term => lowerQuery.includes(term));
}

/**
 * Enhance search query with related terms for better results
 */
function enhanceSearchQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  let enhanced = query;
  
  // Travel query enhancement
  if (isTravelQuery(query)) {
    // If query is 'where do I love travelling', enhance it with travel-related terms
    if (lowerQuery.includes('where') && lowerQuery.includes('travel')) {
      enhanced = `${query} destination journey trip vacation`;
    }
    
    // If query mentions specific locations, enhance with general travel terms
    const locations = ['mexico', 'europe', 'asia', 'africa', 'america', 'beach', 'mountain'];
    for (const location of locations) {
      if (lowerQuery.includes(location)) {
        enhanced = `${query} travel trip vacation destination journey`;
        break;
      }
    }
  }
  
  // Food query enhancement
  if (lowerQuery.includes('food') || lowerQuery.includes('eat') || lowerQuery.includes('meal')) {
    enhanced = `${query} food meal restaurant cuisine`;
  }
  
  // Activity or hobby enhancement
  if (lowerQuery.includes('sport') || lowerQuery.includes('play') || lowerQuery.includes('game')) {
    enhanced = `${query} sport activity hobby recreation`;
  }
  
  return enhanced;
}

/**
 * Index all existing journal entries for a user
 * Use this for initial setup or to rebuild the index
 */
export async function indexAllJournalEntries(userId: string) {
  try {
    // Get all journal entries for the user from Firebase
    const entries = await getAllJournalEntries(userId);
    
    // Skip if no entries
    if (!entries || entries.length === 0) {
      console.log('No journal entries found to index');
      return { success: true, indexed: 0 };
    }
    
    // Process entries in batches of 10
    const batchSize = 10;
    let indexed = 0;
    let failed = 0;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const promises = batch.map(entry => upsertJournalEmbedding(entry)
        .then(success => {
          if (success) indexed++;
          else failed++;
        })
        .catch(() => { failed++; })
      );
      
      await Promise.all(promises);
      console.log(`Indexed batch ${i / batchSize + 1}/${Math.ceil(entries.length / batchSize)}`);
    }
    
    return {
      success: true,
      total: entries.length,
      indexed,
      failed
    };
  } catch (error) {
    console.error('Error indexing all journal entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 