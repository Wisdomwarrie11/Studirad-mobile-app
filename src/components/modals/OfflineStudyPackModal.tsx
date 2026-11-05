import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Download, 
  WifiOff, 
  Search, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { 
  getOfflineStudyPack, 
  OfflinePackData, 
  OfflineStudyModule, 
  precacheAllCoreResources, 
  getCachedResourcesCount 
} from '../../utils/offlineStorage';

interface OfflineStudyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModuleId?: string | null;
}

export const OfflineStudyPackModal: React.FC<OfflineStudyPackModalProps> = ({
  isOpen,
  onClose,
  initialModuleId
}) => {
  const [packData, setPackData] = useState<OfflinePackData | null>(null);
  const [selectedModule, setSelectedModule] = useState<OfflineStudyModule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [isPrecaching, setIsPrecaching] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getOfflineStudyPack().then((data) => {
        setPackData(data);
        if (initialModuleId && data?.modules) {
          const matched = data.modules.find((m) => m.id === initialModuleId);
          if (matched) setSelectedModule(matched);
        }
      });
      getCachedResourcesCount().then(setCachedCount);
    }
  }, [isOpen, initialModuleId]);

  if (!isOpen) return null;

  const handleDownloadAll = async () => {
    setIsPrecaching(true);
    await precacheAllCoreResources();
    const count = await getCachedResourcesCount();
    setCachedCount(count);
    setIsPrecaching(false);
  };

  const handleCopyProtocol = (mod: OfflineStudyModule) => {
    const text = `${mod.title}\n${mod.summary}\n\n` + 
      mod.sections.map((s) => `${s.heading}\n${s.content}`).join('\n\n') + 
      `\n\nKey Takeaways:\n` + mod.keyTakeaways.map((k) => `• ${k}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['All', ...new Set((packData?.modules || []).map((m) => m.category))];

  const filteredModules = (packData?.modules || []).filter((mod) => {
    const matchesCategory = selectedCategory === 'All' || mod.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      mod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.sections.some((s) => s.content.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 dark:text-slate-100 select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[94vh] h-[94vh] sm:h-[88vh] bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl z-10 overflow-hidden text-left border border-slate-200 dark:border-slate-800 animate-slideUp">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#121824]">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedModule && (
              <button
                onClick={() => setSelectedModule(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors mr-1 cursor-pointer"
                title="Back to all modules"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#002147] dark:text-white truncate">
                  {selectedModule ? selectedModule.title : 'Offline Radiography Study Pack'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                  Cached in SW
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {selectedModule ? selectedModule.category : 'Guaranteed offline study for lead suites, basements & rural postings'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!selectedModule && (
              <button
                onClick={handleDownloadAll}
                disabled={isPrecaching}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                title="Precache all educational resources"
              >
                <Download className={`w-3.5 h-3.5 ${isPrecaching ? 'animate-bounce' : ''}`} />
                <span>{isPrecaching ? 'Caching...' : 'Sync All Offline'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {selectedModule ? (
          /* ================= DETAIL VIEW: READ SELECTED MODULE ================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {selectedModule.course} · {selectedModule.category}
                </span>
                <button
                  onClick={() => handleCopyProtocol(selectedModule)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                {selectedModule.summary}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {selectedModule.sections.map((section, idx) => (
                <div 
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-[#002147] dark:text-[#38BDF8] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{section.heading}</span>
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-normal">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Clinical Takeaways */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>High-Yield Clinical Takeaways</span>
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {selectedModule.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          /* ================= LIST VIEW: BROWSE ALL OFFLINE MODULES ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Search & Category Filter Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/50 dark:bg-[#121824]/50">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search offline emergency protocols, algorithms & PQ..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#002147] dark:focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleDownloadAll}
                  disabled={isPrecaching}
                  className="sm:hidden px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#002147] text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-[#161F30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    onClick={() => setSelectedModule(module)}
                    className="p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {module.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Offline Ready
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                        {module.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {module.summary}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{module.sections.length} Clinical Sections</span>
                      <span className="font-bold text-[#002147] dark:text-[#38BDF8] flex items-center gap-1">
                        Read Guide →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredModules.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <WifiOff className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching offline topics</p>
                  <p className="text-xs text-slate-400">Try searching for "chest", "contrast", "CRITOE", or "safety"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121824] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Service Worker Cache Active</span>
          </div>
          <span>{cachedCount > 0 ? `${cachedCount} items cached` : 'Full core pack cached'}</span>
        </div>

      </div>
    </div>
  );
};
