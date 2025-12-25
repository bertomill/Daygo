import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog, HabitWithLog, Goal, GoalWithHabits, Mantra, JournalPrompt, JournalEntry, JournalPromptWithEntry, Vision } from '../types/database';

// Storage keys
const KEYS = {
  HABITS: '@daygo_guest_habits',
  HABIT_LOGS: '@daygo_guest_habit_logs',
  GOALS: '@daygo_guest_goals',
  HABIT_GOAL_LINKS: '@daygo_guest_habit_goal_links',
  MANTRAS: '@daygo_guest_mantras',
  JOURNAL_PROMPTS: '@daygo_guest_journal_prompts',
  JOURNAL_ENTRIES: '@daygo_guest_journal_entries',
  VISIONS: '@daygo_guest_visions',
};

// Guest user ID constant
const GUEST_USER_ID = 'guest';

// Helper to generate UUIDs
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generic helpers
async function getItems<T>(key: string): Promise<T[]> {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// ============ HABITS SERVICE ============
export const localHabitsService = {
  async getHabits(): Promise<Habit[]> {
    const habits = await getItems<Habit>(KEYS.HABITS);
    return habits.filter((h) => h.is_active).sort((a, b) => a.sort_order - b.sort_order);
  },

  async getHabitsWithLogs(date: string): Promise<HabitWithLog[]> {
    const habits = await this.getHabits();
    const logs = await getItems<HabitLog>(KEYS.HABIT_LOGS);

    const logsMap = new Map(
      logs.filter((l) => l.date === date).map((log) => [log.habit_id, log])
    );

    // Filter habits created on or before the selected date
    return habits
      .filter((habit) => {
        const habitCreatedDate = habit.created_at.split('T')[0];
        return habitCreatedDate <= date;
      })
      .map((habit) => ({
        ...habit,
        completed: logsMap.get(habit.id)?.completed ?? false,
      }));
  },

  async createHabit(name: string, description?: string, weight: number = 1): Promise<Habit> {
    const habits = await getItems<Habit>(KEYS.HABITS);
    const newHabit: Habit = {
      id: generateId(),
      user_id: GUEST_USER_ID,
      name,
      description: description || null,
      weight,
      is_active: true,
      sort_order: habits.length,
      created_at: new Date().toISOString(),
    };
    habits.push(newHabit);
    await setItems(KEYS.HABITS, habits);
    return newHabit;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const habits = await getItems<Habit>(KEYS.HABITS);
    const index = habits.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Habit not found');
    habits[index] = { ...habits[index], ...updates };
    await setItems(KEYS.HABITS, habits);
    return habits[index];
  },

  async deleteHabit(id: string): Promise<void> {
    await this.updateHabit(id, { is_active: false });
  },

  async toggleHabitCompletion(habitId: string, date: string, completed: boolean): Promise<HabitLog> {
    const logs = await getItems<HabitLog>(KEYS.HABIT_LOGS);
    const existingIndex = logs.findIndex((l) => l.habit_id === habitId && l.date === date);

    const log: HabitLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : generateId(),
      habit_id: habitId,
      user_id: GUEST_USER_ID,
      date,
      completed,
    };

    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }

    await setItems(KEYS.HABIT_LOGS, logs);
    return log;
  },

  async getDailyScore(date: string): Promise<number> {
    const habitsWithLogs = await this.getHabitsWithLogs(date);
    if (habitsWithLogs.length === 0) return 0;

    const totalWeight = habitsWithLogs.reduce((sum, h) => sum + h.weight, 0);
    const completedWeight = habitsWithLogs
      .filter((h) => h.completed)
      .reduce((sum, h) => sum + h.weight, 0);

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  },

  async getScoreHistory(startDate: string, endDate: string): Promise<{ date: string; score: number }[]> {
    const results: { date: string; score: number }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const score = await this.getDailyScore(dateStr);
      results.push({ date: dateStr, score });
    }

    return results;
  },

  async reorderHabits(orderedIds: string[]): Promise<void> {
    const habits = await getItems<Habit>(KEYS.HABITS);
    for (let i = 0; i < orderedIds.length; i++) {
      const habit = habits.find((h) => h.id === orderedIds[i]);
      if (habit) habit.sort_order = i;
    }
    await setItems(KEYS.HABITS, habits);
  },
};

