import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
export const initAdmin = () => {
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    // Check for environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error("Firebase Admin SDK credentials are missing. Please set environment variables.");
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
  if (getApps().length === 0) {
    initAdmin();
  }
  return getFirestore();
};

export default initAdmin; 