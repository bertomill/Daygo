"use client";

import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDoc,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { JournalEntry } from "@/types/journal";

// Collection reference
const journalCollection = () => collection(db, "journal");

// Get current user ID
const getCurrentUser = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated");
  }
  return user;
};

type JournalEntryInput = {
  title: string;
  content: string;
  templateId?: string;
  templateFields?: Record<string, string | undefined>;
};

// Add a new journal entry
export const addJournalEntry = async (journalData: JournalEntryInput) => {
  console.log("Adding journal entry:", journalData);
  
  try {
    const user = getCurrentUser();
    console.log("Current user:", user.uid);
    
    // Create journal entry with required user data
    const entryData = {
      ...journalData,
      userId: user.uid,
      createdAt: serverTimestamp()
    };
    
    console.log("Entry data to save:", entryData);
    
    const docRef = await addDoc(journalCollection(), entryData);
    console.log("Journal entry added with ID:", docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Error in addJournalEntry:", error);
    throw error;
  }
};

// Get a journal entry by ID
export const getJournalEntry = async (id: string): Promise<JournalEntry> => {
  const user = getCurrentUser();
  
  const docRef = doc(db, "journal", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Journal entry not found");
  }
  
  const data = docSnap.data() as JournalEntry;
  
  // Ensure users can only access their own journal entries
  if (data.userId !== user.uid) {
    throw new Error("Unauthorized access to journal entry");
  }
  
  return {
    ...data,
    id: docSnap.id
  };
};

// Get all journal entries for the current user
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const user = getCurrentUser();
  
  const q = query(
    journalCollection(),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  
  querySnapshot.forEach((doc) => {
    entries.push({
      ...doc.data(),
      id: doc.id
    } as JournalEntry);
  });
  
  return entries;
};

// Update a journal entry
export const updateJournalEntry = async (id: string, updates: Partial<JournalEntryInput>) => {
  const user = getCurrentUser();
  
  // First check that the journal entry belongs to the user
  const entryDoc = await getDoc(doc(db, "journal", id));
  if (!entryDoc.exists()) {
    throw new Error("Journal entry not found");
  }
  
  const entryData = entryDoc.data() as JournalEntry;
  if (entryData.userId !== user.uid) {
    throw new Error("Unauthorized access to journal entry");
  }
  
  // Update the journal entry
  const docRef = doc(db, "journal", id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  return id;
};

// Delete a journal entry
export const deleteJournalEntry = async (id: string) => {
  const user = getCurrentUser();
  
  // First check that the journal entry belongs to the user
  const entryDoc = await getDoc(doc(db, "journal", id));
  if (!entryDoc.exists()) {
    throw new Error("Journal entry not found");
  }
  
  const entryData = entryDoc.data() as JournalEntry;
  if (entryData.userId !== user.uid) {
    throw new Error("Unauthorized access to journal entry");
  }
  
  // Delete the journal entry
  await deleteDoc(doc(db, "journal", id));
  
  return id;
};

// Helper function to generate content from template fields
export const generateContentFromTemplateFields = (fields: Record<string, string | undefined>) => {
  return Object.entries(fields)
    .filter(([key]) => key !== 'title') // Skip title field
    .map(([key, value]) => {
      // Handle boolean values stored as strings
      if (value === 'true') return `${key}: Yes`;
      if (value === 'false') return `${key}: No`;
      return `${key}: ${value || ''}`;
    })
    .join('\n\n');
}; 