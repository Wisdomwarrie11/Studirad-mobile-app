import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getCachedResourcesCount } from '../../utils/offlineStorage';
import { WifiOff, BookOpen, CheckCircle, ChevronRight, X } from 'lucide-react';

interface OfflineIndicatorProps {
  onOpenOfflinePack?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenOfflinePack }) => {
  const isOnline = useOnlineStatus();
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
      getCachedResourcesCount().then((count) => setCachedCount(count));
    }
  }, [isOnline]);

  if (isOnline || isDismissed) return null;

  return (
    <aside
      aria-label="Offline Mode Status"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-fade-in select-none"
    >
      <div className="bg-[#002147] dark:bg-[#121824] text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-amber-500/30 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-400">Offline Study Mode</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {cachedCount > 0
                ? `${cachedCount} educational resources available offline`
                : 'Core clinical protocols cached and ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenOfflinePack && (
            <button
              onClick={onOpenOfflinePack}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study</span>
            </button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss offline banner"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
