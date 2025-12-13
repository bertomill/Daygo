import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsService } from '../services/habits';
import { useAuthStore } from '../stores/authStore';

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export function useHabitsWithLogs(date?: string) {
  const { user } = useAuthStore();
  const targetDate = date ?? getToday();

  return useQuery({
    queryKey: ['habits', user?.id, targetDate],
    queryFn: () => habitsService.getHabitsWithLogs(user!.id, targetDate),
    enabled: !!user,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ name, description, weight }: { name: string; description?: string; weight?: number }) =>
      habitsService.createHabit(user!.id, name, description, weight),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; description?: string; weight?: number };
    }) => habitsService.updateHabit(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => habitsService.deleteHabit(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => habitsService.toggleHabitCompletion(user!.id, habitId, date, completed),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
      await queryClient.invalidateQueries({ queryKey: ['scores'] });
    },
  });
}

export function useScoreHistory(days: number = 7) {
  const { user } = useAuthStore();

  const endDate = getToday();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const startDateStr = startDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['scores', user?.id, startDateStr, endDate],
    queryFn: () => habitsService.getScoreHistory(user!.id, startDateStr, endDate),
    enabled: !!user,
  });
}

export function useDailyScore(date?: string) {
  const { user } = useAuthStore();
  const targetDate = date ?? getToday();

  return useQuery({
    queryKey: ['score', user?.id, targetDate],
    queryFn: () => habitsService.getDailyScore(user!.id, targetDate),
    enabled: !!user,
  });
}

export function useReorderHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => habitsService.reorderHabits(orderedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
