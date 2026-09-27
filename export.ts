import { Habit, WeekPlan } from '../types';
import { getWeekDays, parseISODate } from './date';

export function exportWeekToCSV(weekPlan: WeekPlan, habits: Habit[]): void {
  const days = getWeekDays(parseISODate(weekPlan.startDate));
  const lines: string[] = [];

  // Title & Metadata
  lines.push(`"UNCHAS PLANNER — ${weekPlan.weekId}"`);
  lines.push(`"Start of week:","${weekPlan.startDate}","End of week:","${weekPlan.endDate}"`);
  lines.push(`"Weekly Focus:","${weekPlan.weeklyFocus.replace(/"/g, '""')}"`);
  lines.push(`"Reward:","${weekPlan.reward.replace(/"/g, '""')}"`);
  lines.push(`"Affirmation:","${weekPlan.affirmation.replace(/"/g, '""')}"`);
  lines.push('');

  // Habits Section
  lines.push('"--- HABIT TRACKER ---"');
  const habitHeader = ['Habit', ...days.map((d) => `${d.dayName} (${d.displayDate})`), 'Progress %'];
  lines.push(habitHeader.map((h) => `"${h}"`).join(','));

  habits.forEach((habit) => {
    let completedCount = 0;
    const dayCols = days.map((d) => {
      const isDone = Boolean(habit.history[d.dateStr]);
      if (isDone) completedCount++;
      return isDone ? 'DONE' : '-';
    });
    const pct = Math.round((completedCount / days.length) * 100);
    lines.push([`"${habit.name.replace(/"/g, '""')}"`, ...dayCols.map((c) => `"${c}"`), `"${pct}%"`].join(','));
  });

  lines.push('');
  lines.push('"--- DAILY TASKS ---"');

  // Daily Tasks Columns
  const dayNamesHeader = days.map((d) => `"${d.dayName} (${d.displayDate})"`).join(',');
  lines.push(dayNamesHeader);

  // Find max tasks in any day
  let maxTasks = 0;
  days.forEach((d) => {
    const count = weekPlan.days[d.dateStr]?.tasks?.length || 0;
    if (count > maxTasks) maxTasks = count;
  });

  for (let i = 0; i < maxTasks; i++) {
    const row = days.map((d) => {
      const task = weekPlan.days[d.dateStr]?.tasks?.[i];
      if (!task) return '""';
      const status = task.completed ? '[x]' : '[ ]';
      return `"${status} ${task.text.replace(/"/g, '""')}"`;
    });
    lines.push(row.join(','));
  }

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `unchaos-planner-${weekPlan.weekId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON(data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `unchaos-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
