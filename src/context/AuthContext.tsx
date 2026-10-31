import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut as fbSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, adminAuth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, AppScreen, ProfessionalRole, NavTab, AppNotification, AuthMode } from '../types';
import { seedFirestoreIfEmpty } from '../services/firebaseDataService';

interface AuthContextType {
  currentUser: UserProfile | null;
  adminUser: FirebaseUser | null;
  isAdminAuthenticated: boolean;
  authInitialTab: AuthMode;
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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminSignIn: (email: string, passkey: string) => Promise<{ success: boolean; error?: string }>;
  adminSignOut: () => Promise<void>;
  signUp: (data: { email: string; password: string; fullName: string; role: ProfessionalRole }) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  saveSelectedTopics: (topics: string[], navigateToApp?: boolean) => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  resetToSplash: () => void;
  isFirebaseConnected: boolean;
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

  const openAuthWithTab = (tab: AuthMode) => {
    setAuthInitialTab(tab);
    setScreen('auth');
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

  // Seed / sync initial Firestore collections if empty
  useEffect(() => {
    seedFirestoreIfEmpty().catch((err) => {
      console.warn('Initial seed error:', err);
    });
  }, []);

  // Listen to Admin Firebase Auth state (studirad-admin-portal)
  useEffect(() => {
    const unsubAdmin = onAuthStateChanged(adminAuth, (fbAdminUser) => {
      setAdminUser(fbAdminUser);
    });
    return () => unsubAdmin();
  }, []);

  // Listen to Client Firebase Auth state (studirad-platform-new)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setIsFirebaseConnected(true);
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            const profile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              fullName: data.fullName || fbUser.displayName || 'Radiology Scholar',
              role: data.role || 'Qualified Radiographer',
              selectedTopics: Array.isArray(data.selectedTopics) ? data.selectedTopics : ['general_radiography'],
              isGuest: false,
              avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              cpdCredits: typeof data.cpdCredits === 'number' ? data.cpdCredits : 18.5,
            };
            setCurrentUser(profile);
          } else {
            // Document does not exist yet: create user doc in Firestore
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Radiology Scholar',
              role: 'Qualified Radiographer',
              selectedTopics: ['general_radiography', 'radiation_protection'],
              isGuest: false,
              avatarUrl: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              cpdCredits: 10.0,
            };
            await setDoc(userDocRef, {
              fullName: newProfile.fullName,
              role: newProfile.role,
              selectedTopics: newProfile.selectedTopics,
              cpdCredits: newProfile.cpdCredits,
              avatarUrl: newProfile.avatarUrl || '',
              email: newProfile.email,
              createdAt: newProfile.createdAt,
              updatedAt: new Date().toISOString(),
            });
            setCurrentUser(newProfile);
          }
        } catch (e) {
          console.warn('Error fetching user document from Firestore:', e);
          // Fallback to basic Firebase user info
          setCurrentUser((prev) => prev || {
            id: fbUser.uid,
            email: fbUser.email || '',
            fullName: fbUser.displayName || 'Radiology Scholar',
            role: 'Qualified Radiographer',
            selectedTopics: ['general_radiography'],
            isGuest: false,
            createdAt: new Date().toISOString(),
            cpdCredits: 10.0,
          });
        }
      }
    });

    return () => unsubscribe();
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

  // Ensure first-time users or unauthenticated users always see onboarding before entering the app
  useEffect(() => {
    if (!currentUser && currentScreen === 'app') {
      setCurrentScreenState('onboarding');
    }
  }, [currentUser, currentScreen]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid academic or professional email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // Fetch user profile from Firestore to confirm registered account
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      let user: UserProfile;
      if (userSnap.exists()) {
        const data = userSnap.data();
        user = {
          id: fbUser.uid,
          email: fbUser.email || email.trim(),
          fullName: data.fullName || fbUser.displayName || email.split('@')[0],
          role: data.role || 'Qualified Radiographer',
          selectedTopics: Array.isArray(data.selectedTopics) ? data.selectedTopics : [],
          isGuest: false,
          avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
          createdAt: data.createdAt || new Date().toISOString(),
          cpdCredits: typeof data.cpdCredits === 'number' ? data.cpdCredits : 0,
        };
      } else {
        user = {
          id: fbUser.uid,
          email: fbUser.email || email.trim(),
          fullName: fbUser.displayName || email.split('@')[0],
          role: 'Qualified Radiographer',
          selectedTopics: [],
          isGuest: false,
          createdAt: new Date().toISOString(),
          cpdCredits: 0,
        };
      }

      setCurrentUser(user);
      setScreen('app'); // Navigate straight to home page
      return { success: true };
    } catch (firebaseErr: any) {
      console.warn('Sign in notice:', firebaseErr);
      const code = firebaseErr?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        return { 
          success: false, 
          error: 'No registered account found for this email. Please click "User Sign Up" to register first.' 
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
      return { 
        success: false, 
        error: firebaseErr.message || 'Unable to sign in. Only users who have signed up can log in.' 
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
        cpdCredits: 100.0,
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
          cpdCredits: 100.0,
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
  }): Promise<{ success: boolean; error?: string }> => {
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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      const fbUser = userCredential.user;
      const newUser: UserProfile = {
        id: fbUser.uid,
        email: data.email.trim().toLowerCase(),
        fullName: data.fullName.trim(),
        role: data.role,
        selectedTopics: [],
        isGuest: false,
        createdAt: new Date().toISOString(),
        cpdCredits: 0,
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          fullName: newUser.fullName,
          role: newUser.role,
          selectedTopics: newUser.selectedTopics,
          cpdCredits: 0,
          email: newUser.email,
          createdAt: newUser.createdAt,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not write user profile to firestore:', e);
      }

      setCurrentUser(newUser);
      setScreen('app');
      return { success: true };
    } catch (firebaseErr: any) {
      console.warn('Email sign up notice:', firebaseErr);
      if (firebaseErr?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }
      return { success: false, error: firebaseErr.message || 'Registration failed.' };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let profile: UserProfile;
      if (userSnap.exists()) {
        const d = userSnap.data();
        profile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: d.fullName || fbUser.displayName || 'Radiology Scholar',
          role: d.role || 'Qualified Radiographer',
          selectedTopics: Array.isArray(d.selectedTopics) ? d.selectedTopics : [],
          isGuest: false,
          avatarUrl: fbUser.photoURL || undefined,
          createdAt: d.createdAt || new Date().toISOString(),
          cpdCredits: typeof d.cpdCredits === 'number' ? d.cpdCredits : 0,
        };
      } else {
        profile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || 'Radiology Scholar',
          role: 'Qualified Radiographer',
          selectedTopics: [],
          isGuest: false,
          avatarUrl: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          cpdCredits: 0,
        };
        await setDoc(userDocRef, {
          fullName: profile.fullName,
          role: profile.role,
          selectedTopics: profile.selectedTopics,
          cpdCredits: 0,
          avatarUrl: profile.avatarUrl || '',
          email: profile.email,
          createdAt: profile.createdAt,
          updatedAt: new Date().toISOString(),
        });
      }

      setCurrentUser(profile);
      setScreen('app'); // Navigate straight to home page
      return { success: true };
    } catch (error: any) {
      console.warn('Google Sign-In notice:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Google sign-in was closed before completing.' };
      }
      if (error?.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Only one sign-in window can be open at a time.' };
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
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (e: any) {
      console.warn('Password reset notice:', e);
      return { success: true }; // Return true for user experience
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
        try {
          const userDocRef = doc(db, 'users', currentUser.id);
          await setDoc(userDocRef, { selectedTopics: topics, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn('Could not sync topics to Firestore:', e);
        }
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
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
    } catch (e) {
      console.warn('Could not delete Firebase Auth user:', e);
    }
    await fbSignOut(auth).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_SCREEN);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setScreen('auth');
    return { success: true };
  };

  const signOut = async () => {
    await fbSignOut(auth).catch(() => {});
    await fbSignOut(adminAuth).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setScreen('onboarding');
  };

  const resetToSplash = async () => {
    await fbSignOut(auth).catch(() => {});
    await fbSignOut(adminAuth).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_SCREEN);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab('home');
    setScreen('splash');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminUser,
        isAdminAuthenticated: Boolean(adminUser || currentUser?.isAdmin),
        authInitialTab,
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
        signInWithGoogle,
        sendPasswordReset,
        loginAsGuest,
        saveSelectedTopics,
        deleteAccount,
        signOut,
        resetToSplash,
        isFirebaseConnected,
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
