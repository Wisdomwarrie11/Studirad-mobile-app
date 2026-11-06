import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  UserPlus, 
  LogIn, 
  ArrowRight,
  GraduationCap,
  Briefcase,
  BookOpen
} from 'lucide-react';
import { Wordmark } from '../brand/Wordmark';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionText?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  title = 'Sign In to Continue',
  message = 'Create a free account or sign in to access full course lectures, live cohort registrations, study materials, and career applications.',
  actionText,
}) => {
  const { openAuthWithTab } = useAuth();

  if (!isOpen) return null;

  const handleSignUp = () => {
    onClose();
    openAuthWithTab('signUp');
  };

  const handleSignIn = () => {
    onClose();
    openAuthWithTab('signIn');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 dark:text-slate-100 select-none p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden text-left animate-slideUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0B0F17]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#FF7F32]/10 text-[#FF7F32] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#002147] dark:text-[#38BDF8]">
              StudiRad Member Access
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          {actionText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF7F32]/10 text-[#FF7F32] text-xs font-bold border border-[#FF7F32]/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Requires free account for: {actionText}</span>
            </div>
          )}

          {/* Member Benefits Checklist */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              What you unlock with a free account:
            </span>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Watch full course lecture videos and modules</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Register for live expert cohorts & earn course certificates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Read study materials, protocols & PQ archives</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Apply for NHS / diagnostic vacancies & connect with locums</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSignUp}
              className="w-full h-12 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF7F32]/25 active:scale-[0.99] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
            </button>

            <button
              onClick={handleSignIn}
              className="w-full h-11 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#FF7F32]" />
              <span>Already have an account? Sign In</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-center"
            >
              Continue Browsing as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
