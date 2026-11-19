import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateProfile,
  signOut as fbSignOut,
  Auth,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  auth, 
  appletAuth, 
  adminAuth, 
  googleProvider, 
  appletGoogleProvider, 
  db, 
  appletDb 
} from '../firebase';
import { UserProfile, AppScreen, ProfessionalRole, NavTab, AppNotification, AuthMode } from '../types';
import { subscribeUserNotifications } from '../services/firebaseDataService';
import { formatClockTime12h } from '../utils/timeFormat';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
  email?: string;
  verificationEmailSent?: boolean;
  verificationError?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  adminUser: FirebaseUser | null;
  isAdminAuthenticated: boolean;
  authInitialTab: AuthMode;
  pendingVerificationEmail: string | null;
  openAuthWithTab: (tab: AuthMode) => void;
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  learnInitialView: 'classes' | 'materials' | 'courses';
  setLearnInitialView: (view: 'classes' | 'materials' | 'courses') => void;
  navigateToLearn: (view: 'classes' | 'materials' | 'courses') => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  adminSignIn: (email: string, passkey: string) => Promise<{ success: boolean; error?: string }>;
  adminSignOut: () => Promise<void>;
  signUp: (data: { email: string; password: string; fullName: string; role: ProfessionalRole }) => Promise<AuthActionResult>;
  resendVerificationEmail: () => Promise<{ success: boolean; alreadyVerified?: boolean; error?: string }>;
  checkEmailVerification: () => Promise<{ success: boolean; verified: boolean; error?: string }>;
  cancelEmailVerification: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  saveSelectedTopics: (topics: string[], navigateToApp?: boolean) => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  resetToSplash: () => void;
  isFirebaseConnected: boolean;
  authPrompt: {
    isOpen: boolean;
    title: string;
    message: string;
    actionText?: string;
  } | null;
  requireAuth: (options?: { title?: string; message?: string; actionText?: string; targetTab?: AuthMode }) => boolean;
  closeAuthPrompt: () => void;
}

