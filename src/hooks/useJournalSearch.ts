"use client";

import { useState, useCallback } from "react";
import { getAuth } from "firebase/auth";

type JournalSearchResult = {
  id: string;
  title: string;
  content: string;
  createdAt: string | null;
  relevanceScore: number;
  metadata?: any;
};

type SearchState = {
  results: JournalSearchResult[];
  isLoading: boolean;
  error: string | null;
};

export function useJournalSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
  });
  
  const searchJournalEntries = useCallback(async (query: string, limit: number = 5) => {
    if (!query.trim()) {
      setSearchState((prev) => ({
        ...prev,
        results: [],
        error: "Search query cannot be empty",
      }));
      return;
    }
    
    setSearchState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User must be authenticated to search journal entries");
      }
      
      // Get the user's ID token
      const token = await user.getIdToken(true);
      
      // Make the search request
      const response = await fetch("/api/journal/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, limit }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search journal entries");
      }
      
      const data = await response.json();
      
      setSearchState({
        results: data.entries || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error searching journal entries:", error);
      
      setSearchState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to search journal entries",
      }));
    }
  }, []);
  
  const indexAllEntries = useCallback(async () => {
    setSearchState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User must be authenticated to index journal entries");
      }
      
      // Get the user's ID token
      const token = await user.getIdToken(true);
      
      // Make the indexing request
      const response = await fetch("/api/journal/embedding/index-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to index journal entries");
      }
      
      const data = await response.json();
      
      setSearchState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      
      return data;
    } catch (error) {
      console.error("Error indexing journal entries:", error);
      
      setSearchState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to index journal entries",
      }));
      
      return { success: false, error: error.message };
    }
  }, []);
  
  return {
    ...searchState,
    searchJournalEntries,
    indexAllEntries,
  };
} 