import React, { useState, useEffect } from 'react';
import { ViewMode, ThemeId, WeekPlan, Habit, MonthGoal, MonthReflection } from './types';
import { THEMES } from './utils/theme';
import {
  getStoredTheme,
  saveStoredTheme,
  getStoredSound,
  saveStoredSound,
  getStoredWeeks,
  saveStoredWeeks,
  getStoredHabits,
  saveStoredHabits,
  getStoredMonthGoals,
  saveStoredMonthGoals,
  getStoredMonthReflections,
  saveStoredMonthReflections,
} from './utils/storage';
import { Header } from './components/Header';
import { WeeklyView } from './components/WeeklyView';
import { DailyView } from './components/DailyView';
import { MonthlyView } from './components/MonthlyView';
import { ThemeModal } from './components/ThemeModal';
import { sound } from './utils/audio';
import { formatISODate, getMondayOfWeek, getWeekDays, getWeekId } from './utils/date';
import { exportBackupJSON, exportWeekToCSV } from './utils/export';

export default function App() {
  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(getStoredTheme);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const theme = THEMES[currentThemeId] || THEMES.sage;

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getStoredSound);

  // Active view mode
  const [currentView, setCurrentView] = useState<ViewMode>('weekly');

  // Active week reference date
  const [activeMonday, setActiveMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Active date for Daily focus
  const [selectedFocusDate, setSelectedFocusDate] = useState<string>(() => formatISODate(new Date()));

  // Persistent data collections
  const [weeks, setWeeks] = useState<Record<string, WeekPlan>>(getStoredWeeks);
  const [habits, setHabits] = useState<Habit[]>(getStoredHabits);
  const [monthGoals, setMonthGoals] = useState<MonthGoal[]>(getStoredMonthGoals);
  const [monthReflections, setMonthReflections] = useState<Record<string, MonthReflection>>(getStoredMonthReflections);

  // Sync sound setting
  useEffect(() => {
    sound.enabled = soundEnabled;
    saveStoredSound(soundEnabled);
  }, [soundEnabled]);

  // Sync theme setting
  const handleSelectTheme = (newThemeId: ThemeId) => {
    setCurrentThemeId(newThemeId);
    saveStoredTheme(newThemeId);
  };

  // Ensure current week plan exists
  const activeWeekId = getWeekId(activeMonday);
  const currentWeekPlan: WeekPlan = weeks[activeWeekId] || (() => {
    const days = getWeekDays(activeMonday);
    const dayPlans: Record<string, any> = {};
    days.forEach((d) => {
      dayPlans[d.dateStr] = {
        date: d.dateStr,
        tasks: [],
        topPriorities: ['', '', ''],
      };
    });
    return {
      weekId: activeWeekId,
      startDate: days[0].dateStr,
      endDate: days[6].dateStr,
      weeklyFocus: '',
      reward: '',
      affirmation: 'One step at a time. Lock in and act.',
      days: dayPlans,
    };
  })();

  // Handlers for data updates
  const handleUpdateWeekPlan = (updatedPlan: WeekPlan) => {
    const updatedWeeks = {
      ...weeks,
      [updatedPlan.weekId]: updatedPlan,
    };
    setWeeks(updatedWeeks);
    saveStoredWeeks(updatedWeeks);
  };

  const handleUpdateHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    saveStoredHabits(updatedHabits);
  };

  const handleUpdateMonthGoals = (updatedGoals: MonthGoal[]) => {
    setMonthGoals(updatedGoals);
    saveStoredMonthGoals(updatedGoals);
  };

  const handleUpdateMonthReflections = (updatedReflections: Record<string, MonthReflection>) => {
    setMonthReflections(updatedReflections);
    saveStoredMonthReflections(updatedReflections);
  };

  // Week navigation
  const handleNavigateWeek = (direction: 'prev' | 'next' | 'current') => {
    if (direction === 'current') {
      setActiveMonday(getMondayOfWeek(new Date()));
    } else {
      const newD = new Date(activeMonday);
      newD.setDate(activeMonday.getDate() + (direction === 'next' ? 7 : -7));
      setActiveMonday(newD);
    }
  };

  // Select day from any view to jump directly into Daily Focus
  const handleSelectDayForFocus = (dateStr: string) => {
    setSelectedFocusDate(dateStr);
    setCurrentView('daily');
    sound.playPop();
  };

  // CSV Export handler
  const handleExportCSV = () => {
    exportWeekToCSV(currentWeekPlan, habits);
    sound.playPop();
  };

  // JSON Backup handler
  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      theme: currentThemeId,
      weeks,
      habits,
      monthGoals,
      monthReflections,
    };
    exportBackupJSON(backupData);
    sound.playPop();
  };

  // Reset to Demo Data
  const handleResetDemo = () => {
    if (window.confirm('Reset planner with sample demo habits and tasks? Your changes will be restored to clean demo state.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100/70 text-stone-900 selection:bg-stone-300">
      {/* Universal Top Bar */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        theme={theme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onResetDemo={handleResetDemo}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-[1560px] mx-auto px-4 md:px-8 pt-6">
        {currentView === 'weekly' && (
          <WeeklyView
            weekPlan={currentWeekPlan}
            habits={habits}
            theme={theme}
            onUpdateWeekPlan={handleUpdateWeekPlan}
            onUpdateHabits={handleUpdateHabits}
            onNavigateWeek={handleNavigateWeek}
            onSelectDayForFocus={handleSelectDayForFocus}
          />
        )}

        {currentView === 'daily' && (
          <DailyView
            weekPlan={currentWeekPlan}
            habits={habits}
            theme={theme}
            selectedDate={selectedFocusDate}
            onSelectDate={setSelectedFocusDate}
            onUpdateWeekPlan={handleUpdateWeekPlan}
            onUpdateHabits={handleUpdateHabits}
          />
        )}

        {currentView === 'monthly' && (
          <MonthlyView
            currentDate={activeMonday}
            weeks={weeks}
            habits={habits}
            monthGoals={monthGoals}
            monthReflections={monthReflections}
            theme={theme}
            onUpdateMonthGoals={handleUpdateMonthGoals}
            onUpdateMonthReflections={handleUpdateMonthReflections}
            onSelectDateForFocus={handleSelectDayForFocus}
          />
        )}
      </main>

      {/* Theme Selection Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
}
