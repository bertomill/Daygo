import { NextResponse } from "next/server";
import { upsertJournalEmbedding } from "@/services/journalEmbeddingService";
// Firebase Admin imports
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";

// Initialize Firebase Admin if not already initialized - this will handle missing credentials gracefully
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
          { 
            error: "Missing or invalid authorization token",
            details: "Authentication header missing or malformed"
          },
          { status: 401 }
        );
      }
      
      const token = authHeader.split("Bearer ")[1];
      
      // Verify Firebase token - this requires Firebase Admin to be properly initialized
      try {
        // Only attempt to verify the token if we have Firebase Admin credentials
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          const decodedToken = await getAuth().verifyIdToken(token);
          userId = decodedToken.uid;
          console.log(`Verified token for user: ${userId}`);
        } else {
          console.warn("Firebase Admin credentials missing, skipping token verification");
        }
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { 
            error: "Invalid authorization token",
            details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
          },
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
        { 
          error: "Invalid journal entry data",
          details: "Journal entry is missing or doesn't contain an ID"
        },
        { status: 400 }
      );
    }
    
    // Skip userId check in development mode with missing Firebase Admin
    if (userId && journalEntry.userId !== userId) {
      return NextResponse.json(
        { 
          error: "Unauthorized access to journal entry",
          details: "The user ID doesn't match the entry's owner"
        },
        { status: 403 }
      );
    }
    
    // Check for required API keys
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return NextResponse.json(
        { 
          error: "OpenAI API key is missing",
          details: "Cannot generate embeddings without an OpenAI API key"
        },
        { status: 500 }
      );
    }
    
    if (!process.env.PINECONE_API_KEY) {
      console.error("Pinecone API key is missing");
      return NextResponse.json(
        { 
          error: "Pinecone API key is missing",
          details: "Cannot store embeddings without a Pinecone API key"
        },
        { status: 500 }
      );
    }
    
    // For development, log the journal entry we're processing
    if (isDevelopment) {
      console.log(`Processing journal entry in dev mode: ${journalEntry.id}`);
      console.log(`Title: ${journalEntry.title || 'Untitled'}`);
      console.log(`Content snippet: ${journalEntry.content?.substring(0, 50)}...`);
    }
    
    // Upsert the embedding
    try {
      const result = await upsertJournalEmbedding(journalEntry);
      
      if (!result) {
        return NextResponse.json({ 
          success: false,
          error: "Failed to upsert journal embedding in Pinecone" 
        });
      }
      
      return NextResponse.json({ success: result });
    } catch (upsertError) {
      console.error("Error during upsert operation:", upsertError);
      return NextResponse.json(
        { 
          error: "Failed to process embedding upsert",
          details: upsertError instanceof Error ? upsertError.message : 'Unknown error',
          stack: upsertError instanceof Error ? upsertError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error upserting journal embedding:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 