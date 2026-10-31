import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  CheckCheck, 
  Trash2, 
  Video, 
  Briefcase, 
  HelpCircle, 
  ShieldCheck, 
  Bell,
  Clock,
  Calendar
} from 'lucide-react';
import { AppNotification, NavTab } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'class' | 'job' | 'quiz'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'class':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'job':
        return <Briefcase className="w-4 h-4 text-[#FF7F32]" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'booking':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'system':
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    onClose();

    if (notif.type === 'class') {
      onNavigateTab?.('learn');
    } else if (notif.type === 'job') {
      onNavigateTab?.('explore');
    } else if (notif.type === 'quiz') {
      onNavigateTab?.('learn');
    } else if (notif.type === 'booking') {
      onNavigateTab?.('services');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn select-none">
      {/* Click outside to dismiss */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Sheet Content Container */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-slideUp text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Bar */}
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

        {/* Header Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-[#FF7F32]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#002147] dark:text-white flex items-center gap-1.5">
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#FF7F32] text-white text-[10px] font-bold">
                    {unreadNotificationCount}
                  </span>
                )}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Clinical reminders & opportunities</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161F30]/50 text-xs shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('class')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeFilter === 'class'
                  ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => setActiveFilter('job')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeFilter === 'job'
                  ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveFilter('quiz')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeFilter === 'quiz'
                  ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quizzes
            </button>
          </div>

          {unreadNotificationCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-[11px] font-semibold text-[#002147] dark:text-[#38BDF8] hover:text-[#FF7F32] flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Notifications</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                You are all caught up on class updates, case quizzes, and locum announcements.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                  notif.read
                    ? 'bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1A2438]'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-2xs'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="text-xs font-bold text-[#002147] dark:text-white leading-snug">
                      {notif.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-1.5">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{notif.timestamp}</span>
                    <span>·</span>
                    <span className="text-[#002147] dark:text-[#38BDF8] font-semibold">Tap to view</span>
                  </div>
                </div>

                {!notif.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#FF7F32]"></span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#161F30]/80 flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Tap any alert to open the class, quiz, or job
            </span>
            <button
              onClick={clearNotifications}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
