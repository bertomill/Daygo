import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visionsService } from '../services/visions';
import { localVisionsService } from '../services/localStorage';
import { useAuthStore } from '../stores/authStore';

export function useVisions() {
  const { user, isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['visions', isGuest ? 'guest' : user?.id],
    queryFn: () => isGuest
      ? localVisionsService.getVisions()
      : visionsService.getVisions(user!.id),
    enabled: isGuest || !!user,
  });
}

export function useCreateVision() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (text: string) => isGuest
      ? localVisionsService.createVision(text)
      : visionsService.createVision(user!.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] });
    },
  });
}

export function useUpdateVision() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      isGuest
        ? localVisionsService.updateVision(id, text)
        : visionsService.updateVision(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] });
    },
  });
}

export function useDeleteVision() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => isGuest
      ? localVisionsService.deleteVision(id)
      : visionsService.deleteVision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] });
    },
  });
}

export function useReorderVisions() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (orderedIds: string[]) => isGuest
      ? localVisionsService.reorderVisions(orderedIds)
      : visionsService.reorderVisions(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visions'] });
    },
  });
}
