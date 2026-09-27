export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority?: Priority;
  category?: string;
  time?: string;
}

export interface Habit {
  id: string;
  name: string;
  category?: string;
  targetPerWeek: number; // e.g. 7 days or 5 days
  history: Record<string, boolean>; // date "YYYY-MM-DD" -> completed
}

export interface DayPlan {
  date: string; // "YYYY-MM-DD"
  tasks: Task[];
  topPriorities?: string[]; // Top 3 non-negotiables
  notes?: string;
  reflection?: string;
  mood?: string;
}

export interface WeekPlan {
  weekId: string; // e.g. "2026-W13"
  startDate: string; // "YYYY-MM-DD" (Monday)
  endDate: string; // "YYYY-MM-DD" (Sunday)
  weeklyFocus: string;
  reward: string;
  affirmation: string;
  days: Record<string, DayPlan>; // date -> DayPlan
}

export interface MonthGoal {
  id: string;
  title: string;
  category: 'career' | 'health' | 'finance' | 'growth';
  completed: boolean;
}

export interface MonthReflection {
  monthId: string; // "2026-03"
  highlight: string;
  lessonLearned: string;
  nextMonthIntention: string;
}

export type ThemeId = 'sage' | 'noir' | 'rose' | 'slate' | 'latte';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  primary: string; // hex
  primaryDark: string;
  primaryLight: string;
  accent: string;
  surface: string;
  surfaceBorder: string;
  pillBg: string;
  chartBar: string;
  chartBarEmpty: string;
  ringColor: string;
  ringTrack: string;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
}

export type ViewMode = 'weekly' | 'daily' | 'monthly';
