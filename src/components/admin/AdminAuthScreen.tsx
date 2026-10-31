import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/Wordmark';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

export const AdminAuthScreen: React.FC = () => {
  const { adminSignIn, setScreen } = useAuth();
  const [email, setEmail] = useState('studiradinfo@studirad.org');
  const [passkey, setPasskey] = useState('MasterKey2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const res = await adminSignIn(email, passkey);
    setIsLoading(false);

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleQuickFill = () => {
    setEmail('studiradinfo@studirad.org');
    setPasskey('MasterKey2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#0B0F17] text-slate-100 relative selection:bg-[#FF7F32] selection:text-white">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between max-w-md mx-auto">
        <button
          onClick={() => setScreen('app')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Learner App</span>
        </button>

        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-[#121824] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF7F32]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="mb-2">
            <Wordmark size="md" theme="dark" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Faculty & Admin Portal</span>
          </div>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Restricted access for publishing courses, live cohort classes, clinical materials, and verified opportunities.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Administrator Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="studiradinfo@studirad.org"
                required
                className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7F32] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Administrator Security Passkey
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 h-11 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7F32] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Hide passkey' : 'Show passkey'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick fill suggestion for rapid login */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500">Official Admin:</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[#FF7F32] hover:underline font-medium"
            >
              Fill official credentials
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF7F32]/20 transition-all disabled:opacity-60 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          Connected to Firestore project <span className="font-mono text-slate-400">graphical-silicon-1s6r9</span>.
          Changes push live immediately.
        </div>
      </div>
    </div>
  );
};
