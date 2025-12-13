import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mantrasService } from '../services/mantras';
import { useAuthStore } from '../stores/authStore';

export function useMantras() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['mantras', user?.id],
    queryFn: () => mantrasService.getMantras(user!.id),
    enabled: !!user,
  });
}

export function useCreateMantra() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (text: string) => mantrasService.createMantra(user!.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}

export function useUpdateMantra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      mantrasService.updateMantra(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}

export function useDeleteMantra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mantrasService.deleteMantra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}

export function useReorderMantras() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => mantrasService.reorderMantras(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantras'] });
    },
  });
}
