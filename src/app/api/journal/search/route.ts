import { NextResponse } from "next/server";
import { searchJournalEmbeddings } from "@/services/journalEmbeddingService";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";
import { getAdminFirestore } from "@/lib/firebase-admin";

// Initialize Firebase Admin if not already initialized
initAdmin();

export async function POST(req: Request) {
  try {
    // Extract authorization token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }
    
    const token = authHeader.split("Bearer ")[1];
    
    // Verify Firebase token
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const userId = decodedToken.uid;
      
      // Extract search parameters from request body
      const { query, limit = 5 } = await req.json();
      
      // Validate query
      if (!query) {
        return NextResponse.json(
          { error: "Search query is required" },
          { status: 400 }
        );
      }
      
      // Search for similar journal entries
      const searchResults = await searchJournalEmbeddings(query, userId, limit);
      
      // Get the full content of each journal entry
      if (searchResults && searchResults.length > 0) {
        const adminDb = getAdminFirestore();
        
        // Get the full journal entries for the search results
        const journalEntries = await Promise.all(
          searchResults.map(async (result) => {
            try {
              const journalDoc = await adminDb
                .collection("journalEntries")
                .doc(result.id)
                .get();
              
              if (!journalDoc.exists) {
                return null;
              }
              
              const journalData = journalDoc.data();
              
              // Only return entries that belong to the user
              if (journalData && journalData.userId === userId) {
                return {
                  id: result.id,
                  title: journalData.title || '',
                  content: journalData.content || '',
                  createdAt: journalData.createdAt ? new Date(journalData.createdAt.toDate()).toISOString() : null,
                  relevanceScore: result.score,
                  metadata: result.metadata
                };
              }
              
              return null;
            } catch (err) {
              console.error(`Error fetching journal entry ${result.id}:`, err);
              return null;
            }
          })
        );
        
        // Filter out null entries (not found or unauthorized)
        const validEntries = journalEntries.filter(entry => entry !== null);
        
        return NextResponse.json({ entries: validEntries });
      }
      
      return NextResponse.json({ entries: [] });
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error searching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to process search request" },
      { status: 500 }
    );
  }
} 