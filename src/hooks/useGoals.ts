import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService } from '../services/goals';
import { useAuthStore } from '../stores/authStore';

export function useGoals() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => goalsService.getGoalsWithHabits(user!.id),
    enabled: !!user,
  });
}

export function useGoal(goalId: string) {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalsService.getGoalWithHabits(goalId),
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      goal,
      habitIds,
    }: {
      goal: {
        title: string;
        description?: string;
        metric_name: string;
        metric_target: number;
        deadline?: string;
      };
      habitIds?: string[];
    }) => goalsService.createGoal(user!.id, goal, habitIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        title?: string;
        description?: string;
        metric_name?: string;
        metric_target?: number;
        metric_current?: number;
        deadline?: string;
      };
    }) => goalsService.updateGoal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      goalsService.updateProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useLinkHabitsToGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, habitIds }: { goalId: string; habitIds: string[] }) =>
      goalsService.linkHabitsToGoal(goalId, habitIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}