// ============ GOALS SERVICE ============
export const localGoalsService = {
  async getGoals(): Promise<Goal[]> {
    const goals = await getItems<Goal>(KEYS.GOALS);
    return goals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getGoalWithHabits(goalId: string): Promise<GoalWithHabits | null> {
    const goals = await this.getGoals();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const links = await getItems<{ goal_id: string; habit_id: string }>(KEYS.HABIT_GOAL_LINKS);
    const habitIds = links.filter((l) => l.goal_id === goalId).map((l) => l.habit_id);

    const allHabits = await localHabitsService.getHabits();
    const habits = allHabits.filter((h) => habitIds.includes(h.id));

    const progress = goal.metric_target > 0
      ? Math.min(100, Math.round((goal.metric_current / goal.metric_target) * 100))
      : 0;

    return { ...goal, habits, progress };
  },

  async getGoalsWithHabits(): Promise<GoalWithHabits[]> {
    const goals = await this.getGoals();
    const results: GoalWithHabits[] = [];

    for (const goal of goals) {
      const withHabits = await this.getGoalWithHabits(goal.id);
      if (withHabits) results.push(withHabits);
    }

    return results;
  },

  async createGoal(
    goalData: {
      title: string;
      description?: string;
      icon?: string;
      metric_name: string;
      metric_target: number;
      deadline?: string;
    },
    habitIds: string[] = []
  ): Promise<Goal> {
    const goals = await getItems<Goal>(KEYS.GOALS);
    const newGoal: Goal = {
      id: generateId(),
      user_id: GUEST_USER_ID,
      title: goalData.title,
      description: goalData.description || null,
      icon: goalData.icon || null,
      metric_name: goalData.metric_name,
      metric_target: goalData.metric_target,
      metric_current: 0,
      deadline: goalData.deadline || null,
      created_at: new Date().toISOString(),
    };
    goals.push(newGoal);
    await setItems(KEYS.GOALS, goals);

    if (habitIds.length > 0) {
      await this.linkHabitsToGoal(newGoal.id, habitIds);
    }

    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const goals = await getItems<Goal>(KEYS.GOALS);
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Goal not found');
    goals[index] = { ...goals[index], ...updates };
    await setItems(KEYS.GOALS, goals);
    return goals[index];
  },

  async updateProgress(id: string, metricCurrent: number): Promise<Goal> {
    return this.updateGoal(id, { metric_current: metricCurrent });
  },

  async deleteGoal(id: string): Promise<void> {
    const goals = await getItems<Goal>(KEYS.GOALS);
    const filtered = goals.filter((g) => g.id !== id);
    await setItems(KEYS.GOALS, filtered);

    // Remove habit links
    const links = await getItems<{ goal_id: string; habit_id: string }>(KEYS.HABIT_GOAL_LINKS);
    const filteredLinks = links.filter((l) => l.goal_id !== id);
    await setItems(KEYS.HABIT_GOAL_LINKS, filteredLinks);
  },

  async linkHabitsToGoal(goalId: string, habitIds: string[]): Promise<void> {
    const links = await getItems<{ id: string; goal_id: string; habit_id: string }>(KEYS.HABIT_GOAL_LINKS);
    const filtered = links.filter((l) => l.goal_id !== goalId);

    const newLinks = habitIds.map((habitId) => ({
      id: generateId(),
      goal_id: goalId,
      habit_id: habitId,
    }));

    await setItems(KEYS.HABIT_GOAL_LINKS, [...filtered, ...newLinks]);
  },
};

// ============ MANTRAS SERVICE ============
export const localMantrasService = {
  async getMantras(): Promise<Mantra[]> {
    const mantras = await getItems<Mantra>(KEYS.MANTRAS);
    return mantras.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
  },

  async createMantra(text: string): Promise<Mantra> {
    const mantras = await getItems<Mantra>(KEYS.MANTRAS);
    const newMantra: Mantra = {
      id: generateId(),
      user_id: GUEST_USER_ID,
      text,
      is_active: true,
      sort_order: mantras.length,
      created_at: new Date().toISOString(),
    };
    mantras.push(newMantra);
    await setItems(KEYS.MANTRAS, mantras);
    return newMantra;
  },

  async updateMantra(id: string, text: string): Promise<Mantra> {
    const mantras = await getItems<Mantra>(KEYS.MANTRAS);
    const index = mantras.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Mantra not found');
    mantras[index].text = text;
    await setItems(KEYS.MANTRAS, mantras);
    return mantras[index];
  },

  async deleteMantra(id: string): Promise<void> {
    const mantras = await getItems<Mantra>(KEYS.MANTRAS);
    const index = mantras.findIndex((m) => m.id === id);
    if (index >= 0) {
      mantras[index].is_active = false;
      await setItems(KEYS.MANTRAS, mantras);
    }
  },

  async reorderMantras(orderedIds: string[]): Promise<void> {
    const mantras = await getItems<Mantra>(KEYS.MANTRAS);
    for (let i = 0; i < orderedIds.length; i++) {
      const mantra = mantras.find((m) => m.id === orderedIds[i]);
      if (mantra) mantra.sort_order = i;
    }
    await setItems(KEYS.MANTRAS, mantras);
  },
};

// ============ JOURNAL PROMPTS SERVICE ============
export const localJournalPromptsService = {
  async getPrompts(): Promise<JournalPrompt[]> {
    const prompts = await getItems<JournalPrompt>(KEYS.JOURNAL_PROMPTS);
    return prompts.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
  },

  async getPromptsWithEntries(date: string): Promise<JournalPromptWithEntry[]> {
    const prompts = await this.getPrompts();
    const entries = await getItems<JournalEntry>(KEYS.JOURNAL_ENTRIES);

    const entriesMap = new Map(
      entries.filter((e) => e.date === date).map((entry) => [entry.prompt_id, entry])
    );

    return prompts.map((prompt) => ({
      ...prompt,
      todayEntry: entriesMap.get(prompt.id)?.entry ?? null,
    }));
  },

  async createPrompt(prompt: string): Promise<JournalPrompt> {
    const prompts = await getItems<JournalPrompt>(KEYS.JOURNAL_PROMPTS);
    const newPrompt: JournalPrompt = {
      id: generateId(),
      user_id: GUEST_USER_ID,
      prompt,
      is_active: true,
      sort_order: prompts.length,
      created_at: new Date().toISOString(),
    };
    prompts.push(newPrompt);
    await setItems(KEYS.JOURNAL_PROMPTS, prompts);
    return newPrompt;
  },

  async updatePrompt(id: string, prompt: string): Promise<JournalPrompt> {
    const prompts = await getItems<JournalPrompt>(KEYS.JOURNAL_PROMPTS);
    const index = prompts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Prompt not found');
    prompts[index].prompt = prompt;
    await setItems(KEYS.JOURNAL_PROMPTS, prompts);
    return prompts[index];
  },

  async deletePrompt(id: string): Promise<void> {
    const prompts = await getItems<JournalPrompt>(KEYS.JOURNAL_PROMPTS);
    const index = prompts.findIndex((p) => p.id === id);
    if (index >= 0) {
      prompts[index].is_active = false;
      await setItems(KEYS.JOURNAL_PROMPTS, prompts);
    }
  },

  async saveEntry(promptId: string, entry: string, date: string): Promise<JournalEntry> {
    const entries = await getItems<JournalEntry>(KEYS.JOURNAL_ENTRIES);
    const existingIndex = entries.findIndex((e) => e.prompt_id === promptId && e.date === date);

    const journalEntry: JournalEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : generateId(),
      prompt_id: promptId,
      user_id: GUEST_USER_ID,
      entry,
      date,
      created_at: existingIndex >= 0 ? entries[existingIndex].created_at : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      entries[existingIndex] = journalEntry;
    } else {
      entries.push(journalEntry);
    }

    await setItems(KEYS.JOURNAL_ENTRIES, entries);
    return journalEntry;
  },

  async getEntry(promptId: string, date: string): Promise<JournalEntry | null> {
    const entries = await getItems<JournalEntry>(KEYS.JOURNAL_ENTRIES);
    return entries.find((e) => e.prompt_id === promptId && e.date === date) ?? null;
  },

  async reorderPrompts(orderedIds: string[]): Promise<void> {
    const prompts = await getItems<JournalPrompt>(KEYS.JOURNAL_PROMPTS);
    for (let i = 0; i < orderedIds.length; i++) {
      const prompt = prompts.find((p) => p.id === orderedIds[i]);
      if (prompt) prompt.sort_order = i;
    }
    await setItems(KEYS.JOURNAL_PROMPTS, prompts);
  },
};

