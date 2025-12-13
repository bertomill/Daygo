import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalPromptsService } from '../services/journalPrompts';
import { useAuthStore } from '../stores/authStore';

const getToday = () => new Date().toISOString().split('T')[0];

export function useJournalPrompts() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['journalPrompts', user?.id],
    queryFn: () => journalPromptsService.getPrompts(user!.id),
    enabled: !!user,
  });
}

export function useJournalPromptsWithEntries(date?: string) {
  const { user } = useAuthStore();
  const targetDate = date ?? getToday();

  return useQuery({
    queryKey: ['journalPrompts', user?.id, targetDate],
    queryFn: () => journalPromptsService.getPromptsWithEntries(user!.id, targetDate),
    enabled: !!user,
  });
}

export function useCreateJournalPrompt() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (prompt: string) => journalPromptsService.createPrompt(user!.id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useUpdateJournalPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, prompt }: { id: string; prompt: string }) =>
      journalPromptsService.updatePrompt(id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useDeleteJournalPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => journalPromptsService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      promptId,
      entry,
      date,
    }: {
      promptId: string;
      entry: string;
      date?: string;
    }) => journalPromptsService.saveEntry(user!.id, promptId, entry, date ?? getToday()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useReorderJournalPrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => journalPromptsService.reorderPrompts(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}
