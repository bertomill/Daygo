# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

**DayGo** is a habit tracking and daily planning web app built with Next.js 16 (App Router), Supabase, and TanStack Query.

### Core Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand (auth, theme) + TanStack Query (server state)
- **Styling**: Tailwind CSS with custom brand colors defined in `tailwind.config.js`
- **AI**: OpenAI API for pep talks and schedule planning

### Project Structure

```
app/
├── (dashboard)/       # Protected routes with bottom nav layout
│   ├── today/         # Main daily view with habits, schedule, mantras
│   ├── goals/         # Goal management with habit linking
│   ├── notes/         # Notes with date filtering
│   └── profile/       # User settings
├── api/               # API routes (pep-talk, stripe, google-calendar, calendar-rules)
├── auth/callback/     # Supabase auth callback handler
├── login/, register/, onboarding/  # Auth flow pages
└── providers.tsx      # QueryClient + auth/theme initialization

lib/
├── supabase.ts        # Supabase client (browser)
├── supabase-admin.ts  # Supabase admin client (server, bypasses RLS)
├── auth-store.ts      # Zustand auth state
├── theme-store.ts     # Zustand theme state
├── types/database.ts  # TypeScript types for all Supabase tables
└── services/          # Data access layer for each entity
    ├── habits.ts      # Habits with completion logs and miss notes
    ├── schedule.ts    # Schedule events (manual + AI-generated)
    ├── googleCalendar.ts  # Google Calendar OAuth + sync
    └── [entity].ts    # One service per table

components/            # UI components (cards, modals, editors)
```

### Key Patterns

**Services Layer**: All Supabase queries go through `lib/services/`. Each service exports a single object with async methods (e.g., `habitsService.getHabits()`).

**Query Keys**: TanStack Query uses consistent key patterns: `['entity', userId, date?]`

**Type System**: `lib/types/database.ts` defines the full Supabase schema with Row/Insert/Update types plus convenience aliases and extended UI types (e.g., `HabitWithLog`, `GoalWithHabits`).

**Auth Flow**: `useAuthStore` from Zustand handles session state. Protected routes check `initialized && user` in the dashboard layout.

**Path Aliases**:
- `@/*` → project root
- `@shared/*` → `../src/*` (shared with mobile app)

### Database Tables
Main entities: `profiles`, `habits`, `habit_logs`, `goals`, `habit_goal_links`, `mantras`, `journal_prompts`, `journal_entries`, `todos`, `visions`, `notes`, `schedule_events`, `calendar_rules`, `google_calendar_tokens`, `user_preferences`, `daily_notes`, `feedback`

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side admin operations)
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (for Google Calendar)
- Stripe keys for subscription features
