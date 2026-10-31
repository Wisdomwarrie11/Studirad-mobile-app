import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  BookOpen, 
  Bot, 
  Briefcase, 
  Compass
} from 'lucide-react';
import { NavTab } from '../../types';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAuth();

  // Streamlined 5 tabs without Search and Profile (which are moved to top bar)
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'aiTutor', label: 'AI Tutor', icon: Bot },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'explore', label: 'Opportunities', icon: Compass },
  ];

  return (
    <nav 
      aria-label="Main Application Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none safe-area-pb"
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all relative py-1 px-1 rounded-xl ${
                isActive
                  ? 'text-[#002147] dark:text-[#38BDF8]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <IconComponent
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#FF7F32]"></span>
                )}
              </div>
              <span
                className={`text-xs font-semibold tracking-tight text-center truncate max-w-full ${
                  isActive ? 'text-[#002147] dark:text-[#38BDF8]' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
