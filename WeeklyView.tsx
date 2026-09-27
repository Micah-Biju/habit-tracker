import React, { useState } from 'react';
import { Habit, ThemeConfig, WeekPlan, Priority } from '../types';
import { CircularProgress } from './CircularProgress';
import { BarChart } from './BarChart';
import { formatISODate, getWeekDays, parseISODate } from '../utils/date';
import { sound } from '../utils/audio';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  Gift,
  Sparkles,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';

interface WeeklyViewProps {
  weekPlan: WeekPlan;
  habits: Habit[];
  theme: ThemeConfig;
  onUpdateWeekPlan: (updated: WeekPlan) => void;
  onUpdateHabits: (updated: Habit[]) => void;
  onNavigateWeek: (direction: 'prev' | 'next' | 'current') => void;
  onSelectDayForFocus: (dateStr: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  weekPlan,
  habits,
  theme,
  onUpdateWeekPlan,
  onUpdateHabits,
  onNavigateWeek,
  onSelectDayForFocus,
}) => {
  const monday = parseISODate(weekPlan.startDate);
  const weekDays = getWeekDays(monday);
  const todayStr = formatISODate(new Date());

  // Local states for inputs
  const [newHabitName, setNewHabitName] = useState('');
  const [addingTaskForDay, setAddingTaskForDay] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [saveBanner, setSaveBanner] = useState(false);

  // Calculate Overall Progress statistics
  let totalTasks = 0;
  let completedTasks = 0;
  const barChartData = weekDays.map((d) => {
    const dayTasks = weekPlan.days[d.dateStr]?.tasks || [];
    const completed = dayTasks.filter((t) => t.completed).length;
    totalTasks += dayTasks.length;
    completedTasks += completed;
    return {
      dayLabel: d.shortDay,
      completed,
      total: dayTasks.length,
      isToday: d.dateStr === todayStr,
    };
  });

  const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Toggle Task Completion
  const toggleTask = (dateStr: string, taskId: string) => {
    const dayPlan = weekPlan.days[dateStr];
    if (!dayPlan) return;

    let becameAllComplete = false;
    const updatedTasks = dayPlan.tasks.map((task) => {
      if (task.id === taskId) {
        const nextState = !task.completed;
        if (nextState) sound.playCheck();
        else sound.playPop();
        return { ...task, completed: nextState };
      }
      return task;
    });

    const isNowAllDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
    const wasAllDone = dayPlan.tasks.every((t) => t.completed);
    if (isNowAllDone && !wasAllDone) {
      sound.playFanfare();
    }

    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [dateStr]: {
          ...dayPlan,
          tasks: updatedTasks,
        },
      },
    });
  };

  // Add Task to Day
  const handleAddTask = (dateStr: string) => {
    if (!newTaskText.trim()) return;
    const dayPlan = weekPlan.days[dateStr] || { date: dateStr, tasks: [] };
    const newTask = {
      id: `task_${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
    };

    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [dateStr]: {
          ...dayPlan,
          tasks: [...dayPlan.tasks, newTask],
        },
      },
    });

    setNewTaskText('');
    setAddingTaskForDay(null);
    sound.playPop();
  };

  // Delete Task
  const deleteTask = (dateStr: string, taskId: string) => {
    const dayPlan = weekPlan.days[dateStr];
    if (!dayPlan) return;

    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [dateStr]: {
          ...dayPlan,
          tasks: dayPlan.tasks.filter((t) => t.id !== taskId),
        },
      },
    });
    sound.playPop();
  };

  // Toggle Habit on a specific date
  const toggleHabit = (habitId: string, dateStr: string) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const current = Boolean(h.history[dateStr]);
        const next = !current;
        if (next) sound.playCheck();
        else sound.playPop();

        return {
          ...h,
          history: {
            ...h.history,
            [dateStr]: next,
          },
        };
      }
      return h;
    });
    onUpdateHabits(updated);
  };

  // Add Habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const newH: Habit = {
      id: `habit_${Date.now()}`,
      name: newHabitName.trim(),
      targetPerWeek: 7,
      history: {},
    };
    onUpdateHabits([...habits, newH]);
    setNewHabitName('');
    sound.playPop();
  };

  // Delete Habit
  const handleDeleteHabit = (id: string) => {
    onUpdateHabits(habits.filter((h) => h.id !== id));
    sound.playPop();
  };

  // Carry unfinished tasks to next day
  const carryIncompleteToTomorrow = (fromDateStr: string, toDateStr: string) => {
    const fromDay = weekPlan.days[fromDateStr];
    const toDay = weekPlan.days[toDateStr] || { date: toDateStr, tasks: [] };
    if (!fromDay) return;

    const incomplete = fromDay.tasks.filter((t) => !t.completed);
    if (incomplete.length === 0) return;

    const carriedTasks = incomplete.map((t) => ({
      ...t,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    }));

    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [toDateStr]: {
          ...toDay,
          tasks: [...toDay.tasks, ...carriedTasks],
        },
      },
    });
    sound.playPop();
  };

  const triggerSaveBanner = () => {
    setSaveBanner(true);
    sound.playPop();
    setTimeout(() => setSaveBanner(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls & Intentions Banner */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
        {/* Navigation & Date bar */}
        <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3 border-b border-stone-200/80 bg-stone-50/60 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateWeek('prev')}
              className="p-1.5 rounded-md hover:bg-stone-200/60 text-stone-600 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateWeek('current')}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-200/80 text-stone-700 hover:bg-stone-300/80 transition-colors"
            >
              Current Week
            </button>
            <button
              onClick={() => onNavigateWeek('next')}
              className="p-1.5 rounded-md hover:bg-stone-200/60 text-stone-600 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-stone-700 ml-1">
              {weekDays[0].displayDate} — {weekDays[6].displayDate}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saveBanner && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved to storage
              </span>
            )}
            <button
              onClick={triggerSaveBanner}
              className="px-3 py-1.5 text-xs font-medium text-white rounded shadow-xs hover:opacity-95 transition-opacity"
              style={{ backgroundColor: theme.primary }}
            >
              Save Intentions
            </button>
          </div>
        </div>

        {/* Intentions Form - Matching the screenshot top cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 md:p-6 bg-white text-xs">
          {/* Start of week */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Start of the week
            </span>
            <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/70 font-mono text-stone-800 font-medium">
              {weekDays[0].displayDate} ({weekDays[0].dayName})
            </div>
          </div>

          {/* Weekly Focus */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Weekly focus</span>
            </div>
            <input
              type="text"
              value={weekPlan.weeklyFocus}
              onChange={(e) => onUpdateWeekPlan({ ...weekPlan, weeklyFocus: e.target.value })}
              placeholder="e.g. Friday's presentation & product milestone"
              className="w-full p-2.5 rounded-lg border border-stone-200 focus:border-stone-900 focus:outline-hidden text-stone-800 font-medium transition-colors"
            />
          </div>

          {/* Reward */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <Gift className="w-3 h-3 text-rose-500" />
              <span>Reward upon completion</span>
            </div>
            <input
              type="text"
              value={weekPlan.reward}
              onChange={(e) => onUpdateWeekPlan({ ...weekPlan, reward: e.target.value })}
              placeholder="e.g. New hoodie & specialty dinner 🎁"
              className="w-full p-2.5 rounded-lg border border-stone-200 focus:border-stone-900 focus:outline-hidden text-stone-800 font-medium transition-colors"
            />
          </div>

          {/* Affirmation */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <Flame className="w-3 h-3 text-emerald-600" />
              <span>Affirmation</span>
            </div>
            <input
              type="text"
              value={weekPlan.affirmation}
              onChange={(e) => onUpdateWeekPlan({ ...weekPlan, affirmation: e.target.value })}
              placeholder="e.g. One step at a time. Lock in and act."
              className="w-full p-2.5 rounded-lg border border-stone-200 focus:border-stone-900 focus:outline-hidden text-stone-800 font-medium transition-colors italic"
            />
          </div>
        </div>
      </div>

      {/* Middle Grid: Overall Progress + Habit Tracker Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Overall Progress Dashboard (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Overall Progress</h2>
              <p className="text-xs text-stone-500">Weekly task throughput across 7 days</p>
            </div>
            <div
              className="px-2.5 py-1 rounded text-xs font-mono font-bold"
              style={{ backgroundColor: theme.primaryLight, color: theme.primaryDark }}
            >
              {completedTasks} / {totalTasks} tasks
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Master Circular Gauge */}
            <div className="shrink-0 flex flex-col items-center">
              <CircularProgress
                percentage={overallPercent}
                size={130}
                strokeWidth={12}
                color={theme.ringColor}
                trackColor={theme.ringTrack}
                sublabel={`${completedTasks} / ${totalTasks} completed`}
              />
            </div>

            {/* Daily Bar Chart */}
            <div className="flex-1 w-full">
              <BarChart
                data={barChartData}
                barColor={theme.chartBar}
                emptyColor={theme.chartBarEmpty}
              />
            </div>
          </div>
        </div>

        {/* Habit Tracker Matrix (7 cols) - Matches the exact spreadsheet matrix from Screenshot 1 & 2 */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Header banner */}
          <div
            className="px-5 py-3 flex items-center justify-between text-white"
            style={{ backgroundColor: theme.headerBg }}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-white/90" />
              <h2 className="text-sm font-bold tracking-tight">Habit Tracker</h2>
            </div>
            <span className="text-xs text-white/80 font-mono">
              Daily Consistency
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-mono">
                  <th className="py-2.5 px-3 font-semibold text-stone-700 min-w-[150px]">Habit</th>
                  {weekDays.map((d) => (
                    <th
                      key={d.dateStr}
                      className={`py-2 px-2 text-center font-semibold text-[11px] ${
                        d.dateStr === todayStr ? 'text-stone-900 bg-stone-200/40' : 'text-stone-600'
                      }`}
                    >
                      {d.shortDay}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-semibold min-w-[90px]">Progress</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {habits.map((habit) => {
                  let completedCount = 0;
                  weekDays.forEach((d) => {
                    if (habit.history[d.dateStr]) completedCount++;
                  });
                  const habitPercent = Math.round((completedCount / weekDays.length) * 100);

                  return (
                    <tr key={habit.id} className="hover:bg-stone-50/70 transition-colors group">
                      {/* Habit Name */}
                      <td className="py-2.5 px-3 font-medium text-stone-800">
                        <span>{habit.name}</span>
                      </td>

                      {/* Day Checkboxes */}
                      {weekDays.map((d) => {
                        const isChecked = Boolean(habit.history[d.dateStr]);
                        return (
                          <td
                            key={d.dateStr}
                            className={`py-2 px-2 text-center ${
                              d.dateStr === todayStr ? 'bg-stone-50/50' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleHabit(habit.id, d.dateStr)}
                              className={`w-6 h-6 rounded-md border flex items-center justify-center mx-auto transition-all ${
                                isChecked
                                  ? 'border-transparent text-white shadow-2xs scale-105'
                                  : 'border-stone-300 hover:border-stone-400 bg-white'
                              }`}
                              style={{
                                backgroundColor: isChecked ? theme.primary : 'transparent',
                              }}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Progress Bar & Percentage */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${habitPercent}%`,
                                backgroundColor: theme.primary,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-stone-700 w-8 tabular-nums">
                            {habitPercent}%
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-1 text-right">
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 p-1 transition-opacity"
                          title="Delete habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Habit Row */}
          <form onSubmit={handleAddHabit} className="p-2.5 bg-stone-50/60 border-t border-stone-200/80 flex items-center gap-2">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="+ Add new habit (e.g. Mobility work, No sugar, Study)..."
              className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded text-xs focus:border-stone-900 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white rounded hover:opacity-90 transition-opacity"
              style={{ backgroundColor: theme.primary }}
            >
              Add Habit
            </button>
          </form>
        </div>
      </div>

      {/* 7 Daily Columns Grid - The exact signature layout from Unchaos Lab screenshots */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">Daily Planner Columns</h2>
            <p className="text-xs text-stone-500">Day-by-day task execution & progress rings</p>
          </div>
          <span className="text-xs font-mono text-stone-400 hidden sm:inline">
            Tip: Click day headers to open deep focus mode
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {weekDays.map((d, dayIdx) => {
            const dayPlan = weekPlan.days[d.dateStr] || { date: d.dateStr, tasks: [] };
            const tasks = dayPlan.tasks || [];
            const doneCount = tasks.filter((t) => t.completed).length;
            const leftCount = tasks.length - doneCount;
            const dayPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
            const isToday = d.dateStr === todayStr;

            return (
              <div
                key={d.dateStr}
                className={`bg-white rounded-xl border flex flex-col transition-all overflow-hidden shadow-2xs ${
                  isToday
                    ? 'border-stone-800 ring-1 ring-stone-800'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Header Banner - Colored day banner with date */}
                <div
                  className="px-3.5 py-3 text-center cursor-pointer transition-opacity hover:opacity-95"
                  style={{
                    backgroundColor: theme.headerBg,
                    color: theme.headerText,
                  }}
                  onClick={() => onSelectDayForFocus(d.dateStr)}
                  title="Click to open Daily Focus view"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold tracking-tight uppercase">
                      {d.dayName}
                    </span>
                    {isToday && (
                      <span className="text-[10px] bg-white/20 font-bold px-1.5 py-0.5 rounded text-white font-mono">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono opacity-90 block">
                    {d.displayDate}
                  </span>
                </div>

                {/* Circular Progress Section */}
                <div className="p-3 bg-stone-50/40 border-b border-stone-100 flex flex-col items-center justify-center">
                  <CircularProgress
                    percentage={dayPercent}
                    size={76}
                    strokeWidth={8}
                    color={theme.ringColor}
                    trackColor={theme.ringTrack}
                  />
                </div>

                {/* Tasks Header Bar */}
                <div className="px-3 py-1.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 uppercase text-[10px] tracking-wider">
                    Tasks
                  </span>
                  <button
                    onClick={() => {
                      setAddingTaskForDay(d.dateStr);
                      setNewTaskText('');
                    }}
                    className="p-0.5 hover:bg-stone-200 rounded text-stone-600 transition-colors"
                    title="Add task"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Add Task Form if open */}
                {addingTaskForDay === d.dateStr && (
                  <div className="p-2 border-b border-stone-200 bg-stone-50 space-y-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(d.dateStr);
                        if (e.key === 'Escape') setAddingTaskForDay(null);
                      }}
                      placeholder="Task description..."
                      className="w-full text-xs px-2 py-1 bg-white border border-stone-200 rounded focus:outline-hidden focus:border-stone-800"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                        className="text-[10px] px-1 py-0.5 border border-stone-200 rounded bg-white text-stone-700"
                      >
                        <option value="high">High priority</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAddingTaskForDay(null)}
                          className="px-2 py-0.5 text-stone-500 hover:text-stone-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddTask(d.dateStr)}
                          className="px-2 py-0.5 bg-stone-900 text-white rounded text-[11px] font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task List items */}
                <div className="p-2 flex-1 space-y-1.5 min-h-[170px] max-h-[360px] overflow-y-auto">
                  {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-3 text-stone-400">
                      <span className="text-xs">No tasks yet</span>
                      <button
                        onClick={() => setAddingTaskForDay(d.dateStr)}
                        className="mt-1 text-[11px] text-stone-600 underline hover:text-stone-900"
                      >
                        + Add task
                      </button>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`group flex items-start gap-2 p-1.5 rounded-md hover:bg-stone-50 transition-colors text-xs ${
                          task.completed ? 'opacity-55' : ''
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(d.dateStr, task.id)}
                          className={`w-4 h-4 mt-0.5 rounded-xs border shrink-0 flex items-center justify-center transition-all ${
                            task.completed
                              ? 'border-transparent text-white'
                              : 'border-stone-300 hover:border-stone-500 bg-white'
                          }`}
                          style={{
                            backgroundColor: task.completed ? theme.primary : 'transparent',
                          }}
                        >
                          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`block break-words leading-tight ${
                              task.completed
                                ? 'line-through text-stone-400'
                                : 'text-stone-800 font-medium'
                            }`}
                          >
                            {task.text}
                          </span>
                          {task.priority === 'high' && !task.completed && (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-rose-600 mt-0.5">
                              High Priority
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => deleteTask(d.dateStr, task.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-600 transition-opacity p-0.5 shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Day Footer - Matching Screenshot 1 & 2 ("Done 4 / Left 4") */}
                <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-500">
                  <span>
                    Done <strong className="text-stone-800">{doneCount}</strong>
                    {' · '}
                    Left <strong className="text-stone-800">{leftCount}</strong>
                  </span>

                  {/* Move unfinished tasks to tomorrow button if incomplete tasks exist and not Sunday */}
                  {leftCount > 0 && dayIdx < 6 && (
                    <button
                      onClick={() => carryIncompleteToTomorrow(d.dateStr, weekDays[dayIdx + 1].dateStr)}
                      className="text-stone-400 hover:text-stone-800 p-0.5"
                      title="Move unfinished tasks to tomorrow"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
