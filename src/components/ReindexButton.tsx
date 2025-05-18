'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';

export function ReindexButton() {
  const [isReindexing, setIsReindexing] = useState(false);

  const handleReindex = async () => {
    try {
      setIsReindexing(true);
      
      // Get current user
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Call the reindex API
      const response = await fetch('/api/journal/embedding/reindex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reindex journal entries');
      }
      
      toast.success(result.message || 'Journal entries reindexed successfully');
      console.log('Reindex results:', result);
    } catch (error) {
      console.error('Error reindexing journal entries:', error);
      toast.error('Failed to reindex journal entries');
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReindex}
      disabled={isReindexing}
      className="gap-1"
    >
      <RefreshCw className="h-4 w-4" />
      {isReindexing ? 'Reindexing...' : 'Reindex Entries'}
    </Button>
  );
} 