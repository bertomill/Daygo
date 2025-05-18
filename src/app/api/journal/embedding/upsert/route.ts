import { NextResponse } from "next/server";
import { upsertJournalEmbedding } from "@/services/journalEmbeddingService";
// Uncomment Firebase Admin imports
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";

// Initialize Firebase Admin if not already initialized
initAdmin();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  try {
    // Skip authentication in development mode with missing Firebase Admin credentials
    let userId = null;
    
    if (!isDevelopment || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)) {
      // In production or when Firebase Admin is configured, verify the token
      // Extract authorization token
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Missing or invalid authorization token" },
          { status: 401 }
        );
      }
      
      const token = authHeader.split("Bearer ")[1];
      
      // Verify Firebase token - this requires Firebase Admin to be properly initialized
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log(`Verified token for user: ${userId}`);
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { error: "Invalid authorization token" },
          { status: 401 }
        );
      }
    } else {
      console.warn("DEVELOPMENT MODE: Bypassing authentication for journal embedding");
    }
    
    // Extract journal entry from request body
    const { journalEntry } = await req.json();
    
    // Validate journal entry
    if (!journalEntry || !journalEntry.id) {
      return NextResponse.json(
        { error: "Invalid journal entry data" },
        { status: 400 }
      );
    }
    
    // Skip userId check in development mode with missing Firebase Admin
    if (userId && journalEntry.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to journal entry" },
        { status: 403 }
      );
    }
    
    // For development, log the journal entry we're processing
    if (isDevelopment) {
      console.log(`Processing journal entry in dev mode: ${journalEntry.id}`);
      console.log(`Title: ${journalEntry.title || 'Untitled'}`);
      console.log(`Content snippet: ${journalEntry.content?.substring(0, 50)}...`);
    }
    
    // Upsert the embedding
    const result = await upsertJournalEmbedding(journalEntry);
    
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error("Error upserting journal embedding:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 