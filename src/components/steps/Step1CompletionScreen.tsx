import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/Wordmark';
import { 
  CheckCircle2, 
  RotateCcw, 
  User, 
  BookOpen, 
  ShieldCheck, 
  Layers, 
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';

export const Step1CompletionScreen: React.FC = () => {
  const { currentUser, setScreen, resetToSplash, signOut } = useAuth();

  const topicDisplayNames: Record<string, string> = {
    general_radiography: 'General Radiography',
    ct_mri: 'CT & MRI',
    ultrasound: 'Ultrasound',
    mammography: 'Mammography',
    radiation_protection: 'Radiation Protection',
    research_cpd: 'Research & Professional Development',
  };

  return (
    <div className="flex-1 w-full bg-slate-50 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="w-full px-5 pt-3 pb-3 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
        <Wordmark size="sm" withIcon={true} />
        
        <button
          onClick={signOut}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Main Review Body */}
      <div className="flex-1 w-full px-5 py-4 overflow-y-auto no-scrollbar flex flex-col text-left">
        {/* Success Confirmation Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 mb-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>STEP 1 COMPLETE & READY FOR REVIEW</span>
          </div>
          <h2 className="text-base font-bold text-[#002147] leading-tight">
            Entry Experience & Authentication Configured
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            All 4 components of Step 1 (Splash, 3-Card Onboarding, Auth with Guest Mode, and 6-Topic Personalisation) are operating smoothly.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs mb-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'R'}
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#002147]">
                  {currentUser?.fullName || 'Radiography Professional'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {currentUser?.email || 'authenticated'}
                </span>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              currentUser?.isGuest
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-[#002147] border border-blue-200'
            }`}>
              {currentUser?.isGuest ? 'Guest Explorer' : currentUser?.role || 'Qualified'}
            </span>
          </div>

          {/* Selected Topics Pill Area */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
              <span>Personalised Topics:</span>
              <span className="text-slate-400 font-normal">
                {currentUser?.selectedTopics?.length || 0} active
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentUser?.selectedTopics && currentUser.selectedTopics.length > 0 ? (
                currentUser.selectedTopics.map((topicId) => (
                  <span
                    key={topicId}
                    className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                  >
                    {topicDisplayNames[topicId] || topicId}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No topics selected yet (skipped)</span>
              )}
            </div>
          </div>
        </div>

        {/* Step 1 Interactive Flow Verifier */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 mb-4">
          <span className="text-xs font-bold text-[#002147] block mb-2">
            Test & Inspect Step 1 Screens:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setScreen('splash')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#002147] bg-slate-50 hover:bg-white text-left transition-all"
            >
              <div className="font-bold text-[#002147]">1. Splash Screen</div>
              <span className="text-[10px] text-slate-500">Auto pulse & beam</span>
            </button>

            <button
              onClick={() => setScreen('onboarding')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#002147] bg-slate-50 hover:bg-white text-left transition-all"
            >
              <div className="font-bold text-[#002147]">2. Onboarding</div>
              <span className="text-[10px] text-slate-500">3 swipeable cards</span>
            </button>

            <button
              onClick={() => setScreen('auth')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#002147] bg-slate-50 hover:bg-white text-left transition-all"
            >
              <div className="font-bold text-[#002147]">3. Authentication</div>
              <span className="text-[10px] text-slate-500">Sign in, up, guest</span>
            </button>

            <button
              onClick={() => setScreen('personalise')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#002147] bg-slate-50 hover:bg-white text-left transition-all"
            >
              <div className="font-bold text-[#002147]">4. Personalise</div>
              <span className="text-[10px] text-slate-500">6 topic selectors</span>
            </button>
          </div>
        </div>

        {/* Step 2 Launch Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002147] to-[#0A3266] text-white flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF7F32]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STEP 2 ACTIVE</span>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-blue-200">
              5-Tab Shell Ready
            </span>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Launch the persistent 5-tab navigation shell with live notification center and App Store compliant profile drawer.
          </p>
          <button
            onClick={() => setScreen('app')}
            className="w-full mt-1 py-2.5 px-4 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
          >
            <span>Enter StudiRad App Shell</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="w-full px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
        <button
          onClick={resetToSplash}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#002147] py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Flow</span>
        </button>

        <button
          onClick={() => setScreen('personalise')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#002147] hover:text-[#FF7F32] py-2 px-3 rounded-xl hover:bg-blue-50 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Edit Topics</span>
        </button>
      </div>
    </div>
  );
};
