'use client';

import { useEffect, useState, useCallback } from 'react';
import { getJournalEntries, JournalEntry } from '@/lib/journalService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const journalEntries = await getJournalEntries();
      setEntries(journalEntries);
      setError(null);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (loading && entries.length === 0) {
    return <p className="text-center my-8">Loading entries...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 my-8">{error}</p>;
  }

  if (entries.length === 0) {
    return <p className="text-center my-8">No journal entries yet. Create your first one!</p>;
  }

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-2xl font-bold">Your Journal Entries</h2>
      {entries.map((entry) => (
        <Card key={entry.id} className="overflow-hidden">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-xl">{entry.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {entry.createdAt?.toDate
                ? new Date(entry.createdAt.toDate()).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Date unknown'}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="whitespace-pre-wrap">{entry.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Export the component with a refresh function
export function JournalEntriesWithRefresh({ onRefreshNeeded }: { onRefreshNeeded?: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Using useEffect to trigger the refresh function when needed
  useEffect(() => {
    // Example: You can trigger a refresh based on some condition
    const timeoutId = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    }, 60000); // Refresh every minute as an example
    
    return () => clearTimeout(timeoutId);
  }, [onRefreshNeeded]);
  
  // This key change will cause the component to remount and fetch fresh data
  return <JournalEntries key={refreshKey} />;
} 