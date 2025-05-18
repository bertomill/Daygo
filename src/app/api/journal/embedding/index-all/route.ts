import { NextResponse } from "next/server";
import { indexAllJournalEntries } from "@/services/journalEmbeddingService";
// Comment out Firebase Admin imports
// import { getAuth } from "firebase-admin/auth";
// import { initAdmin } from "@/lib/firebase-admin";

// Initialize Firebase Admin if not already initialized
// initAdmin();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  try {
    // Get user ID, either from token or use a mock one in development
    let userId = "dev-user-123"; // Default dev user ID
    
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
      
      // Verify Firebase token
      try {
        // Since we commented out the Firebase Admin imports, this code is unreachable
        // We'll uncomment this when Firebase Admin is properly configured
        /*
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
        */
        
        // Try to extract userId from the request body in development
        try {
          const body = await req.json();
          if (body.userId) {
            userId = body.userId;
            console.log(`Using userId from request body: ${userId}`);
          }
        } catch (e) {
          // If there's no body or it can't be parsed, use the default dev ID
          console.log(`Using default development userId: ${userId}`);
        }
        
        console.warn("DEVELOPMENT MODE: Skipping Firebase token verification");
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { error: "Invalid authorization token" },
          { status: 401 }
        );
      }
    } else {
      console.warn("DEVELOPMENT MODE: Using mock userId for indexing");
      
      // Try to extract userId from the request body in development
      try {
        const body = await req.clone().json();
        if (body.userId) {
          userId = body.userId;
          console.log(`Using userId from request body: ${userId}`);
        }
      } catch (e) {
        // If there's no body or it can't be parsed, use the default dev ID
        console.log(`Using default development userId: ${userId}`);
      }
    }
    
    console.log(`Starting indexing process for user: ${userId}`);
    
    // Start indexing process
    const result = await indexAllJournalEntries(userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error indexing journal entries:", error);
    return NextResponse.json(
      { error: "Failed to process indexing request" },
      { status: 500 }
    );
  }
} 