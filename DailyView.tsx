import React, { useState, useEffect, useRef } from 'react';
import { Habit, ThemeConfig, WeekPlan, Priority, Task } from '../types';
import { CircularProgress } from './CircularProgress';
import { formatISODate, getWeekDays, parseISODate } from '../utils/date';
import { sound } from '../utils/audio';
import {
  Lock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  Target
} from 'lucide-react';

interface DailyViewProps {
  weekPlan: WeekPlan;
  habits: Habit[];
  theme: ThemeConfig;
  selectedDate: string; // ISO date string
  onSelectDate: (dateStr: string) => void;
  onUpdateWeekPlan: (updated: WeekPlan) => void;
  onUpdateHabits: (updated: Habit[]) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  weekPlan,
  habits,
  theme,
  selectedDate,
  onSelectDate,
  onUpdateWeekPlan,
  onUpdateHabits,
}) => {
  const monday = parseISODate(weekPlan.startDate);
  const weekDays = getWeekDays(monday);

  // Focus Pomodoro Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [whiteNoiseOn, setWhiteNoiseOn] = useState(false);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const noiseCtxRef = useRef<AudioContext | null>(null);

  // Task creation state
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const currentDayPlan = weekPlan.days[selectedDate] || {
    date: selectedDate,
    tasks: [],
    topPriorities: ['', '', ''],
    reflection: '',
  };

  const tasks = currentDayPlan.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const dayPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Selected date info
  const selectedDayInfo = weekDays.find((d) => d.dateStr === selectedDate) || {
    dateStr: selectedDate,
    dayName: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }),
    displayDate: selectedDate,
    shortDay: 'Day',
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      sound.playTimerBell();
      setIsTimerRunning(false);
      if (timerMode === 'work') {
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        setTimerMode('work');
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode]);

  // Ambient sound synthesizer
  const toggleWhiteNoise = () => {
    if (whiteNoiseOn) {
      if (noiseCtxRef.current) {
        noiseCtxRef.current.close().catch(() => {});
        noiseCtxRef.current = null;
      }
      setWhiteNoiseOn(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        noiseCtxRef.current = ctx;

        // Generate gentle soothing brown/pink filtered noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        whiteNoise.start(0);
        noiseNodeRef.current = whiteNoise;
        setWhiteNoiseOn(true);
      } catch {
        setWhiteNoiseOn(false);
      }
    }
  };

  // Clean up audio node on unmount
  useEffect(() => {
    return () => {
      if (noiseCtxRef.current) {
        noiseCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Toggle Task Completion
  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const next = !t.completed;
        if (next) sound.playCheck();
        else sound.playPop();
        return { ...t, completed: next };
      }
      return t;
    });

    const isAllDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
    if (isAllDone && !tasks.every((t) => t.completed)) {
      sound.playFanfare();
    }

    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [selectedDate]: {
          ...currentDayPlan,
          tasks: updatedTasks,
        },
      },
    });
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
    };

    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [selectedDate]: {
          ...currentDayPlan,
          tasks: [...tasks, newTask],
        },
      },
    });

    setNewTaskText('');
    sound.playPop();
  };

  // Delete Task
  const deleteTask = (taskId: string) => {
    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [selectedDate]: {
          ...currentDayPlan,
          tasks: tasks.filter((t) => t.id !== taskId),
        },
      },
    });
    sound.playPop();
  };

  // Toggle Habit for this day
  const toggleHabitForToday = (habitId: string) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const current = Boolean(h.history[selectedDate]);
        const next = !current;
        if (next) sound.playCheck();
        else sound.playPop();

        return {
          ...h,
          history: {
            ...h.history,
            [selectedDate]: next,
          },
        };
      }
      return h;
    });
    onUpdateHabits(updated);
  };

  // Top priorities updater
  const updateTopPriority = (index: number, value: string) => {
    const priorities = [...(currentDayPlan.topPriorities || ['', '', ''])];
    priorities[index] = value;
    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [selectedDate]: {
          ...currentDayPlan,
          topPriorities: priorities,
        },
      },
    });
  };

  // Reflection updater
  const updateReflection = (reflection: string) => {
    onUpdateWeekPlan({
      ...weekPlan,
      days: {
        ...weekPlan.days,
        [selectedDate]: {
          ...currentDayPlan,
          reflection,
        },
      },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* "stop talking. lock in and act." Banner from screenshot */}
      <div
        className="rounded-xl p-5 text-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight uppercase font-mono">
              stop talking. lock in and act.
            </h1>
            <p className="text-xs text-white/80 font-medium">
              Eliminate distractions. Execute today&apos;s non-negotiable blocks.
            </p>
          </div>
        </div>

        {/* Quick Date Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-black/20 rounded-lg overflow-x-auto max-w-full">
          {weekDays.map((d) => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                onClick={() => onSelectDate(d.dateStr)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {d.shortDay}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Focus Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Day Overview & Pomodoro Timer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Day Status Card */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-stone-400 block mb-1">
                Active Day Focus
              </span>
              <h2 className="text-xl font-bold text-stone-900">
                {selectedDayInfo.dayName}
              </h2>
              <span className="text-xs font-mono text-stone-500">
                {selectedDayInfo.displayDate}
              </span>

              <div className="mt-4 flex items-center gap-3 text-xs text-stone-600">
                <span>
                  <strong className="text-stone-900 font-mono">{completedCount}</strong> of{' '}
                  <strong className="text-stone-900 font-mono">{totalCount}</strong> tasks
                </span>
              </div>
            </div>

            <CircularProgress
              percentage={dayPercent}
              size={110}
              strokeWidth={10}
              color={theme.ringColor}
              trackColor={theme.ringTrack}
            />
          </div>

          {/* Pomodoro Focus Timer ("Lock In Mode") */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900">Deep Work Timer</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setTimerMode('work');
                    setTimerSeconds(25 * 60);
                    setIsTimerRunning(false);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    timerMode === 'work' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  25m Work
                </button>
                <button
                  onClick={() => {
                    setTimerMode('break');
                    setTimerSeconds(5 * 60);
                    setIsTimerRunning(false);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    timerMode === 'break' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  5m Break
                </button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center py-4">
              <div className="text-5xl font-extrabold font-mono text-stone-900 tracking-tight">
                {formatTimer(timerSeconds)}
              </div>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-mono">
                {timerMode === 'work' ? 'Active Focus Session' : 'Restorative Break'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-5 py-2 rounded-lg text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-opacity hover:opacity-95"
                style={{ backgroundColor: theme.primary }}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Pause Session' : 'Start Focus'}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerMode === 'work' ? 25 * 60 : 5 * 60);
                }}
                className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                title="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Ambient Noise */}
              <button
                onClick={toggleWhiteNoise}
                className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs ${
                  whiteNoiseOn
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
                title="Toggle gentle focus ambient noise"
              >
                {whiteNoiseOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-medium hidden sm:inline">
                  {whiteNoiseOn ? 'Sound On' : 'Ambient'}
                </span>
              </button>
            </div>
          </div>

          {/* Top 3 Non-Negotiables for Today */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-900">Top 3 Non-Negotiables</h3>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              If you only achieve these 3 things today, it is a win.
            </p>

            <div className="space-y-2">
              {[0, 1, 2].map((idx) => {
                const val = (currentDayPlan.topPriorities || [])[idx] || '';
                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateTopPriority(idx, e.target.value)}
                      placeholder={`Priority #${idx + 1}...`}
                      className="flex-1 text-xs px-2.5 py-1.5 border border-stone-200 rounded-md focus:outline-hidden focus:border-stone-800 text-stone-800"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Tasks & Today's Habits (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Habit Matrix Checklist */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-stone-900">Today&apos;s Habits</h3>
              </div>
              <span className="text-xs font-mono text-stone-500">
                {habits.filter((h) => h.history[selectedDate]).length} / {habits.length} done
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {habits.map((habit) => {
                const isDone = Boolean(habit.history[selectedDate]);
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabitForToday(habit.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isDone
                        ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/40 text-stone-700'
                    }`}
                  >
                    <span className="truncate pr-2">{habit.name}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isDone ? 'border-transparent text-white' : 'border-stone-300 bg-white'
                      }`}
                      style={{
                        backgroundColor: isDone ? theme.primary : undefined,
                      }}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Daily Task Execution List */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900">Task Execution List</h3>
              </div>
              <span className="text-xs font-mono font-medium text-stone-600">
                {completedCount} Done · {totalCount - completedCount} Left
              </span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddTask} className="p-3 border-b border-stone-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="+ Add task for today (press Enter to save)..."
                className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-md focus:border-stone-800 focus:outline-hidden"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                className="text-xs px-2 py-2 border border-stone-200 rounded-md bg-stone-50 text-stone-700"
              >
                <option value="high">High priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.primary }}
              >
                Add
              </button>
            </form>

            {/* Task list items */}
            <div className="p-3 divide-y divide-stone-100 min-h-[220px]">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs">
                  No tasks recorded for {selectedDayInfo.dayName}. Add your first priority above!
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`py-2.5 px-2 flex items-center justify-between gap-3 group hover:bg-stone-50/80 rounded transition-colors ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          task.completed
                            ? 'border-transparent text-white'
                            : 'border-stone-300 hover:border-stone-500 bg-white'
                        }`}
                        style={{
                          backgroundColor: task.completed ? theme.primary : 'transparent',
                        }}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <span
                        className={`text-xs break-words ${
                          task.completed ? 'line-through text-stone-400' : 'text-stone-800 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority === 'high' && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          High
                        </span>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-600 p-1 transition-opacity"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Evening Reflection & Daily Win */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-stone-900 mb-1">Evening Reflection & Win</h3>
            <p className="text-xs text-stone-500 mb-3">
              What moved the needle today? Any lessons for tomorrow?
            </p>
            <textarea
              rows={3}
              value={currentDayPlan.reflection || ''}
              onChange={(e) => updateReflection(e.target.value)}
              placeholder="Write your evening debrief here..."
              className="w-full text-xs p-3 border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-hidden text-stone-800 leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
