import React from 'react';
import { THEMES } from '../utils/theme';
import { ThemeId } from '../types';
import { Check, X, Sparkles } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stone-700" />
            <div>
              <h2 className="text-base font-bold text-stone-900">Choose your theme</h2>
              <p className="text-xs text-stone-500">Spreadsheet palettes calibrated for focus & clarity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="p-6 space-y-3">
          {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
            const t = THEMES[themeKey];
            const isSelected = currentTheme === themeKey;

            return (
              <button
                key={themeKey}
                onClick={() => {
                  onSelectTheme(themeKey);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50/80 ring-1 ring-stone-900 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Color Swatch Matrix */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-md border border-stone-200 bg-white">
                    <span
                      className="w-5 h-5 rounded-sm block shadow-xs"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span
                      className="w-5 h-5 rounded-sm block shadow-xs"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span
                      className="w-5 h-5 rounded-sm block border border-stone-200"
                      style={{ backgroundColor: t.primaryLight }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900">{t.name}</span>
                      {isSelected && (
                        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{t.tagline}</p>
                  </div>
                </div>

                <div className="pl-3">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-stone-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Themes persist across all views</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-900 text-white font-medium text-xs rounded hover:bg-stone-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
