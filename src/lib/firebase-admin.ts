import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Check if we're in development mode or build time
const isDevelopment = process.env.NODE_ENV === 'development';
const isBuildTime = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PHASE === 'phase-production-build';

// Mock Firebase app for build time and development
const createMockApp = () => {
  console.warn("Creating mock Firebase Admin app");
  return { name: "[DEFAULT]", options: {} };
};

// Initialize Firebase Admin SDK
export const initAdmin = () => {
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    // Check for environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn("Firebase Admin SDK credentials are missing. Using fallback behavior.");
      
      // At build time or in development, we can use a mock
      if (isDevelopment || isBuildTime) {
        console.warn(`Running in ${isDevelopment ? 'development' : 'build'} mode without Firebase Admin credentials`);
        // Don't throw an error, just return the mock
        return createMockApp();
      }
      
      // In production, log error but don't crash the app
      console.error("Firebase Admin SDK configuration missing in production");
      return null;
    }
    
    try {
      // Initialize with credentials from environment variables
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      
      console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      
      // Don't throw in development or build
      if (isDevelopment || isBuildTime) {
        return createMockApp();
      }
      
      // In production, log but don't crash
      console.error("Failed to initialize Firebase Admin SDK in production");
      return null;
    }
  }
  
  return getApps()[0];
};

// Get Firestore Admin instance
export const getAdminFirestore = () => {
  // Create mock Firestore instance for development or build
  const createMockFirestore = () => {
    console.warn("Returning mock Firestore instance");
    
    // Return a mock Firestore instance with the methods we need
    return {
      collection: (collectionName: string) => ({
        doc: (docId: string) => ({
          get: async () => ({
            exists: true,
            data: () => ({
              userId: "dev-user-123",
              title: "Mock Journal Entry",
              content: "This is a mock journal entry for development.",
              createdAt: { toDate: () => new Date() }
            })
          }),
          set: async () => ({}),
          update: async () => ({}),
          delete: async () => ({})
        }),
        add: async () => ({ id: "mock-doc-id" }),
        where: () => ({
          get: async () => ({
            docs: []
          }),
          orderBy: () => ({
            get: async () => ({
              docs: []
            })
          })
        })
      })
    };
  };
  
  // In development mode or build time, we can return a mock if no credentials
  if ((isDevelopment || isBuildTime) && 
      (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL)) {
    return createMockFirestore();
  }
  
  // Try to initialize if not already done
  if (getApps().length === 0) {
    const app = initAdmin();
    if (!app) {
      return createMockFirestore();
    }
  }
  
  try {
    return getFirestore();
  } catch (error) {
    console.error("Error getting Firestore instance:", error);
    return createMockFirestore();
  }
};

export default initAdmin; 