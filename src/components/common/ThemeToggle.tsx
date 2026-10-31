import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'expanded';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '',
  variant = 'compact'
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-[#002147] dark:hover:border-[#38BDF8] transition-all shadow-xs ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-[#002147] stroke-[2.2]" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'expanded') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#0B0F17] flex items-center justify-center text-slate-700 dark:text-amber-400 border border-slate-200/80 dark:border-slate-700/80">
            {isDark ? <Moon className="w-4 h-4 stroke-[2]" /> : <Sun className="w-4 h-4 stroke-[2] text-amber-500" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Theme Appearance</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Currently {isDark ? 'Dark theme' : 'Light theme'}
            </span>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label="Toggle dark/light mode"
          className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
            isDark ? 'bg-[#002147] border border-blue-600' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
              isDark ? 'translate-x-6 text-[#002147]' : 'translate-x-0 text-amber-500'
            }`}
          >
            {isDark ? <Moon className="w-3 h-3 stroke-[2.5]" /> : <Sun className="w-3 h-3 stroke-[2.5]" />}
          </div>
        </button>
      </div>
    );
  }

  // Compact circular button
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`w-10 h-10 rounded-full bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-xs hover:border-[#002147] dark:hover:border-[#38BDF8] active:scale-95 transition-all ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 stroke-[2] transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#002147] stroke-[2] transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};
