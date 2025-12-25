import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalPromptsService } from '../services/journalPrompts';
import { localJournalPromptsService } from '../services/localStorage';
import { useAuthStore } from '../stores/authStore';

const getToday = () => new Date().toISOString().split('T')[0];

export function useJournalPrompts() {
  const { user, isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['journalPrompts', isGuest ? 'guest' : user?.id],
    queryFn: () => isGuest
      ? localJournalPromptsService.getPrompts()
      : journalPromptsService.getPrompts(user!.id),
    enabled: isGuest || !!user,
  });
}

export function useJournalPromptsWithEntries(date?: string) {
  const { user, isGuest } = useAuthStore();
  const targetDate = date ?? getToday();

  return useQuery({
    queryKey: ['journalPrompts', isGuest ? 'guest' : user?.id, targetDate],
    queryFn: () => isGuest
      ? localJournalPromptsService.getPromptsWithEntries(targetDate)
      : journalPromptsService.getPromptsWithEntries(user!.id, targetDate),
    enabled: isGuest || !!user,
  });
}

export function useCreateJournalPrompt() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (prompt: string) => isGuest
      ? localJournalPromptsService.createPrompt(prompt)
      : journalPromptsService.createPrompt(user!.id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useUpdateJournalPrompt() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, prompt }: { id: string; prompt: string }) =>
      isGuest
        ? localJournalPromptsService.updatePrompt(id, prompt)
        : journalPromptsService.updatePrompt(id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useDeleteJournalPrompt() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => isGuest
      ? localJournalPromptsService.deletePrompt(id)
      : journalPromptsService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({
      promptId,
      entry,
      date,
    }: {
      promptId: string;
      entry: string;
      date?: string;
    }) => isGuest
      ? localJournalPromptsService.saveEntry(promptId, entry, date ?? getToday())
      : journalPromptsService.saveEntry(user!.id, promptId, entry, date ?? getToday()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}

export function useReorderJournalPrompts() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (orderedIds: string[]) => isGuest
      ? localJournalPromptsService.reorderPrompts(orderedIds)
      : journalPromptsService.reorderPrompts(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalPrompts'] });
    },
  });
}
