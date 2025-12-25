export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          subscription_tier: 'free' | 'pro';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: 'inactive' | 'active' | 'canceled' | 'past_due';
          subscription_current_period_end: string | null;
          onboarding_completed: boolean;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          subscription_tier?: 'free' | 'pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'inactive' | 'active' | 'canceled' | 'past_due';
          subscription_current_period_end?: string | null;
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          subscription_tier?: 'free' | 'pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'inactive' | 'active' | 'canceled' | 'past_due';
          subscription_current_period_end?: string | null;
          onboarding_completed?: boolean;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          weight: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          weight?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          weight?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          date: string;
          completed: boolean;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          date?: string;
          completed?: boolean;
        };
        Update: {
          id?: string;
          habit_id?: string;
          user_id?: string;
          date?: string;
          completed?: boolean;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          metric_name: string;
          metric_target: number;
          metric_current: number;
          deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          metric_name: string;
          metric_target: number;
          metric_current?: number;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          metric_name?: string;
          metric_target?: number;
          metric_current?: number;
          deadline?: string | null;
          created_at?: string;
        };
      };
      habit_goal_links: {
        Row: {
          id: string;
          habit_id: string;
          goal_id: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          goal_id: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          goal_id?: string;
        };
      };
      mantras: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      journal_prompts: {
        Row: {
          id: string;
          user_id: string;
          prompt: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          prompt_id: string;
          user_id: string;
          entry: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          user_id: string;
          entry: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          user_id?: string;
          entry?: string;
          date?: string;
          created_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          date: string;
          completed: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          date: string;
          completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          date?: string;
          completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      visions: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_email: string | null;
          message: string;
          resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email?: string | null;
          message: string;
          resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string | null;
          message?: string;
          resolved?: boolean;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedule_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          date: string;
          start_time: string;
          end_time: string;
          is_ai_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          is_ai_generated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          is_ai_generated?: boolean;
          created_at?: string;
        };
      };
      habit_miss_notes: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          date: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          date: string;
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          date?: string;
          note?: string;
          created_at?: string;
        };
      };
      calendar_rules: {
        Row: {
          id: string;
          user_id: string;
          rule_text: string;
          is_active: boolean;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rule_text: string;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rule_text?: string;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      daily_scores: {
        Row: {
          user_id: string;
          date: string;
          score: number;
          completed_count: number;
          total_count: number;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitLog = Database['public']['Tables']['habit_logs']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type HabitGoalLink = Database['public']['Tables']['habit_goal_links']['Row'];
export type Mantra = Database['public']['Tables']['mantras']['Row'];
export type JournalPrompt = Database['public']['Tables']['journal_prompts']['Row'];
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type Todo = Database['public']['Tables']['todos']['Row'];
export type Vision = Database['public']['Tables']['visions']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type ScheduleEvent = Database['public']['Tables']['schedule_events']['Row'];
export type HabitMissNote = Database['public']['Tables']['habit_miss_notes']['Row'];
export type DailyScore = Database['public']['Views']['daily_scores']['Row'];

// Extended types for UI
export type HabitWithLog = Habit & {
  completed: boolean;
  missNote: string | null;
};

export type GoalWithHabits = Goal & {
  habits: Habit[];
  progress: number; // 0-100
};

export type JournalPromptWithEntry = JournalPrompt & {
  todayEntry: string | null;
};

// Unified item type for the Today screen drag-and-drop
export type TodayItem =
  | { type: 'mantra'; data: Mantra }
  | { type: 'habit'; data: HabitWithLog }
  | { type: 'journal'; data: JournalPromptWithEntry }
  | { type: 'todo'; data: Todo }
  | { type: 'vision'; data: Vision };
