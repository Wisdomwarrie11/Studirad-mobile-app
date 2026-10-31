import React, { useState } from 'react';
import { Opportunity } from '../../types';
import { 
  X, 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Briefcase,
  Bookmark
} from 'lucide-react';

interface OpportunityDetailsModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({
  opportunity,
  onClose,
}) => {
  if (!opportunity) return null;

  const [isSaved, setIsSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 dark:text-slate-100 select-none">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden text-left animate-slideUp border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#121824]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#002147] dark:text-[#38BDF8]">
            <Briefcase className="w-5 h-5" />
            <span>Opportunity Details</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isSaved ? 'text-[#FF7F32] bg-orange-50 dark:bg-orange-950/40' : 'text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#FF7F32]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 no-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {opportunity.type}
              </span>
              {opportunity.urgent && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#FF7F32]/15 text-[#FF7F32] text-xs font-bold">
                  Urgent Vacancy
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {opportunity.title}
            </h2>
          </div>

          {/* Org & Location Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{opportunity.organisation}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{opportunity.location}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Clock className="w-4 h-4 text-[#FF7F32]" />
                <span>{opportunity.deadline}</span>
              </span>
            </div>
          </div>

          {/* Rate / Remuneration Card */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Remuneration / Band:</span>
            <span className="text-base font-bold text-[#002147] dark:text-[#38BDF8]">{opportunity.rate}</span>
          </div>

          {/* Description */}
          {opportunity.description && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Clinical Overview</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {opportunity.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Requirements</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {opportunity.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Notice from JobsPage */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[10px]">
              Important Safety Notice
            </span>
            <p className="leading-relaxed text-[11px] opacity-90">
              Please verify the facility and perform your own due diligence before accepting any offer. StudiRad acts as a facilitator and will not be responsible for any disputes that may arise.
            </p>
          </div>

          {/* Application Protocol Contact Info */}
          {(opportunity.contactInfo || opportunity.howToApply) && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF7F32]">
                Application Protocol
              </span>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {opportunity.contactInfo || opportunity.howToApply}
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center gap-3">
          {opportunity.link ? (
            <a
              href={opportunity.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base text-center bg-[#002147] hover:bg-[#001733] text-white shadow-md active:scale-98 transition-all"
            >
              Execute Application
            </a>
          ) : (
            <button
              onClick={() => setApplied(true)}
              disabled={applied}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md ${
                applied
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-[#002147] hover:bg-[#001733] text-white active:scale-98'
              }`}
            >
              {applied ? 'Application Recorded' : 'Apply via Portal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
