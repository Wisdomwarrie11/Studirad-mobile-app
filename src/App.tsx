/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { RequestProvider } from './context/RequestContext';
import { SplashScreen } from './components/steps/SplashScreen';
import { OnboardingScreen } from './components/steps/OnboardingScreen';
import { AuthScreen } from './components/steps/AuthScreen';
import { PersonaliseScreen } from './components/steps/PersonaliseScreen';
import { Step1CompletionScreen } from './components/steps/Step1CompletionScreen';
import { MainAppShell } from './components/navigation/MainAppShell';
import { AdminAuthScreen } from './components/admin/AdminAuthScreen';
import { AdminDashboardScreen } from './components/admin/AdminDashboardScreen';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';

const AppContent: React.FC = () => {
  const { currentScreen } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200 flex flex-col">
      {currentScreen === 'splash' && <SplashScreen />}
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'auth' && <AuthScreen />}
      {currentScreen === 'personalise' && <PersonaliseScreen />}
      {currentScreen === 'completed' && <Step1CompletionScreen />}
      {currentScreen === 'app' && <MainAppShell />}
      {currentScreen === 'adminAuth' && <AuthScreen initialMode="adminLogin" />}
      {currentScreen === 'admin' && (
        <AdminProtectedRoute>
          <AdminDashboardScreen />
        </AdminProtectedRoute>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RequestProvider>
          <AppContent />
        </RequestProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
