import { Habit, MonthGoal, MonthReflection, ThemeId, WeekPlan } from '../types';
import { formatISODate, getMondayOfWeek, getWeekDays, getWeekId } from './date';

const STORAGE_KEYS = {
  THEME: 'unchaos_theme_v2',
  WEEKS: 'unchaos_weeks_v2',
  HABITS: 'unchaos_habits_v2',
  MONTH_GOALS: 'unchaos_month_goals_v2',
  MONTH_REFLECTIONS: 'unchaos_month_reflections_v2',
  SOUND_ENABLED: 'unchaos_sound_enabled_v2',
};

export function getStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeId;
    if (saved && ['sage', 'noir', 'rose', 'slate', 'latte'].includes(saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'sage'; // default matches the screenshot!
}

export function saveStoredTheme(theme: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore
  }
}

export function getStoredSound(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function saveStoredSound(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  } catch {
    // ignore
  }
}

export function getStoredHabits(): Habit[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }
  return createInitialHabits();
}

export function saveStoredHabits(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch {
    // ignore
  }
}

export function getStoredWeeks(): Record<string, WeekPlan> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }
  return createInitialWeeks();
}

export function saveStoredWeeks(weeks: Record<string, WeekPlan>) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEKS, JSON.stringify(weeks));
  } catch {
    // ignore
  }
}

export function getStoredMonthGoals(): MonthGoal[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTH_GOALS);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return createInitialMonthGoals();
}

export function saveStoredMonthGoals(goals: MonthGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTH_GOALS, JSON.stringify(goals));
  } catch {
    // ignore
  }
}

export function getStoredMonthReflections(): Record<string, MonthReflection> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTH_REFLECTIONS);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
}

