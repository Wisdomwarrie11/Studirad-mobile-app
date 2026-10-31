import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  BrainCircuit, 
  CheckCircle2, 
  Bell, 
  MessageSquare, 
  Scan, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

export const AiTutorTab: React.FC = () => {
  const [notified, setNotified] = useState(false);

  return (
    <div className="flex-1 w-full bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col justify-between text-left text-slate-900 dark:text-slate-100 select-none pb-24 overflow-y-auto no-scrollbar">
      <div className="max-w-lg w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#002147] text-white flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6 text-[#FF7F32]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#002147] dark:text-white">
                StudiRad AI Tutor
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF7F32]/10 text-[#FF7F32] border border-[#FF7F32]/25">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specialized clinical intelligence for diagnostic radiographers
            </p>
          </div>
        </div>

        {/* Hero Announcement Card */}
        <div className="w-full rounded-3xl bg-gradient-to-br from-[#002147] via-[#0A2E5C] to-[#001733] text-white p-6 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF7F32]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7F32]" />
              <span>In Clinical Development</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Your Personal Radiography Clinical Mentor
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-md">
              We are fine-tuning our specialized AI tutoring engine on standardized radiographic positioning protocols, anatomy critique, physics principles, and board exam vica prep.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setNotified(!notified)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  notified 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'bg-[#FF7F32] hover:bg-[#E86B20] text-white shadow-md shadow-[#FF7F32]/25'
                }`}
              >
                {notified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>You'll be notified at launch!</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-white" />
                    <span>Notify Me When Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Capabilities Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            What's Coming in AI Tutor
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
                <Scan className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Image Critique & Artifact Analysis
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ask targeted questions about plain film collimation, CT beam-hardening artifacts, and ultrasound reverberations.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#FF7F32] flex items-center justify-center shrink-0 mt-0.5">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Radiographic Physics & IR(ME)R Q&A
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Clear, evidence-based answers on radiation protection, kVp/mAs optimization, DRLs, and MRI pulse sequences.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Viva Practice & Board Examination Prep
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Interactive case simulations and rapid-fire spotter questions designed for undergraduate exams and professional registrations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tip: Use Human Mentorship Today */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-300">
            Need clinical assistance right now? Book a 1-on-1 private tutorial.
          </span>
          <span className="font-bold text-[#FF7F32] flex items-center gap-0.5 shrink-0 ml-2">
            <span>Explore Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
