import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Wordmark } from '../brand/Wordmark';
import { Bell, Search, ShieldCheck } from 'lucide-react';
import { NavTab } from '../../types';

interface AppHeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { currentUser, unreadNotificationCount, activeTab, setActiveTab, setScreen } = useAuth();
  const { theme } = useTheme();

  const userInitial = currentUser?.fullName
    ? currentUser.fullName.charAt(0).toUpperCase()
    : 'R';

  // Desktop navigation links
  const navItems: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'learn', label: 'Learn' },
    { id: 'aiTutor', label: 'AI Tutor' },
    { id: 'services', label: 'Services' },
    { id: 'explore', label: 'Opportunities' },
  ];

  return (
    <header className="w-full bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 select-none transition-colors duration-200">
      <div className="w-full max-w-7xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 overflow-hidden">
        {/* Left: Pure Typography Wordmark (No Logo) */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center focus:outline-none hover:opacity-90 transition-opacity"
            title="Go to StudiRad Home"
            aria-label="StudiRad Home"
          >
            <Wordmark
              size="sm"
              theme={theme === 'dark' ? 'dark' : 'light'}
            />
          </button>
        </div>

        {/* Center: Desktop Navigation Links only (Hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-sm ${
                  isActive
                    ? 'text-[#FF7F32] bg-[#FF7F32]/10 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#002147] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Compact Icon Buttons (Search icon, Theme toggle, Notifications, Profile) */}
        {/* Fits cleanly on all mobile screens with zero overflow */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* 1. Search Icon Button (No wide input field) */}
          <button
            onClick={() => setActiveTab('search')}
            aria-label="Search"
            title="Search"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#161F30] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors min-h-[40px] min-w-[40px] shrink-0"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* 2. Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="View notifications"
            title="Notifications"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#161F30] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors relative min-h-[40px] min-w-[40px] shrink-0"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FF7F32] ring-2 ring-white dark:ring-[#0B0F17]"></span>
            )}
          </button>

          {/* 4. Profile Avatar Button */}
          <button
            onClick={onOpenProfile}
            aria-label="Open user profile"
            title="Profile & Settings"
            className="flex items-center gap-1.5 p-0.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#002147] dark:bg-[#1B447A] text-white flex items-center justify-center font-bold text-sm ring-2 ring-slate-200 dark:ring-slate-700 shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <span className="hidden xl:inline text-sm font-bold text-slate-800 dark:text-white truncate max-w-[90px]">
              {currentUser?.fullName?.split(' ')[0] || 'Profile'}
            </span>
          </button>

          {/* 5. Admin Hub Shortcut (Visible to Admin or for Direct Navigation) */}
          {(currentUser?.isAdmin || currentUser?.email?.toLowerCase().includes('studirad') || currentUser?.email?.toLowerCase().includes('admin') || currentUser?.email?.toLowerCase() === 'wisdomwarrie11@gmail.com') && (
            <button
              onClick={() => setScreen('admin')}
              aria-label="Admin Portal"
              title="Enter Admin Hub"
              className="h-10 px-2 sm:px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1 text-xs font-bold transition-colors shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-[#FF7F32]" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
