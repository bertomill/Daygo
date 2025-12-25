import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService } from '../services/goals';
import { localGoalsService } from '../services/localStorage';
import { useAuthStore } from '../stores/authStore';

export function useGoals() {
  const { user, isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['goals', isGuest ? 'guest' : user?.id],
    queryFn: () => isGuest
      ? localGoalsService.getGoalsWithHabits()
      : goalsService.getGoalsWithHabits(user!.id),
    enabled: isGuest || !!user,
  });
}

export function useGoal(goalId: string) {
  const { isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => isGuest
      ? localGoalsService.getGoalWithHabits(goalId)
      : goalsService.getGoalWithHabits(goalId),
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({
      goal,
      habitIds,
    }: {
      goal: {
        title: string;
        description?: string;
        icon?: string;
        metric_name: string;
        metric_target: number;
        deadline?: string;
      };
      habitIds?: string[];
    }) => isGuest
      ? localGoalsService.createGoal(goal, habitIds)
      : goalsService.createGoal(user!.id, goal, habitIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

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
    }) => isGuest
      ? localGoalsService.updateGoal(id, updates)
      : goalsService.updateGoal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      isGuest
        ? localGoalsService.updateProgress(id, progress)
        : goalsService.updateProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => isGuest
      ? localGoalsService.deleteGoal(id)
      : goalsService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useLinkHabitsToGoal() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ goalId, habitIds }: { goalId: string; habitIds: string[] }) =>
      isGuest
        ? localGoalsService.linkHabitsToGoal(goalId, habitIds)
        : goalsService.linkHabitsToGoal(goalId, habitIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}