const STORAGE_KEY_USER = 'studirad_current_user';
const STORAGE_KEY_SCREEN = 'studirad_current_screen';
const STORAGE_KEY_NOTIFS = 'studirad_notifications';

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentScreen, setCurrentScreenState] = useState<AppScreen>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) return 'app';
      const savedScreen = localStorage.getItem(STORAGE_KEY_SCREEN);
      if (savedScreen && savedScreen !== 'splash' && savedScreen !== 'onboarding') {
        return savedScreen as AppScreen;
      }
    } catch {}
    return 'splash';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [learnInitialView, setLearnInitialView] = useState<'classes' | 'materials' | 'courses'>('classes');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [adminUser, setAdminUser] = useState<FirebaseUser | null>(adminAuth.currentUser);
  const [authInitialTab, setAuthInitialTab] = useState<AuthMode>('signIn');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const pendingAuthTargetRef = useRef<'applet' | 'client' | null>(null);
  const lastVerificationSentAtRef = useRef<number>(0);
  const currentScreenRef = useRef<AppScreen>(currentScreen);
  currentScreenRef.current = currentScreen;
  const authInitialTabRef = useRef<AuthMode>(authInitialTab);
  authInitialTabRef.current = authInitialTab;

  const [authPrompt, setAuthPrompt] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionText?: string;
  } | null>(null);

  const openAuthWithTab = (tab: AuthMode) => {
    setAuthPrompt(null);
    setAuthInitialTab(tab);
    setScreen('auth');
  };

  const closeAuthPrompt = () => {
    setAuthPrompt(null);
  };

  const requireAuth = (options?: {
    title?: string;
    message?: string;
    actionText?: string;
    targetTab?: AuthMode;
  }): boolean => {
    if (currentUser && !currentUser.isGuest) {
      return true;
    }
    setAuthPrompt({
      isOpen: true,
      title: options?.title || 'Account Required',
      message: options?.message || 'Please sign in or create a free StudiRad account to access this feature.',
      actionText: options?.actionText,
    });
    if (options?.targetTab) {
      setAuthInitialTab(options.targetTab);
    }
    return false;
  };

  const navigateToLearn = (view: 'classes' | 'materials' | 'courses') => {
    setLearnInitialView(view);
    setActiveTab('learn');
  };

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // If parsed contains legacy mock notifs, clear them out
      if (Array.isArray(parsed) && parsed.some((n: any) => n.id?.startsWith('notif_'))) {
        localStorage.removeItem(STORAGE_KEY_NOTIFS);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  });

  // Listen to Admin Firebase Auth state (studirad-admin-portal)
  useEffect(() => {
    const unsubAdmin = onAuthStateChanged(adminAuth, (fbAdminUser) => {
      setAdminUser(fbAdminUser);
    });
    return () => unsubAdmin();
  }, []);

  const buildAndHydrateUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const appletDocRef = appletDb ? doc(appletDb, 'users', fbUser.uid) : null;

    let data: any = null;
    try {
      const [dbSnap, appletSnap] = await Promise.allSettled([
        getDoc(userDocRef),
        appletDocRef ? getDoc(appletDocRef) : Promise.resolve(null),
      ]);

      const dbData = dbSnap.status === 'fulfilled' && dbSnap.value?.exists() ? dbSnap.value.data() : null;
      const appData = appletSnap.status === 'fulfilled' && appletSnap.value && appletSnap.value.exists() ? appletSnap.value.data() : null;
      if (dbData || appData) {
        data = { ...(dbData || {}), ...(appData || {}) };
      }
    } catch (e) {
      console.warn('Error loading user profile from Firestore:', e);
    }

    if (data) {
      if (fbUser.emailVerified && data.emailVerified !== true) {
        const verifiedPatch = { emailVerified: true, updatedAt: new Date().toISOString() };
        Promise.allSettled([
          appletDocRef ? setDoc(appletDocRef, verifiedPatch, { merge: true }) : Promise.resolve(),
          setDoc(userDocRef, verifiedPatch, { merge: true }),
        ]).catch(() => {});
      }

      return {
        id: fbUser.uid,
        email: fbUser.email || data.email || '',
        emailVerified: fbUser.emailVerified,
        fullName: data.fullName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Radiology Scholar',
        role: data.role || 'Qualified Radiographer',
        selectedTopics: Array.isArray(data.selectedTopics) ? data.selectedTopics : ['general_radiography'],
        isGuest: false,
        isInstructor: Boolean(data.isInstructor),
        instructorStatus: data.instructorStatus,
        avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
        createdAt: data.createdAt || new Date().toISOString(),
        cpdCredits: typeof data.cpdCredits === 'number' ? data.cpdCredits : 0,
        gameScore: typeof data.gameScore === 'number' ? data.gameScore : 0,
        bestStreak: typeof data.bestStreak === 'number' ? data.bestStreak : 0,
        gamesSolved: typeof data.gamesSolved === 'number' ? data.gamesSolved : 0,
        gameStats: data.gameStats || undefined,
      };
    }

    const newProfile: UserProfile = {
      id: fbUser.uid,
      email: fbUser.email || '',
      emailVerified: fbUser.emailVerified,
      fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Radiology Scholar',
      role: 'Qualified Radiographer',
      selectedTopics: ['general_radiography', 'radiation_protection'],
      isGuest: false,
      avatarUrl: fbUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      cpdCredits: 0,
    };

    const payload = {
      fullName: newProfile.fullName,
      role: newProfile.role,
      selectedTopics: newProfile.selectedTopics,
      cpdCredits: newProfile.cpdCredits,
      avatarUrl: newProfile.avatarUrl || '',
      email: newProfile.email,
      emailVerified: fbUser.emailVerified,
      createdAt: newProfile.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await Promise.allSettled([
      appletDocRef ? setDoc(appletDocRef, payload, { merge: true }) : Promise.resolve(),
      setDoc(userDocRef, payload, { merge: true }),
    ]);

    return newProfile;
  };

  const isUnverifiedPasswordUser = (fbUser: FirebaseUser): boolean => {
    const hasPasswordProvider = fbUser.providerData.some((p) => p.providerId === 'password');
    const hasTrustedOAuthProvider = fbUser.providerData.some((p) => p.providerId !== 'password');
    if (hasTrustedOAuthProvider && fbUser.emailVerified) return false;
    return hasPasswordProvider && !fbUser.emailVerified;
  };

  const getGoogleAuthPair = (): { targetAuth: Auth; provider: typeof googleProvider } => {
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const isClientHostedDomain =
      host === 'studirad.org' ||
      host.endsWith('.studirad.org') ||
      host === 'studirad-platform-new.firebaseapp.com' ||
      host === 'studirad-platform-new.web.app';
    if (isClientHostedDomain) {
      return { targetAuth: auth, provider: googleProvider };
    }
    return { targetAuth: appletAuth, provider: appletGoogleProvider };
  };

  const getEmailActionSettings = (target: 'applet' | 'client') => {
    if (typeof window === 'undefined') return undefined;
    const host = window.location.hostname.toLowerCase();
    const origin = window.location.origin;

    if (target === 'applet') {
      const allowedAppletHost =
        host.endsWith('.run.app') ||
        host.endsWith('.firebaseapp.com') ||
        host.endsWith('.web.app') ||
        host === 'localhost';
      return allowedAppletHost ? { url: `${origin}/?verified=1`, handleCodeInApp: false } : undefined;
    }

    const allowedClientHost =
      host === 'studirad.org' ||
      host.endsWith('.studirad.org') ||
      host === 'studirad-platform-new.firebaseapp.com' ||
      host === 'studirad-platform-new.web.app';
    return allowedClientHost ? { url: `${origin}/?verified=1`, handleCodeInApp: false } : undefined;
  };

  const sendVerificationEmailSafely = async (
    fbUser: FirebaseUser,
    target: 'applet' | 'client'
  ): Promise<{ sent: boolean; error?: string }> => {
    const actionSettings = getEmailActionSettings(target);
    try {
      if (actionSettings) {
        await sendEmailVerification(fbUser, actionSettings);
      } else {
        await sendEmailVerification(fbUser);
      }
      lastVerificationSentAtRef.current = Date.now();
      return { sent: true };
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-continue-uri' || err?.code === 'auth/invalid-continue-uri') {
        try {
          await sendEmailVerification(fbUser);
          lastVerificationSentAtRef.current = Date.now();
          return { sent: true };
        } catch (retryErr: any) {
          console.warn('Retry verification email error:', retryErr);
          return {
            sent: false,
            error:
              retryErr?.code === 'auth/too-many-requests'
                ? 'Verification email was sent recently. Please wait 1 minute before requesting another link.'
                : retryErr?.message || 'Could not send verification email right now.',
          };
        }
      }
      console.warn('Send verification email error:', err);
      return {
        sent: false,
        error:
          err?.code === 'auth/too-many-requests'
            ? 'Verification email rate limit reached. Please wait a minute and check your inbox or Spam folder.'
            : err?.message || 'Could not send verification email. Please try resending.',
      };
    }
  };

  const getPendingAuthUser = (): { fbUser: FirebaseUser; target: 'applet' | 'client' } | null => {
    if (pendingAuthTargetRef.current === 'applet' && appletAuth.currentUser) {
      return { fbUser: appletAuth.currentUser, target: 'applet' };
    }
    if (pendingAuthTargetRef.current === 'client' && auth.currentUser) {
      return { fbUser: auth.currentUser, target: 'client' };
    }
    if (appletAuth.currentUser) {
      return { fbUser: appletAuth.currentUser, target: 'applet' };
    }
    if (auth.currentUser) {
      return { fbUser: auth.currentUser, target: 'client' };
    }
    return null;
  };

  // Handle in-app Firebase verification callback (?mode=verifyEmail&oobCode=...) if returned from email link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode !== 'verifyEmail' || !oobCode) return;

    (async () => {
      try {
        try {
          await applyActionCode(appletAuth, oobCode);
        } catch {
          await applyActionCode(auth, oobCode);
        }

        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

        const active = getPendingAuthUser();
        if (active) {
          await active.fbUser.reload().catch(() => {});
          const refreshed = (active.target === 'applet' ? appletAuth.currentUser : auth.currentUser) || active.fbUser;
          if (refreshed.emailVerified) {
            const profile = await buildAndHydrateUserProfile(refreshed);
            setPendingVerificationEmail(null);
            pendingAuthTargetRef.current = null;
            setCurrentUser(profile);
            setAuthInitialTab('signIn');
            setScreen('app');
          }
        }
      } catch (e) {
        console.warn('Email verification link handling notice:', e);
      }
    })();
  }, []);

  // Listen to both Applet Firebase Auth (graphical-silicon-1s6r9) & Client Firebase Auth (studirad-platform-new)
  useEffect(() => {
    const handleFirebaseAuthChange = async (fbUser: FirebaseUser | null, source: 'applet' | 'client') => {
      if (!fbUser) {
        if (!appletAuth.currentUser && !auth.currentUser) {
          setPendingVerificationEmail(null);
          pendingAuthTargetRef.current = null;
        }
        return;
      }

      setIsFirebaseConnected(true);
      try {
        if (!fbUser.emailVerified) {
          await fbUser.reload().catch(() => {});
        }
        const sourceAuth = source === 'applet' ? appletAuth : auth;
        const freshUser = sourceAuth.currentUser || fbUser;

        if (isUnverifiedPasswordUser(freshUser)) {
          pendingAuthTargetRef.current = source;
          setPendingVerificationEmail(freshUser.email || null);
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEY_USER);
          setAuthInitialTab('verifyEmail');
          setCurrentScreenState((prev) =>
            prev === 'app' || prev === 'personalise' || prev === 'completed' ? 'auth' : prev
          );
          return;
        }

        setPendingVerificationEmail(null);
        pendingAuthTargetRef.current = null;
        const profile = await buildAndHydrateUserProfile(freshUser);
        setCurrentUser(profile);

        if (currentScreenRef.current === 'auth' && authInitialTabRef.current !== 'adminLogin') {
          setAuthInitialTab('signIn');
          setScreen('app');
        }
      } catch (e) {
        console.warn('Error fetching user document from Firestore:', e);
        if (!fbUser.emailVerified && isUnverifiedPasswordUser(fbUser)) {
          pendingAuthTargetRef.current = source;
          setPendingVerificationEmail(fbUser.email || null);
          setCurrentUser(null);
          return;
        }
        setCurrentUser((prev) => prev || {
          id: fbUser.uid,
          email: fbUser.email || '',
          emailVerified: fbUser.emailVerified,
          fullName: fbUser.displayName || 'Radiology Scholar',
          role: 'Qualified Radiographer',
          selectedTopics: ['general_radiography'],
          isGuest: false,
          createdAt: new Date().toISOString(),
          cpdCredits: 0,
        });
      }
    };

    const unsubApplet = onAuthStateChanged(appletAuth, (u) => handleFirebaseAuthChange(u, 'applet'));
    const unsubClient = onAuthStateChanged(auth, (u) => handleFirebaseAuthChange(u, 'client'));

    return () => {
      unsubApplet();
      unsubClient();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not persist notifications', e);
    }
  }, [notifications]);

  const setScreen = (screen: AppScreen) => {
    setCurrentScreenState(screen);
    try {
      localStorage.setItem(STORAGE_KEY_SCREEN, screen);
    } catch (e) {
      console.warn('Could not persist screen state', e);
    }
  };

  // Only redirect to onboarding on first launch if the user has never onboarded
  useEffect(() => {
    try {
      const hasOnboarded = localStorage.getItem('studirad_onboarded');
      if (!currentUser && !hasOnboarded && currentScreen === 'app') {
        setCurrentScreenState('onboarding');
      }
    } catch {}
  }, [currentUser, currentScreen]);

  // Real-time synchronization with Firestore user notifications & role status
  useEffect(() => {
    if (!currentUser?.id) return;

    // 1. Listen for user & instructor notifications in real-time
    const unsubNotifs = subscribeUserNotifications(
      {
        userId: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.fullName,
        isInstructor: Boolean(
          currentUser.isInstructor || currentUser.role === 'Clinical Instructor / Tutor'
        ),
      },
      (realNotifs) => {
        if (Array.isArray(realNotifs)) {
          const mapped: AppNotification[] = realNotifs.map((n) => ({
            id: n.id,
            title: n.title || 'Notification',
            message: n.message || '',
            timestamp: n.createdAt ? formatClockTime12h(n.createdAt) || 'Just now' : 'Just now',
            type: n.type || 'system',
            targetRole: n.targetRole,
            read: Boolean(n.read),
          }));
          setNotifications(mapped);
        }
      }
    );

    // 2. Listen for role changes, tutor approvals & live game score pushes on user profile in Firestore (appletDb + db)
    const handleProfileSnap = (snap: any) => {
      if (snap.exists()) {
        const uData = snap.data();
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const incomingScore = typeof uData.gameScore === 'number' ? uData.gameScore : prev.gameScore;
          const incomingBestStreak = typeof uData.bestStreak === 'number' ? uData.bestStreak : prev.bestStreak;
          const incomingGamesSolved = typeof uData.gamesSolved === 'number' ? uData.gamesSolved : prev.gamesSolved;
          const nextStatsStr = JSON.stringify(uData.gameStats || prev.gameStats || null);
          const prevStatsStr = JSON.stringify(prev.gameStats || null);
          if (
            prev.role !== uData.role ||
            prev.isInstructor !== uData.isInstructor ||
            prev.instructorStatus !== uData.instructorStatus ||
            prev.gameScore !== incomingScore ||
            prev.bestStreak !== incomingBestStreak ||
            prev.gamesSolved !== incomingGamesSolved ||
            prevStatsStr !== nextStatsStr
          ) {
            const updated = {
              ...prev,
              role: uData.role || prev.role,
              isInstructor: Boolean(uData.isInstructor),
              instructorStatus: uData.instructorStatus || prev.instructorStatus,
              gameScore: incomingScore,
              bestStreak: incomingBestStreak,
              gamesSolved: incomingGamesSolved,
              gameStats: uData.gameStats || prev.gameStats,
            };
            try {
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
            } catch {}
            return updated;
          }
          return prev;
        });
      }
    };

    const unsubUser = onSnapshot(doc(db, 'users', currentUser.id), handleProfileSnap, () => {});
    const unsubAppletUser = appletDb
      ? onSnapshot(doc(appletDb, 'users', currentUser.id), handleProfileSnap, () => {})
      : () => {};

    return () => {
      unsubNotifs?.();
      unsubUser?.();
      unsubAppletUser?.();
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.fullName, currentUser?.isInstructor, currentUser?.role]);

  const persistReadIds = (ids: string[]) => {
    try {
      const key = `studirad_read_notifs_${currentUser?.id || 'anon'}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      ids.forEach((id) => {
        existing[id] = true;
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  };

  const markNotificationAsRead = (id: string) => {
    persistReadIds([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (!id.startsWith('inst_')) {
      if (appletDb) {
        setDoc(doc(appletDb, 'notifications', id), { read: true }, { merge: true }).catch(() => {});
      }
      setDoc(doc(db, 'notifications', id), { read: true }, { merge: true }).catch(() => {});
    }
  };

  const markAllNotificationsAsRead = () => {
    persistReadIds(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifications.forEach((n) => {
      if (!n.id.startsWith('inst_')) {
        if (appletDb) {
          setDoc(doc(appletDb, 'notifications', n.id), { read: true }, { merge: true }).catch(() => {});
        }
        setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true }).catch(() => {});
      }
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid academic or professional email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      let userCredential;
      let target: 'applet' | 'client' = 'applet';

      try {
        userCredential = await signInWithEmailAndPassword(appletAuth, cleanEmail, password);
        target = 'applet';
      } catch (appletErr: any) {
        const appletCode = appletErr?.code;
        if (
          appletCode === 'auth/operation-not-allowed' ||
          appletCode === 'auth/user-not-found' ||
          appletCode === 'auth/invalid-credential'
        ) {
          userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          target = 'client';
        } else {
          throw appletErr;
        }
      }

      await userCredential.user.reload().catch(() => {});
      const targetAuth = target === 'applet' ? appletAuth : auth;
      const fbUser = targetAuth.currentUser || userCredential.user;

      if (isUnverifiedPasswordUser(fbUser)) {
        const targetEmail = fbUser.email || cleanEmail;
        pendingAuthTargetRef.current = target;

        let sent = true;
        let verificationError: string | undefined;
        const msSinceLastSend = Date.now() - lastVerificationSentAtRef.current;

        if (msSinceLastSend > 55000) {
          const sendRes = await sendVerificationEmailSafely(fbUser, target);
          sent = sendRes.sent;
          verificationError = sendRes.error;
        }

        setPendingVerificationEmail(targetEmail);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY_USER);
        setAuthInitialTab('verifyEmail');
        return {
          success: true,
          requiresEmailVerification: true,
          email: targetEmail,
          verificationEmailSent: sent,
          verificationError,
        };
      }

      setPendingVerificationEmail(null);
      pendingAuthTargetRef.current = null;
      const user = await buildAndHydrateUserProfile(fbUser);
      setCurrentUser(user);
      setAuthInitialTab('signIn');
      setScreen('app');
      return { success: true };
    } catch (firebaseErr: any) {
      console.warn('Sign in notice:', firebaseErr);
      const code = firebaseErr?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        return { 
          success: false, 
          error: 'Incorrect email or password. Please verify your details or click "User Sign Up" to register.' 
        };
      }
      if (code === 'auth/wrong-password') {
        return { 
          success: false, 
          error: 'Incorrect password. Please verify and try again or use password recovery.' 
        };
      }
      if (code === 'auth/invalid-email') {
        return { 
          success: false, 
          error: 'Please provide a valid email format.' 
        };
      }
      if (code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'Too many sign-in attempts. Please wait a few minutes or reset your password.'
        };
      }
      if (code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'Email/password sign-in is currently disabled in Firebase Authentication settings.'
        };
      }
      return { 
        success: false, 
        error: firebaseErr.message || 'Unable to sign in. Please verify your credentials.' 
      };
    }
  };

  const adminSignIn = async (email: string, passkey: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { 
        success: false, 
        error: 'Please enter a valid administrator email address.' 
      };
    }

    if (!passkey || passkey.trim().length < 4) {
      return { 
        success: false, 
        error: 'Please enter your administrator passkey.' 
      };
    }

    try {
      // Authenticate with live adminAuth Firebase instance (studirad-admin-portal)
      const cred = await signInWithEmailAndPassword(adminAuth, cleanEmail, passkey);
      const fbAdmin = cred.user;

      const adminProfile: UserProfile = {
        id: fbAdmin.uid,
        email: fbAdmin.email || cleanEmail,
        fullName: cleanEmail.includes('wisdom') ? 'Wisdom Warrie (Lead Admin)' : (fbAdmin.displayName || 'StudiRad Faculty Admin'),
        role: 'Administrator',
        selectedTopics: ['general_radiography', 'ct_mri', 'ultrasound', 'radiation_protection'],
        isGuest: false,
        isAdmin: true,
        institution: 'StudiRad Central Governance',
        createdAt: new Date().toISOString(),
        cpdCredits: 0,
      };

      setCurrentUser(adminProfile);
      setScreen('admin');
      return { success: true };
    } catch (firebaseErr: any) {
      console.warn('Admin sign-in authentication notice:', firebaseErr);

      // Known admin accounts fallback for testing or initial setup
      const isKnownAdmin = cleanEmail === 'wisdomwarrie11@gmail.com' || cleanEmail === 'studiradinfo@studirad.org';
      if (isKnownAdmin && (firebaseErr?.code === 'auth/operation-not-allowed' || firebaseErr?.code === 'auth/network-request-failed' || firebaseErr?.code === 'auth/user-not-found')) {
        const adminProfile: UserProfile = {
          id: 'admin_studirad_super',
          email: cleanEmail,
          fullName: cleanEmail.includes('wisdom') ? 'Wisdom Warrie (Lead Admin)' : 'StudiRad Faculty Admin',
          role: 'Administrator',
          selectedTopics: ['general_radiography', 'ct_mri', 'ultrasound', 'radiation_protection'],
          isGuest: false,
          isAdmin: true,
          institution: 'StudiRad Central Governance',
          createdAt: new Date().toISOString(),
          cpdCredits: 0,
        };
        setCurrentUser(adminProfile);
        setScreen('admin');
        return { success: true };
      }

      const errMsg = firebaseErr?.code === 'auth/invalid-credential' || firebaseErr?.code === 'auth/wrong-password' || firebaseErr?.code === 'auth/user-not-found'
        ? 'Invalid administrator credentials. Only verified administrators provisioned in the admin portal (studirad-admin-portal) have access.'
        : (firebaseErr.message || 'Administrator authentication failed. Please verify credentials.');

      return { 
        success: false, 
        error: errMsg
      };
    }
  };

  const adminSignOut = async () => {
    await fbSignOut(adminAuth).catch(() => {});
    if (currentUser?.isAdmin) {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
    openAuthWithTab('adminLogin');
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: ProfessionalRole;
  }): Promise<AuthActionResult> => {
    if (!data.fullName.trim()) {
      return { success: false, error: 'Please enter your full clinical or academic name.' };
    }
    if (!data.email || !data.email.includes('@')) {
      return { success: false, error: 'Please provide a valid institutional email address.' };
    }
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    try {
      const cleanEmail = data.email.trim().toLowerCase();
      let userCredential;
      let target: 'applet' | 'client' = 'applet';

      try {
        userCredential = await createUserWithEmailAndPassword(appletAuth, cleanEmail, data.password);
        target = 'applet';
      } catch (appletErr: any) {
        if (appletErr?.code === 'auth/operation-not-allowed') {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
          target = 'client';
        } else {
          throw appletErr;
        }
      }

      const fbUser = userCredential.user;
      pendingAuthTargetRef.current = target;

      await updateProfile(fbUser, { displayName: data.fullName.trim() }).catch(() => {});

      const profilePayload = {
        fullName: data.fullName.trim(),
        role: data.role,
        selectedTopics: [],
        cpdCredits: 0,
        email: cleanEmail,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await Promise.allSettled([
        appletDb ? setDoc(doc(appletDb, 'users', fbUser.uid), profilePayload, { merge: true }) : Promise.resolve(),
        setDoc(doc(db, 'users', fbUser.uid), profilePayload, { merge: true }),
      ]);

      const sendRes = await sendVerificationEmailSafely(fbUser, target);

      setPendingVerificationEmail(cleanEmail);
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY_USER);
      setAuthInitialTab('verifyEmail');

      return {
        success: true,
        requiresEmailVerification: true,
        email: cleanEmail,
        verificationEmailSent: sendRes.sent,
        verificationError: sendRes.error,
      };
    } catch (firebaseErr: any) {
      console.warn('Email sign up notice:', firebaseErr);
      if (firebaseErr?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }
      if (firebaseErr?.code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Please use at least 8 characters with letters and numbers.' };
      }
      if (firebaseErr?.code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Email/password registration is currently disabled in Firebase Authentication.' };
      }
      return { success: false, error: firebaseErr.message || 'Registration failed.' };
    }
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; alreadyVerified?: boolean; error?: string }> => {
    const pending = getPendingAuthUser();
    if (!pending) {
      return { success: false, error: 'Your session has expired. Please sign in again to resend the verification email.' };
    }

    try {
      await pending.fbUser.reload();
      const targetAuth = pending.target === 'applet' ? appletAuth : auth;
      const refreshed = targetAuth.currentUser || pending.fbUser;
      if (refreshed.emailVerified) {
        const profile = await buildAndHydrateUserProfile(refreshed);
        setPendingVerificationEmail(null);
        pendingAuthTargetRef.current = null;
        setCurrentUser(profile);
        setAuthInitialTab('signIn');
        setScreen('app');
        return { success: true, alreadyVerified: true };
      }

      const sendRes = await sendVerificationEmailSafely(refreshed, pending.target);
      if (!sendRes.sent) {
        return { success: false, error: sendRes.error || 'Could not resend verification email. Please try again.' };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Resend verification notice:', err);
      if (err?.code === 'auth/too-many-requests') {
        return { success: false, error: 'Please wait a moment before requesting another verification email.' };
      }
      return { success: false, error: err?.message || 'Could not resend verification email. Please try again.' };
    }
  };

  const checkEmailVerification = async (): Promise<{ success: boolean; verified: boolean; error?: string }> => {
    const pending = getPendingAuthUser();
    if (!pending) {
      return {
        success: false,
        verified: false,
        error: 'Session expired. Please sign in with your email and password to continue.',
      };
    }

    try {
      await pending.fbUser.reload();
      await pending.fbUser.getIdToken(true).catch(() => {});
      const targetAuth = pending.target === 'applet' ? appletAuth : auth;
      const refreshed = targetAuth.currentUser || pending.fbUser;
      if (!refreshed.emailVerified) {
        return {
          success: false,
          verified: false,
          error: 'Email is not verified yet. Please click the verification link in your inbox (or Spam folder) first.',
        };
      }

      const profile = await buildAndHydrateUserProfile(refreshed);
      setPendingVerificationEmail(null);
      pendingAuthTargetRef.current = null;
      setCurrentUser(profile);
      setAuthInitialTab('signIn');
      setScreen('app');
      return { success: true, verified: true };
    } catch (err: any) {
      console.warn('Check verification notice:', err);
      if (err?.code === 'auth/user-token-expired') {
        return {
          success: false,
          verified: false,
          error: 'Your email may now be verified! Please sign in again with your email and password.',
        };
      }
      return {
        success: false,
        verified: false,
        error: err?.message || 'Unable to check verification status right now. Please try again.',
      };
    }
  };

  const cancelEmailVerification = async (): Promise<void> => {
    await Promise.allSettled([fbSignOut(appletAuth), fbSignOut(auth)]);
    setPendingVerificationEmail(null);
    pendingAuthTargetRef.current = null;
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setAuthInitialTab('signIn');
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { targetAuth, provider } = getGoogleAuthPair();
      const result = await signInWithPopup(targetAuth, provider);
      const fbUser = result.user;

      setPendingVerificationEmail(null);
      pendingAuthTargetRef.current = null;
      const profile = await buildAndHydrateUserProfile(fbUser);

      setCurrentUser(profile);
      setAuthInitialTab('signIn');
      setScreen('app');
      return { success: true };
    } catch (error: any) {
      console.warn('Google Sign-In notice:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Google sign-in window was closed before completing.' };
      }
      if (error?.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Only one sign-in window can be open at a time.' };
      }
      if (error?.code === 'auth/popup-blocked') {
        return { success: false, error: 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.' };
      }
      if (error?.code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: `This domain (${window.location.hostname}) is not authorized for Google Sign-In in Firebase Console.`,
        };
      }
      return { 
        success: false, 
        error: error?.message || 'Google sign-in could not be completed. Please check your connection or use email.' 
      };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const cleanEmail = email.trim();
    try {
      try {
        await sendPasswordResetEmail(appletAuth, cleanEmail);
      } catch (err: any) {
        if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/user-not-found') {
          await sendPasswordResetEmail(auth, cleanEmail);
        } else {
          throw err;
        }
      }
      return { success: true };
    } catch (e: any) {
      console.warn('Password reset notice:', e);
      return { success: true };
    }
  };

  const loginAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 7),
      email: 'guest.radiographer@studirad.org',
      fullName: 'Guest Imaging Scholar',
      role: 'Guest Explorer',
      selectedTopics: ['general_radiography'],
      isGuest: true,
      createdAt: new Date().toISOString(),
      cpdCredits: 0,
    };
    setCurrentUser(guestUser);
    setScreen('personalise');
  };

  const saveSelectedTopics = async (topics: string[], navigateToApp: boolean = true) => {
    if (currentUser) {
      const updated = { ...currentUser, selectedTopics: topics };
      setCurrentUser(updated);

      if (!currentUser.isGuest && currentUser.id) {
        const topicPatch = { selectedTopics: topics, updatedAt: new Date().toISOString() };
        await Promise.allSettled([
          appletDb ? setDoc(doc(appletDb, 'users', currentUser.id), topicPatch, { merge: true }) : Promise.resolve(),
          setDoc(doc(db, 'users', currentUser.id), topicPatch, { merge: true }),
        ]);
      }
    }
    if (navigateToApp) {
      setScreen('app');
    } else {
      setScreen('completed');
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (appletAuth.currentUser) {
        await appletAuth.currentUser.delete();
      }
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
    } catch (e) {
      console.warn('Could not delete Firebase Auth user:', e);
    }
    await Promise.allSettled([fbSignOut(appletAuth), fbSignOut(auth)]);
    setPendingVerificationEmail(null);
    pendingAuthTargetRef.current = null;
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_SCREEN);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuthInitialTab('signIn');
    setScreen('auth');
    return { success: true };
  };

  const signOut = async () => {
    await Promise.allSettled([fbSignOut(appletAuth), fbSignOut(auth), fbSignOut(adminAuth)]);
    setPendingVerificationEmail(null);
    pendingAuthTargetRef.current = null;
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setAuthInitialTab('signIn');
    setScreen('app');
  };

  const resetToSplash = async () => {
    await Promise.allSettled([fbSignOut(appletAuth), fbSignOut(auth), fbSignOut(adminAuth)]);
    setPendingVerificationEmail(null);
    pendingAuthTargetRef.current = null;
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_SCREEN);
    localStorage.removeItem('studirad_onboarded');
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab('home');
    setAuthInitialTab('signIn');
    setScreen('splash');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminUser,
        isAdminAuthenticated: Boolean(adminUser || currentUser?.isAdmin),
        authInitialTab,
        pendingVerificationEmail,
        openAuthWithTab,
        currentScreen,
        setScreen,
        activeTab,
        setActiveTab,
        learnInitialView,
        setLearnInitialView,
        navigateToLearn,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        signIn,
        adminSignIn,
        adminSignOut,
        signUp,
        resendVerificationEmail,
        checkEmailVerification,
        cancelEmailVerification,
        signInWithGoogle,
        sendPasswordReset,
        loginAsGuest,
        saveSelectedTopics,
        deleteAccount,
        signOut,
        resetToSplash,
        isFirebaseConnected,
        authPrompt,
        requireAuth,
        closeAuthPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
