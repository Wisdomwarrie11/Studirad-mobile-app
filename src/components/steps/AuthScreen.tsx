import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { scrollToTopInstant } from '../../utils/scrollTop';
import { Wordmark } from '../brand/Wordmark';
import { 
  Mail, 
  MailCheck,
  Lock, 
  User, 
  UserPlus,
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileText,
  RefreshCw,
  X
} from 'lucide-react';
import { AuthMode, ProfessionalRole } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

interface AuthScreenProps {
  initialMode?: AuthMode;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode }) => {
  const { 
    currentUser,
    setScreen,
    signIn, 
    signUp, 
    adminSignIn, 
    signInWithGoogle, 
    sendPasswordReset, 
    resendVerificationEmail,
    checkEmailVerification,
    cancelEmailVerification,
    pendingVerificationEmail,
    authInitialTab 
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(
    pendingVerificationEmail ? 'verifyEmail' : (initialMode || authInitialTab || 'signIn')
  );

  useEffect(() => {
    if (initialMode === 'adminLogin' || authInitialTab === 'adminLogin') {
      setMode('adminLogin');
      return;
    }
    if (pendingVerificationEmail) {
      setMode('verifyEmail');
      return;
    }
    if (initialMode) {
      setMode(initialMode);
    } else if (authInitialTab && authInitialTab !== 'verifyEmail') {
      setMode(authInitialTab);
    } else if (mode === 'verifyEmail') {
      setMode('signIn');
    }
  }, [initialMode, authInitialTab, pendingVerificationEmail]);

  useEffect(() => {
    if (currentUser && !currentUser.isGuest && mode === 'verifyEmail') {
      setScreen('app');
    }
  }, [currentUser, mode, setScreen]);

  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [mode]);

  // Sign In State (User)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State (User)
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<ProfessionalRole>('Qualified Radiographer');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Admin Login State (Admin ONLY - Sign up is not possible)
  const [adminEmail, setAdminEmail] = useState('studiradinfo@studirad.org');
  const [adminPasskey, setAdminPasskey] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Email Verification State
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const isSilentCheckingRef = useRef(false);

  // Legal Modal (Terms of Service & Privacy Policy)
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const checkEmailVerificationRef = useRef(checkEmailVerification);
  checkEmailVerificationRef.current = checkEmailVerification;

  useEffect(() => {
    if (mode !== 'verifyEmail') return;

    const runSilentCheck = async () => {
      if (isSilentCheckingRef.current) return;
      isSilentCheckingRef.current = true;
      try {
        await checkEmailVerificationRef.current();
      } finally {
        isSilentCheckingRef.current = false;
      }
    };

    const handleFocus = () => {
      runSilentCheck();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runSilentCheck();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(runSilentCheck, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [mode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationNotice(null);
    setIsLoading(true);
    const res = await signIn(signInEmail, signInPassword);
    setIsLoading(false);
    if (res.requiresEmailVerification) {
      setMode('verifyEmail');
      if (res.verificationEmailSent === false && res.verificationError) {
        setErrorMessage(res.verificationError);
      } else {
        setVerificationNotice(`Your email is not verified yet. A verification link has been sent to ${res.email || signInEmail}.`);
        setResendCooldown(60);
      }
      return;
    }
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationNotice(null);
    if (!agreedTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy to register.');
      return;
    }
    setIsLoading(true);
    const res = await signUp({
      fullName: signUpName,
      email: signUpEmail,
      password: signUpPassword,
      role: signUpRole,
    });
    setIsLoading(false);
    if (res.requiresEmailVerification) {
      setMode('verifyEmail');
      if (res.verificationEmailSent === false && res.verificationError) {
        setErrorMessage(res.verificationError);
      } else {
        setVerificationNotice(`We sent a Firebase verification link to ${res.email || signUpEmail}. Open it to activate your account.`);
        setResendCooldown(60);
      }
      return;
    }
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMessage(null);
    setIsCheckingVerification(true);
    const res = await checkEmailVerification();
    setIsCheckingVerification(false);
    if (!res.verified && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResendingVerification) return;
    setErrorMessage(null);
    setIsResendingVerification(true);
    const res = await resendVerificationEmail();
    setIsResendingVerification(false);
    if (res.alreadyVerified) {
      return;
    }
    if (res.success) {
      setVerificationNotice(`Verification email resent to ${pendingVerificationEmail || signUpEmail || signInEmail}. Check your inbox and Spam folder.`);
      setResendCooldown(60);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleBackFromVerification = async () => {
    setErrorMessage(null);
    setVerificationNotice(null);
    await cancelEmailVerification();
    setMode('signIn');
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const res = await adminSignIn(adminEmail, adminPasskey);
    setIsLoading(false);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const res = await sendPasswordReset(resetEmail);
    setIsLoading(false);
    if (res.success) {
      setResetSent(true);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between py-6 px-4 sm:px-6 select-none transition-colors">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 justify-between">
        
        {/* Top Header */}
        <header className="w-full pb-3 flex flex-col items-center border-b border-[var(--border-subtle)] shrink-0 relative">
          {currentUser && (
            <button
              type="button"
              onClick={() => setScreen('app')}
              className="absolute left-0 top-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[#f59e0b] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <Wordmark size="sm" withSubtitle={false} className="mb-3" />

          {/* Clean Segmented Tab Bar */}
          {mode !== 'forgotPassword' && mode !== 'verifyEmail' ? (
            <div className="w-full p-1 bg-[var(--bg-surface-elevated)] rounded-2xl flex items-center border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setMode('signIn');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signIn'
                    ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>User Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signUp');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signUp'
                    ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>User Sign Up</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('adminLogin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'adminLogin'
                    ? 'bg-[#f59e0b] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[#f59e0b]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'verifyEmail') {
                    handleBackFromVerification();
                  } else {
                    setMode('signIn');
                    setErrorMessage(null);
                    setResetSent(false);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#f59e0b] hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                {mode === 'verifyEmail' ? 'Email Verification' : 'Password Recovery'}
              </span>
            </div>
          )}
        </header>

        {/* Form Body with Minimal Text & Optimal UI */}
        <main className="py-5 flex-1 flex flex-col justify-center">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* 1. USER SIGN IN */}
          {mode === 'signIn' && (
            <form onSubmit={handleSignIn} className="flex flex-col gap-3.5 text-left">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Welcome Back</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Sign in to your StudiRad account.
                </p>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    className="w-full pl-10 pr-3 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgotPassword');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-bold text-[#f59e0b] hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-10 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[var(--text-primary)] p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-1 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 text-[#f59e0b]" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-0.5 flex items-center justify-center">
                <div className="w-full border-t border-[var(--border-subtle)]"></div>
                <span className="absolute px-2.5 bg-[var(--bg-canvas)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  or
                </span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* 2. USER SIGN UP */}
          {mode === 'signUp' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3 text-left">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Create Account</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Join StudiRad to access masterclasses, materials and opportunities.
                </p>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full pl-10 pr-3 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    className="w-full pl-10 pr-3 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Role
                </label>
                <select
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value as ProfessionalRole)}
                  className="w-full px-3 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                >
                  <option value="Radiography Student">Radiography Student</option>
                  <option value="Qualified Radiographer">Qualified Radiographer</option>
                  <option value="Imaging Technologist">Imaging Technologist (CT / MRI)</option>
                  <option value="Clinical Educator">Clinical Practice Educator</option>
                  <option value="Radiology Resident">Radiology Resident</option>
                </select>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Password (min 8 characters)
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[var(--text-primary)] p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 pt-0.5 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[var(--border-subtle)] text-[#002147] focus:ring-[#002147]"
                />
                <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLegalModal(true);
                    }}
                    className="text-[#f59e0b] font-semibold hover:underline"
                  >
                    Terms of Service & Privacy Policy
                  </button>{' '}
                  (Age 18+ required).
                </span>
              </label>

              {/* Sign Up CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-1 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 text-[#f59e0b]" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-0.5 flex items-center justify-center">
                <div className="w-full border-t border-[var(--border-subtle)]"></div>
                <span className="absolute px-2.5 bg-[var(--bg-canvas)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  or
                </span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* 3. ADMIN LOGIN ONLY (NO SIGN UP) */}
          {mode === 'adminLogin' && (
            <form onSubmit={handleAdminSignIn} className="flex flex-col gap-3.5 text-left">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <KeyRound className="w-3 h-3" />
                  <span>Admin Access Only</span>
                </div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Administrator Login</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Restricted to verified faculty administrators.
                </p>
              </div>

              {/* Informational callout: Admin sign-up is disabled */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#f59e0b] mt-0.5" />
                <span className="leading-relaxed">
                  Signing up as an admin is not possible. Only administrators with existing credentials in the portal can log in.
                </span>
              </div>

              {/* Admin Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Admin Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@studirad.org"
                    required
                    className="w-full pl-10 pr-3 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#f59e0b] transition-all font-mono text-xs"
                  />
                </div>
              </div>

              {/* Admin Passkey */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Admin Passkey / Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPasskey}
                    onChange={(e) => setAdminPasskey(e.target.value)}
                    placeholder="Enter passkey"
                    required
                    className="w-full pl-10 pr-10 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#f59e0b] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[var(--text-primary)] p-1 cursor-pointer"
                    aria-label={showAdminPassword ? 'Hide passkey' : 'Show passkey'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Admin CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-1 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#f59e0b]/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Dashboard</span>
                  </>
                )}
              </button>

              {/* Back to Main Login navigation */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signIn');
                    setErrorMessage(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#f59e0b] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Main Login</span>
                </button>

                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setScreen('app')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Return to App
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD */}
          {mode === 'forgotPassword' && (
            <div className="flex flex-col gap-4 text-left">
              {resetSent ? (
                <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col items-center text-center gap-2.5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <h2 className="text-sm font-bold text-emerald-200">Reset Link Sent</h2>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Check your inbox at <strong>{resetEmail}</strong> for instructions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signIn');
                      setResetSent(false);
                    }}
                    className="mt-3 px-5 h-10 bg-[#002147] text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="flex flex-col gap-3.5">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enter your registered email to receive a password reset link.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Registered Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@email.com"
                        required
                        className="w-full pl-10 pr-3 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#002147] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 mt-1 rounded-xl bg-[#002147] dark:bg-[#1B447A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4 text-[#f59e0b]" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
          {/* 5. FIREBASE EMAIL VERIFICATION */}
          {mode === 'verifyEmail' && (
            <div className="flex flex-col gap-4 text-center">
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center">
                  <MailCheck className="w-7 h-7 text-[#f59e0b]" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-[var(--text-primary)]">Verify Your Email</h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Click the verification link sent to{' '}
                    <strong className="text-[var(--text-primary)]">
                      {pendingVerificationEmail || signUpEmail || signInEmail || 'your email'}
                    </strong>
                    .
                  </p>
                </div>

                {verificationNotice && (
                  <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed">
                    {verificationNotice}
                  </div>
                )}

                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Check your Spam or Junk folder if you do not see the email within a minute.
                </p>

                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={isCheckingVerification}
                  className="w-full h-11 mt-1 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isCheckingVerification ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#f59e0b]" />
                      <span>I&apos;ve Verified My Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || isResendingVerification}
                  className="w-full h-10 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[#f59e0b]/50 text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResendingVerification ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Verification Email (${resendCooldown}s)`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleBackFromVerification}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[#f59e0b] transition-colors pt-1 cursor-pointer"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer: Privacy Policy & Terms Link */}
        <footer className="w-full pt-3 border-t border-[var(--border-subtle)] flex flex-col items-center gap-2 shrink-0">
          <div className="flex items-center justify-center gap-3 text-xs text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="hover:text-[var(--text-primary)] hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="hover:text-[var(--text-primary)] hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            Only persons aged 18 and older are permitted to register.
          </span>
        </footer>
      </div>

      {/* Terms & Privacy Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121824] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl text-left overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#f59e0b]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Terms of Service & Privacy Policy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold">
                Age Eligibility: Only individuals aged 18 years and older may register and use StudiRad.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Platform Eligibility &amp; Academic Scope</h4>
                <p>
                  StudiRad is an academic and clinical imaging education platform built for radiography undergraduates, interns, and qualified radiographers. By registering, you affirm that all profile details, qualifications, and academic levels provided are accurate.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Patient Privacy &amp; De-Identification</h4>
                <p>
                  Any clinical image, case discussion, or study file uploaded or shared on StudiRad must be 100% anonymized in compliance with HIPAA, GDPR, NDPR, and hospital confidentiality laws. Identifiable patient data is strictly prohibited.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Privacy Policy &amp; Data Protection</h4>
                <p>
                  We collect only the account details, learning activity, request records, and game scores necessary to deliver your educational experience. Data is encrypted in cloud storage, never sold to third parties, and can be deleted permanently at any time from your Account settings.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">4. Educational Resources &amp; Non-Issuance of CPD Certificates</h4>
                <p>
                  Courses, live sessions, study materials, private tutoring, and research guidance on StudiRad are provided strictly for academic enrichment, exam readiness, and peer mentorship. <strong>StudiRad does not issue accredited CPD certificates or statutory CPD credits at this time.</strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">5. Conduct, Tutoring &amp; Academic Integrity</h4>
                <p>
                  Users and instructors must respect intellectual property, uphold clinical ethics, and refrain from bypassing StudiRad booking coordination or falsifying credentials. Violations carry immediate account suspension and potential legal liability. Contact support@studirad.org for academic support or privacy inquiries.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className="px-5 py-2 rounded-xl bg-[#002147] dark:bg-[#1B447A] text-white font-bold text-xs cursor-pointer"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