// ============ VISIONS SERVICE ============
export const localVisionsService = {
  async getVisions(): Promise<Vision[]> {
    const visions = await getItems<Vision>(KEYS.VISIONS);
    return visions.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order);
  },

  async createVision(text: string): Promise<Vision> {
    const visions = await getItems<Vision>(KEYS.VISIONS);
    const newVision: Vision = {
      id: generateId(),
      user_id: GUEST_USER_ID,
      text,
      is_active: true,
      sort_order: visions.length,
      created_at: new Date().toISOString(),
    };
    visions.push(newVision);
    await setItems(KEYS.VISIONS, visions);
    return newVision;
  },

  async updateVision(id: string, text: string): Promise<Vision> {
    const visions = await getItems<Vision>(KEYS.VISIONS);
    const index = visions.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vision not found');
    visions[index].text = text;
    await setItems(KEYS.VISIONS, visions);
    return visions[index];
  },

  async deleteVision(id: string): Promise<void> {
    const visions = await getItems<Vision>(KEYS.VISIONS);
    const index = visions.findIndex((v) => v.id === id);
    if (index >= 0) {
      visions[index].is_active = false;
      await setItems(KEYS.VISIONS, visions);
    }
  },

  async reorderVisions(orderedIds: string[]): Promise<void> {
    const visions = await getItems<Vision>(KEYS.VISIONS);
    for (let i = 0; i < orderedIds.length; i++) {
      const vision = visions.find((v) => v.id === orderedIds[i]);
      if (vision) vision.sort_order = i;
    }
    await setItems(KEYS.VISIONS, visions);
  },
};

// ============ CLEAR ALL GUEST DATA ============
export async function clearAllGuestData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.HABITS),
    AsyncStorage.removeItem(KEYS.HABIT_LOGS),
    AsyncStorage.removeItem(KEYS.GOALS),
    AsyncStorage.removeItem(KEYS.HABIT_GOAL_LINKS),
    AsyncStorage.removeItem(KEYS.MANTRAS),
    AsyncStorage.removeItem(KEYS.JOURNAL_PROMPTS),
    AsyncStorage.removeItem(KEYS.JOURNAL_ENTRIES),
    AsyncStorage.removeItem(KEYS.VISIONS),
  ]);
}
