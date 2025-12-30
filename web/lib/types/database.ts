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
          avatar_url: string | null;
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
          avatar_url?: string | null;
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
          avatar_url?: string | null;
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
          template_text: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt: string;
          template_text?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt?: string;
          template_text?: string | null;
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
          screenshot_url: string | null;
          resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email?: string | null;
          message: string;
          screenshot_url?: string | null;
          resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string | null;
          message?: string;
          screenshot_url?: string | null;
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
          note_type: 'text' | 'canvas';
          canvas_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          note_type?: 'text' | 'canvas';
          canvas_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          note_type?: 'text' | 'canvas';
          canvas_data?: Record<string, unknown> | null;
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
          completed: boolean;
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
          completed?: boolean;
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
          completed?: boolean;
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
      google_calendar_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expiry: string;
          calendar_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expiry: string;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          token_expiry?: string;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          wake_time: string;
          bed_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wake_time?: string;
          bed_time?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wake_time?: string;
          bed_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_notes: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      kanban_columns: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      kanban_cards: {
        Row: {
          id: string;
          user_id: string;
          column_id: string;
          title: string;
          description: string;
          status: 'todo' | 'in_progress' | 'done';
          tags: string[];
          high_priority: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          column_id: string;
          title: string;
          description?: string;
          status?: 'todo' | 'in_progress' | 'done';
          tags?: string[];
          high_priority?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          column_id?: string;
          title?: string;
          description?: string;
          status?: 'todo' | 'in_progress' | 'done';
          tags?: string[];
          high_priority?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      kanban_subtasks: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          text: string;
          completed: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          text: string;
          completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          text?: string;
          completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      kanban_goal_links: {
        Row: {
          id: string;
          card_id: string;
          goal_id: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          goal_id: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          goal_id?: string;
        };
      };
      schedule_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          template_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          template_data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          template_data?: Json;
          created_at?: string;
          updated_at?: string;
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
export type CalendarRule = Database['public']['Tables']['calendar_rules']['Row'];
export type GoogleCalendarToken = Database['public']['Tables']['google_calendar_tokens']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type DailyNote = Database['public']['Tables']['daily_notes']['Row'];
export type DailyScore = Database['public']['Views']['daily_scores']['Row'];
export type KanbanColumn = Database['public']['Tables']['kanban_columns']['Row'];
export type KanbanCard = Database['public']['Tables']['kanban_cards']['Row'];
export type KanbanSubtask = Database['public']['Tables']['kanban_subtasks']['Row'];
export type KanbanGoalLink = Database['public']['Tables']['kanban_goal_links']['Row'];
export type ScheduleTemplate = Database['public']['Tables']['schedule_templates']['Row'];

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

// Extended types for Kanban UI
export type KanbanCardWithDetails = KanbanCard & {
  subtasks: KanbanSubtask[];
  goal: Goal | null;
  column: KanbanColumn;
};

export type KanbanColumnWithCards = KanbanColumn & {
  todoCards: KanbanCardWithDetails[];
  inProgressCards: KanbanCardWithDetails[];
  doneCards: KanbanCardWithDetails[];
};
