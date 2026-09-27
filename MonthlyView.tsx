import React, { useState } from 'react';
import { Habit, MonthGoal, MonthReflection, ThemeConfig, WeekPlan } from '../types';
import { formatISODate, getMonthCalendarDays } from '../utils/date';
import { sound } from '../utils/audio';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  Trophy,
  Target
} from 'lucide-react';

interface MonthlyViewProps {
  currentDate: Date;
  weeks: Record<string, WeekPlan>;
  habits: Habit[];
  monthGoals: MonthGoal[];
  monthReflections: Record<string, MonthReflection>;
  theme: ThemeConfig;
  onUpdateMonthGoals: (goals: MonthGoal[]) => void;
  onUpdateMonthReflections: (reflections: Record<string, MonthReflection>) => void;
  onSelectDateForFocus: (dateStr: string) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  currentDate,
  weeks,
  habits,
  monthGoals,
  monthReflections,
  theme,
  onUpdateMonthGoals,
  onUpdateMonthReflections,
  onSelectDateForFocus,
}) => {
  const [activeDate, setActiveDate] = useState<Date>(new Date(currentDate));
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'career' | 'health' | 'finance' | 'growth'>('career');

  const year = activeDate.getFullYear();
  const monthIndex = activeDate.getMonth();
  const monthId = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const monthName = activeDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = getMonthCalendarDays(year, monthIndex);
  const todayStr = formatISODate(new Date());

  // Aggregate daily tasks across all stored weeks
  const getDayTaskStats = (dateStr: string) => {
    for (const week of Object.values(weeks)) {
      if (week.days && week.days[dateStr]) {
        const tasks = week.days[dateStr].tasks || [];
        const completed = tasks.filter((t) => t.completed).length;
        return { completed, total: tasks.length };
      }
    }
    return { completed: 0, total: 0 };
  };

  // Days in this month for habit matrix
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthDayList = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return { dayNum, dateStr };
  });

  const currentReflection = monthReflections[monthId] || {
    monthId,
    highlight: '',
    lessonLearned: '',
    nextMonthIntention: '',
  };

  // Navigate months
  const prevMonth = () => {
    setActiveDate(new Date(year, monthIndex - 1, 1));
  };
  const nextMonth = () => {
    setActiveDate(new Date(year, monthIndex + 1, 1));
  };

  // Toggle Goal
  const toggleGoal = (id: string) => {
    const updated = monthGoals.map((g) => {
      if (g.id === id) {
        const next = !g.completed;
        if (next) sound.playCheck();
        else sound.playPop();
        return { ...g, completed: next };
      }
      return g;
    });
    onUpdateMonthGoals(updated);
  };

  // Add Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newG: MonthGoal = {
      id: `mg_${Date.now()}`,
      title: newGoalText.trim(),
      category: newGoalCategory,
      completed: false,
    };
    onUpdateMonthGoals([...monthGoals, newG]);
    setNewGoalText('');
    sound.playPop();
  };

  // Delete Goal
  const deleteGoal = (id: string) => {
    onUpdateMonthGoals(monthGoals.filter((g) => g.id !== id));
    sound.playPop();
  };

  // Update reflections
  const updateReflectionField = (field: keyof MonthReflection, value: string) => {
    onUpdateMonthReflections({
      ...monthReflections,
      [monthId]: {
        ...currentReflection,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Month Navigation Banner */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: theme.primary }}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block">
              Monthly Overview
            </span>
            <h1 className="text-xl font-bold text-stone-900">{monthName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Month Calendar & Monthly Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h2 className="text-sm font-bold text-stone-900">Monthly Calendar & Execution</h2>
            <span className="text-xs text-stone-500 font-mono">Click any day to focus</span>
          </div>

          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-stone-400 pb-2 border-b border-stone-100">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {calendarDays.map((cell, idx) => {
                const isToday = cell.dateStr === todayStr;
                const stats = getDayTaskStats(cell.dateStr);
                const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectDateForFocus(cell.dateStr)}
                    className={`min-h-[70px] p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      cell.isCurrentMonth ? 'bg-white hover:border-stone-400' : 'bg-stone-50/50 text-stone-300 border-transparent'
                    } ${
                      isToday
                        ? 'border-stone-900 ring-1 ring-stone-900 shadow-2xs'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'text-stone-900 underline'
                            : cell.isCurrentMonth
                            ? 'text-stone-800'
                            : 'text-stone-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                      )}
                    </div>

                    {/* Progress indicator */}
                    {stats.total > 0 && cell.isCurrentMonth && (
                      <div className="mt-auto pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-0.5">
                          <span>{percent}%</span>
                          <span>{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: theme.primary,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Goals & Focus Pillars (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-bold text-stone-900">Monthly Focus Goals</h2>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {monthGoals.filter((g) => g.completed).length} / {monthGoals.length} achieved
            </span>
          </div>

          {/* Goal items */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {monthGoals.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No goals set for this month yet.</p>
            ) : (
              monthGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 group transition-all ${
                    goal.completed ? 'bg-stone-50 border-stone-200 opacity-60' : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        goal.completed ? 'border-transparent text-white' : 'border-stone-300 bg-white'
                      }`}
                      style={{
                        backgroundColor: goal.completed ? theme.primary : 'transparent',
                      }}
                    >
                      {goal.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <span
                        className={`text-xs font-medium block leading-snug ${
                          goal.completed ? 'line-through text-stone-400' : 'text-stone-800'
                        }`}
                      >
                        {goal.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                        {goal.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-600 p-1 transition-opacity"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Goal Form */}
          <form onSubmit={handleAddGoal} className="pt-2 border-t border-stone-100 flex items-center gap-2">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="+ New monthly milestone..."
              className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-md focus:border-stone-800 focus:outline-hidden"
            />
            <select
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value as any)}
              className="text-xs px-2 py-2 border border-stone-200 rounded-md bg-stone-50 text-stone-700"
            >
              <option value="career">Career</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="growth">Growth</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: theme.primary }}
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Monthly Habit Heatmap */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div
          className="px-5 py-3 text-white flex items-center justify-between"
          style={{ backgroundColor: theme.headerBg }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-white/90" />
            <h2 className="text-sm font-bold">Monthly Habit Consistency Matrix</h2>
          </div>
          <span className="text-xs text-white/80 font-mono">
            {monthName}
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-mono text-[10px]">
                <th className="py-2 px-3 font-semibold text-stone-700 min-w-[160px]">Habit</th>
                {monthDayList.map((d) => (
                  <th
                    key={d.dayNum}
                    className={`py-1 px-1 text-center font-semibold w-7 ${
                      d.dateStr === todayStr ? 'text-stone-900 bg-stone-200/50 rounded-t' : ''
                    }`}
                  >
                    {d.dayNum}
                  </th>
                ))}
                <th className="py-2 px-3 text-right font-semibold min-w-[70px]">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {habits.map((habit) => {
                let count = 0;
                monthDayList.forEach((d) => {
                  if (habit.history[d.dateStr]) count++;
                });
                const pct = Math.round((count / monthDayList.length) * 100);

                return (
                  <tr key={habit.id} className="hover:bg-stone-50/70">
                    <td className="py-2.5 px-3 font-medium text-stone-800">
                      {habit.name}
                    </td>

                    {monthDayList.map((d) => {
                      const isDone = Boolean(habit.history[d.dateStr]);
                      return (
                        <td
                          key={d.dayNum}
                          className={`py-1 px-1 text-center ${
                            d.dateStr === todayStr ? 'bg-stone-50' : ''
                          }`}
                        >
                          <div
                            className={`w-5 h-5 mx-auto rounded-xs border transition-colors flex items-center justify-center text-[10px] ${
                              isDone
                                ? 'border-transparent text-white font-bold'
                                : 'border-stone-200 bg-stone-100/40'
                            }`}
                            style={{
                              backgroundColor: isDone ? theme.primary : undefined,
                            }}
                          >
                            {isDone && '✓'}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-right font-mono font-semibold text-stone-700">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Retrospective & Review Notes */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Sparkles className="w-4 h-4 text-stone-700" />
          <h2 className="text-sm font-bold text-stone-900">Monthly Retrospective & Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <span className="font-bold text-stone-700 block">Biggest Win / Accomplishment</span>
            <textarea
              rows={3}
              value={currentReflection.highlight}
              onChange={(e) => updateReflectionField('highlight', e.target.value)}
              placeholder="What made you proud this month?..."
              className="w-full p-2.5 border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-hidden text-stone-800"
            />
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-stone-700 block">Key Lesson & Friction</span>
            <textarea
              rows={3}
              value={currentReflection.lessonLearned}
              onChange={(e) => updateReflectionField('lessonLearned', e.target.value)}
              placeholder="What friction occurred and how will you adapt?..."
              className="w-full p-2.5 border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-hidden text-stone-800"
            />
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-stone-700 block">Next Month Prime Directive</span>
            <textarea
              rows={3}
              value={currentReflection.nextMonthIntention}
              onChange={(e) => updateReflectionField('nextMonthIntention', e.target.value)}
              placeholder="Primary milestone for the upcoming month..."
              className="w-full p-2.5 border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-hidden text-stone-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
