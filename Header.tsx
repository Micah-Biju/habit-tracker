import React, { useState } from 'react';
import { ViewMode, ThemeConfig } from '../types';
import {
  CalendarDays,
  CheckCircle2,
  CalendarRange,
  Palette,
  Volume2,
  VolumeX,
  Download,
  Printer,
  RotateCcw,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  theme: ThemeConfig;
  onOpenThemeModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  theme,
  onOpenThemeModal,
  soundEnabled,
  onToggleSound,
  onExportCSV,
  onExportJSON,
  onResetDemo,
}) => {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-stone-200/80 px-4 md:px-8 py-3">
      <div className="max-w-[1560px] mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center font-bold text-white shadow-xs"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="font-mono text-sm leading-none">U</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-stone-900 font-mono">
            unchaos<span style={{ color: theme.primary }}>.lab</span>
          </span>
        </div>

        {/* Zone 2: Navigation controls */}
        <nav className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200/60">
          <button
            onClick={() => onViewChange('weekly')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              currentView === 'weekly'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" style={{ color: currentView === 'weekly' ? theme.primary : undefined }} />
            <span>Weekly System</span>
          </button>

          <button
            onClick={() => onViewChange('daily')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              currentView === 'daily'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: currentView === 'daily' ? theme.primary : undefined }} />
            <span>Daily Focus</span>
          </button>

          <button
            onClick={() => onViewChange('monthly')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              currentView === 'monthly'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" style={{ color: currentView === 'monthly' ? theme.primary : undefined }} />
            <span>Monthly View</span>
          </button>
        </nav>

        {/* Zone 3: Actions & utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme selector button */}
          <button
            onClick={onOpenThemeModal}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-md border border-stone-200 transition-colors"
            title="Choose Theme"
          >
            <span
              className="w-3 h-3 rounded-full border border-black/10 inline-block"
              style={{ backgroundColor: theme.primary }}
            />
            <span className="hidden sm:inline">{theme.name}</span>
            <Palette className="w-3.5 h-3.5 text-stone-400 sm:hidden" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-md border transition-colors ${
              soundEnabled
                ? 'border-stone-200 text-stone-700 hover:bg-stone-100'
                : 'border-stone-200 text-stone-400 bg-stone-100 hover:bg-stone-200'
            }`}
            title={soundEnabled ? 'Mute sound effects' : 'Enable tactile audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export & Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 rounded-md border border-stone-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-40 text-xs">
                  <button
                    onClick={() => {
                      onExportCSV();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-500" />
                    <span>Export to CSV (Sheets)</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportJSON();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-500" />
                    <span>Backup Data (JSON)</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-500" />
                    <span>Print Planner</span>
                  </button>
                  <div className="my-1 border-t border-stone-100" />
                  <button
                    onClick={() => {
                      onResetDemo();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reset to Demo Data</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
