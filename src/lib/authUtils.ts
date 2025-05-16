import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Export auth for consistent access
export { auth };

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Sign in anonymously
export const signInAnonymously = async () => {
  return firebaseSignInAnonymously(auth);
};

// Sign out
export const signOut = async () => {
  return firebaseSignOut(auth);
};

// Register a new user
export const registerUser = async (name: string, email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update the user's display name
  await updateProfile(user, {
    displayName: name
  });
  
  // Create a user document in Firestore
  await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    createdAt: new Date()
  });
  
  return userCredential;
};

// Send password reset email
export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// Check if user is anonymous
export const isAnonymous = () => {
  return auth.currentUser?.isAnonymous || false;
}; 