export function saveStoredMonthReflections(data: Record<string, MonthReflection>) {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTH_REFLECTIONS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Initial habits inspired by screenshot
function createInitialHabits(): Habit[] {
  const currentMonday = getMondayOfWeek(new Date());
  const days = getWeekDays(currentMonday);

  const baseHabits = [
    { name: 'Wake up at 6:30', target: 7, daysChecked: [0, 1, 2, 3, 4] },
    { name: 'Drink 2L of water', target: 7, daysChecked: [0, 1, 2, 3, 4, 5] },
    { name: 'Cold shower', target: 5, daysChecked: [0, 1, 2] },
    { name: 'Gym / Movement', target: 5, daysChecked: [0, 2, 4] },
    { name: 'Reading 10 pages', target: 7, daysChecked: [0, 1, 2, 3] },
    { name: 'Budget tracking', target: 7, daysChecked: [0, 1, 2, 3, 4, 5] },
    { name: 'Deep work block (2h)', target: 5, daysChecked: [0, 1, 2, 3] },
    { name: 'Meditation (10m)', target: 7, daysChecked: [0, 1] },
    { name: 'No doomscrolling', target: 7, daysChecked: [0, 1, 2, 3, 4] },
  ];

  return baseHabits.map((h, idx) => {
    const history: Record<string, boolean> = {};
    h.daysChecked.forEach((dayIdx) => {
      if (days[dayIdx]) {
        history[days[dayIdx].dateStr] = true;
      }
    });

    return {
      id: `habit_${idx + 1}`,
      name: h.name,
      targetPerWeek: h.target,
      history,
    };
  });
}

function createInitialWeeks(): Record<string, WeekPlan> {
  const monday = getMondayOfWeek(new Date());
  const weekId = getWeekId(monday);
  const days = getWeekDays(monday);

  const sampleTasksPerDay: Record<number, { text: string; completed: boolean; priority?: 'high' | 'medium' | 'low' }[]> = {
    0: [
      { text: 'Deep work block (Focus project)', completed: true, priority: 'high' },
      { text: 'Progress review & sprint plan', completed: true, priority: 'medium' },
      { text: 'Focused learning session (45m)', completed: true, priority: 'low' },
      { text: 'Gym / upper body workout', completed: true, priority: 'medium' },
      { text: 'Laundry & tidy desk', completed: false, priority: 'low' },
      { text: 'Midweek reset prep', completed: false, priority: 'low' },
    ],
    1: [
      { text: 'Deep work: Architecture proposal', completed: true, priority: 'high' },
      { text: 'Client sync meeting & notes', completed: true, priority: 'high' },
      { text: 'Grocery top-up essentials', completed: true, priority: 'medium' },
      { text: 'Clean apartment counters', completed: true, priority: 'low' },
      { text: 'Prepare tomorrow meals', completed: true, priority: 'low' },
      { text: 'Evening reflection & reading', completed: true, priority: 'low' },
    ],
    2: [
      { text: 'Draft presentation slides', completed: true, priority: 'high' },
      { text: 'Midweek review of priority list', completed: true, priority: 'medium' },
      { text: 'Research client feedback', completed: false, priority: 'medium' },
      { text: 'Light mobility stretching', completed: false, priority: 'low' },
      { text: 'Organize desktop downloads', completed: false, priority: 'low' },
      { text: 'Early wind-down routine', completed: false, priority: 'low' },
    ],
    3: [
      { text: 'Polish slide deck visuals', completed: false, priority: 'high' },
      { text: 'Check invoices & accounts', completed: false, priority: 'medium' },
      { text: 'Team alignment check-in', completed: false, priority: 'high' },
      { text: '30 min brisk walk outside', completed: false, priority: 'low' },
      { text: 'Read 2 chapters before bed', completed: false, priority: 'low' },
    ],
    4: [
      { text: 'Deliver Friday presentation', completed: false, priority: 'high' },
      { text: 'Weekly retrospective log', completed: false, priority: 'medium' },
      { text: 'Zero inbox sprint', completed: false, priority: 'medium' },
      { text: 'Celebrate with reward treat', completed: false, priority: 'low' },
      { text: 'Plan weekend schedule', completed: false, priority: 'low' },
    ],
    5: [
      { text: 'Sleep in & slow morning coffee', completed: false, priority: 'low' },
      { text: 'Outdoor hike or park walk', completed: false, priority: 'medium' },
      { text: 'Meal prep for upcoming week', completed: false, priority: 'medium' },
      { text: 'Meet friends for dinner', completed: false, priority: 'low' },
    ],
    6: [
      { text: 'Weekly reset: Clean sheets & room', completed: false, priority: 'medium' },
      { text: 'Financial check & budget update', completed: false, priority: 'high' },
      { text: 'Plan next week priorities', completed: false, priority: 'high' },
      { text: 'Read book & relaxation', completed: false, priority: 'low' },
    ],
  };

  const dayPlans: Record<string, any> = {};
  days.forEach((day, idx) => {
    const rawTasks = sampleTasksPerDay[idx] || [];
    dayPlans[day.dateStr] = {
      date: day.dateStr,
      tasks: rawTasks.map((t, tIdx) => ({
        id: `task_${day.dateStr}_${tIdx + 1}`,
        text: t.text,
        completed: t.completed,
        priority: t.priority,
      })),
      topPriorities: [
        rawTasks[0]?.text || 'Complete primary focus',
        rawTasks[1]?.text || 'Maintain consistency',
        'Hydrate & sleep on time',
      ],
      notes: idx === 0 ? 'Start strong with high energy!' : '',
      reflection: idx === 0 ? 'Good focus during morning sprint.' : '',
    };
  });

  return {
    [weekId]: {
      weekId,
      startDate: days[0].dateStr,
      endDate: days[6].dateStr,
      weeklyFocus: "Friday's key presentation & launch",
      reward: 'New hoodie & specialty matcha 🎁',
      affirmation: 'One step at a time. Lock in and act.',
      days: dayPlans,
    },
  };
}

function createInitialMonthGoals(): MonthGoal[] {
  return [
    { id: 'mg_1', title: 'Complete Q2 system launch without overtime', category: 'career', completed: false },
    { id: 'mg_2', title: '20 gym/mobility sessions completed', category: 'health', completed: false },
    { id: 'mg_3', title: 'Save 25% of monthly income to emergency fund', category: 'finance', completed: true },
    { id: 'mg_4', title: 'Finish 2 non-fiction books & journal reflections', category: 'growth', completed: false },
  ];
}
