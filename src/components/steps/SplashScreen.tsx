import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/Wordmark';

export const SplashScreen: React.FC = () => {
  const { setScreen, currentUser } = useAuth();

  useEffect(() => {
    const hasOnboarded = (() => {
      try {
        return localStorage.getItem('studirad_onboarded') === 'true';
      } catch {
        return false;
      }
    })();

    // If user is already logged in or has onboarded before, navigate directly to app
    if (currentUser || hasOnboarded) {
      setScreen('app');
      return;
    }

    const timer = setTimeout(() => {
      if (currentUser || hasOnboarded) {
        setScreen('app');
      } else {
        setScreen('onboarding');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [setScreen, currentUser]);

  const handleContinue = () => {
    const hasOnboarded = (() => {
      try {
        return localStorage.getItem('studirad_onboarded') === 'true';
      } catch {
        return false;
      }
    })();

    if (currentUser || hasOnboarded) {
      setScreen('app');
    } else {
      setScreen('onboarding');
    }
  };

  return (
    <div 
      onClick={handleContinue}
      className="min-h-screen w-full bg-[#0B0F17] text-white flex flex-col justify-center items-center select-none cursor-pointer relative px-6"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#002147]/60 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF7F32]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Pure StudiRad Brand with Fancy Brand Loader */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        <Wordmark size="hero" theme="dark" withSubtitle={false} />

        {/* Fancy Clinical Brand Spinner */}
        <div className="relative flex items-center justify-center">
          {/* Subtle ambient glow */}
          <div className="absolute w-16 h-16 bg-[#FF7F32]/25 rounded-full blur-md animate-pulse"></div>

          {/* Outer Rotating Gradient Ring */}
          <div className="w-12 h-12 rounded-full border-2 border-slate-800/80 border-t-[#FF7F32] border-r-[#FF7F32]/70 animate-spin"></div>

          {/* Inner Counter-Pulsing Orbit */}
          <div className="absolute w-6 h-6 rounded-full bg-[#002147]/90 border border-[#FF7F32]/50 flex items-center justify-center shadow-inner">
            <div className="w-2 h-2 rounded-full bg-[#FF7F32] animate-ping"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
