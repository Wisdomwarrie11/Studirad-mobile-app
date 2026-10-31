import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/Wordmark';

export const SplashScreen: React.FC = () => {
  const { setScreen, currentUser } = useAuth();

  useEffect(() => {
    // If user is already logged in, navigate directly to app
    if (currentUser) {
      setScreen('app');
      return;
    }

    const timer = setTimeout(() => {
      if (currentUser) {
        setScreen('app');
      } else {
        setScreen('onboarding');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [setScreen, currentUser]);

  const handleContinue = () => {
    if (currentUser) {
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

      {/* Pure StudiRad Brand - No other write-up */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Wordmark size="hero" theme="dark" withSubtitle={false} />
      </div>
    </div>
  );
};
