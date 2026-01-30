import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { identitiesService } from '../services/identities';
import { localIdentitiesService } from '../services/localStorage';
import { useAuthStore } from '../stores/authStore';

export function useIdentities() {
  const { user, isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['identities', isGuest ? 'guest' : user?.id],
    queryFn: () => isGuest
      ? localIdentitiesService.getIdentities()
      : identitiesService.getIdentities(user!.id),
    enabled: isGuest || !!user,
  });
}

export function useCreateIdentity() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (text: string) => isGuest
      ? localIdentitiesService.createIdentity(text)
      : identitiesService.createIdentity(user!.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identities'] });
    },
  });
}

export function useUpdateIdentity() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      isGuest
        ? localIdentitiesService.updateIdentity(id, text)
        : identitiesService.updateIdentity(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identities'] });
    },
  });
}

export function useDeleteIdentity() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => isGuest
      ? localIdentitiesService.deleteIdentity(id)
      : identitiesService.deleteIdentity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identities'] });
    },
  });
}

export function useReorderIdentities() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (orderedIds: string[]) => isGuest
      ? localIdentitiesService.reorderIdentities(orderedIds)
      : identitiesService.reorderIdentities(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identities'] });
    },
  });
}
