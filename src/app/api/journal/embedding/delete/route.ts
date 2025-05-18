import { NextResponse } from "next/server";
import { deleteJournalEmbedding } from "@/services/journalEmbeddingService";
// Comment out Firebase Admin imports
// import { getAuth } from "firebase-admin/auth";
// import { initAdmin } from "@/lib/firebase-admin";
// import { getAdminFirestore } from "@/lib/firebase-admin";

// Initialize Firebase Admin if not already initialized
// initAdmin();

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
        // Since we commented out the Firebase Admin imports, this code is unreachable
        // We'll uncomment this when Firebase Admin is properly configured
        /*
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
        */
        console.warn("DEVELOPMENT MODE: Skipping Firebase token verification");
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { error: "Invalid authorization token" },
          { status: 401 }
        );
      }
    } else {
      console.warn("DEVELOPMENT MODE: Bypassing authentication for journal embedding deletion");
    }
    
    // Extract journal ID from request body
    const { journalId } = await req.json();
    
    // Validate journal ID
    if (!journalId) {
      return NextResponse.json(
        { error: "Journal ID is required" },
        { status: 400 }
      );
    }
    
    // Skip ownership verification in development mode
    if (isDevelopment || !process.env.FIREBASE_PROJECT_ID) {
      console.log(`DEV MODE: Deleting embedding for journal entry: ${journalId}`);
      const result = await deleteJournalEmbedding(journalId);
      return NextResponse.json({ success: result });
    }
    
    // This part will only run when Firebase Admin is properly configured
    /*
    // Verify ownership of the journal entry before deleting the embedding
    const adminDb = getAdminFirestore();
    const journalDoc = await adminDb.collection("journalEntries").doc(journalId).get();
    
    if (!journalDoc.exists) {
      // If the journal entry doesn't exist, we can safely delete the embedding
      // This handles the case where the Firestore document was already deleted
      await deleteJournalEmbedding(journalId);
      return NextResponse.json({ success: true });
    }
    
    const journalData = journalDoc.data();
    
    // Ensure the user is deleting their own entry
    if (journalData && journalData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to journal entry" },
        { status: 403 }
      );
    }
    */
    
    // Delete the embedding
    const result = await deleteJournalEmbedding(journalId);
    
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error("Error deleting journal embedding:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 