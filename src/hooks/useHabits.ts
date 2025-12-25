import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsService } from '../services/habits';
import { localHabitsService } from '../services/localStorage';
import { useAuthStore } from '../stores/authStore';

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export function useHabitsWithLogs(date?: string) {
  const { user, isGuest } = useAuthStore();
  const targetDate = date ?? getToday();

  return useQuery({
    queryKey: ['habits', isGuest ? 'guest' : user?.id, targetDate],
    queryFn: () => isGuest
      ? localHabitsService.getHabitsWithLogs(targetDate)
      : habitsService.getHabitsWithLogs(user!.id, targetDate),
    enabled: isGuest || !!user,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({ name, description, weight }: { name: string; description?: string; weight?: number }) =>
      isGuest
        ? localHabitsService.createHabit(name, description, weight)
        : habitsService.createHabit(user!.id, name, description, weight),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; description?: string; weight?: number };
    }) => isGuest
      ? localHabitsService.updateHabit(id, updates)
      : habitsService.updateHabit(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => isGuest
      ? localHabitsService.deleteHabit(id)
      : habitsService.deleteHabit(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuthStore();

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => isGuest
      ? localHabitsService.toggleHabitCompletion(habitId, date, completed)
      : habitsService.toggleHabitCompletion(user!.id, habitId, date, completed),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
      await queryClient.invalidateQueries({ queryKey: ['scores'] });
    },
  });
}

export function useScoreHistory(days: number = 7) {
  const { user, isGuest } = useAuthStore();

  const endDate = getToday();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const startDateStr = startDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['scores', isGuest ? 'guest' : user?.id, startDateStr, endDate],
    queryFn: () => isGuest
      ? localHabitsService.getScoreHistory(startDateStr, endDate)
      : habitsService.getScoreHistory(user!.id, startDateStr, endDate),
    enabled: isGuest || !!user,
  });
}

export function useDailyScore(date?: string) {
  const { user, isGuest } = useAuthStore();
  const targetDate = date ?? getToday();

  return useQuery({
    queryKey: ['score', isGuest ? 'guest' : user?.id, targetDate],
    queryFn: () => isGuest
      ? localHabitsService.getDailyScore(targetDate)
      : habitsService.getDailyScore(user!.id, targetDate),
    enabled: isGuest || !!user,
  });
}

export function useReorderHabits() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthStore();

  return useMutation({
    mutationFn: (orderedIds: string[]) => isGuest
      ? localHabitsService.reorderHabits(orderedIds)
      : habitsService.reorderHabits(orderedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
