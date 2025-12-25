import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mantrasService } from '../services/mantras';
import { localMantrasService } from '../services/localStorage';
import { useAuthStore } from '../stores/authStore';

export function useMantras() {
  const { user, isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['mantras', isGuest ? 'guest' : user?.id],
    queryFn: () => isGuest
      ? localMantrasService.getMantras()
      : mantrasService.getMantras(user!.id),
    enabled: isGuest || !!user,
  });
}

export function useCreateMantra() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (text: string) => isGuest
      ? localMantrasService.createMantra(text)
      : mantrasService.createMantra(user!.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}

export function useUpdateMantra() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      isGuest
        ? localMantrasService.updateMantra(id, text)
        : mantrasService.updateMantra(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}

export function useDeleteMantra() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => isGuest
      ? localMantrasService.deleteMantra(id)
      : mantrasService.deleteMantra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}

export function useReorderMantras() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (orderedIds: string[]) => isGuest
      ? localMantrasService.reorderMantras(orderedIds)
      : mantrasService.reorderMantras(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}
