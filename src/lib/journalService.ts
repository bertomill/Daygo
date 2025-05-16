import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";

export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  userId: string;
  createdAt?: any;
}

// Collection reference
const journalEntriesRef = collection(db, "journalEntries");

// Add a new journal entry
export async function addJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt" | "userId">) {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User must be logged in to add journal entries");
    }

    const userId = auth.currentUser.uid;
    
    const docRef = await addDoc(journalEntriesRef, {
      ...entry,
      userId,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...entry,
      userId
    };
  } catch (error) {
    console.error("Error adding journal entry:", error);
    throw error;
  }
}

// Get all journal entries for the current user sorted by date
export async function getJournalEntries() {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User must be logged in to get journal entries");
    }

    const userId = auth.currentUser.uid;
    
    // Query entries for the current user only
    const q = query(
      journalEntriesRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as JournalEntry[];
  } catch (error) {
    console.error("Error getting journal entries:", error);
    throw error;
  }
} 