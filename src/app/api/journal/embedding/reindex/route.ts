import { NextResponse } from "next/server";
import { indexAllJournalEntries } from "@/services/journalEmbeddingService";
import { getAuth } from "firebase/auth";

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * API route to reindex all journal entries for a user
 * This is useful when you've updated the embedding logic and want to apply it to existing entries
 */
export async function POST(req: Request) {
  try {
    // Extract user ID from request body
    const { userId } = await req.json();
    
    // Validate the user ID
    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 400 }
      );
    }
    
    console.log(`Reindexing journal entries for user: ${userId}`);
    
    // Start the reindexing process
    const result = await indexAllJournalEntries(userId);
    
    console.log(`Reindexing complete:`, result);
    
    return NextResponse.json({ 
      success: result.success,
      message: `Reindexing complete. Processed ${result.total || 0} entries, indexed ${result.indexed || 0}, failed ${result.failed || 0}.`,
      ...result
    });
  } catch (error) {
    console.error("Error reindexing journal entries:", error);
    return NextResponse.json(
      { error: "Failed to reindex journal entries" },
      { status: 500 }
    );
  }
} 