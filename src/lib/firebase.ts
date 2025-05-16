// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Import analytics only on client side
import { getAnalytics } from "firebase/analytics";

// Initialize Firebase with configuration for Daygo app
const firebaseConfig = {
  apiKey: "AIzaSyDF3-5iA2WBv57MNvgxPD1m7NO39AjBg5Y",
  authDomain: "dayfocus-45a76.firebaseapp.com",
  projectId: "dayfocus-45a76",
  storageBucket: "dayfocus-45a76.firebasestorage.app",
  messagingSenderId: "961785427048",
  appId: "1:961785427048:web:963710ad53d9a17facf7dd",
  measurementId: "G-SGB18DZLJN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics (only in browser)
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined') {
    return getAnalytics(app);
  }
  return null;
};

export default app; 