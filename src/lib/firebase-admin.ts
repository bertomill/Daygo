import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Firebase Admin SDK
export const initAdmin = () => {
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    // Check for environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error("Firebase Admin SDK credentials are missing. Please set environment variables.");
      
      // In development, we can continue without throwing an error
      if (isDevelopment) {
        console.warn("Running in development mode without Firebase Admin credentials");
        return null;
      }
      
      throw new Error("Firebase Admin SDK configuration missing");
    }
    
    // Initialize with credentials from environment variables
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    
    console.log("Firebase Admin SDK initialized");
  }
  
  return getApps()[0];
};

// Get Firestore Admin instance
export const getAdminFirestore = () => {
  // In development mode, we can return a mock if no credentials
  if (isDevelopment && (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL)) {
    console.warn("Development mode: Returning mock Firestore instance");
    
    // Return a mock Firestore instance with the methods we need
    return {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              userId: "dev-user-123",
              title: "Mock Journal Entry",
              content: "This is a mock journal entry for development.",
              createdAt: { toDate: () => new Date() }
            })
          })
        })
      })
    };
  }
  
  if (getApps().length === 0) {
    initAdmin();
  }
  
  return getFirestore();
};

export default initAdmin; 