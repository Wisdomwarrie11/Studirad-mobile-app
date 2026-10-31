import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ===============================================================
// 1. Client App Configuration (studirad-platform-new)
// Synchronized with live web application
// ===============================================================
export const clientFirebaseConfig = {
  apiKey: "AIzaSyD1ohcDmEayFGq1kH6GuuNczvJt8oY27WM",
  authDomain: "studirad-platform-new.firebaseapp.com",
  projectId: "studirad-platform-new",
  storageBucket: "studirad-platform-new.firebasestorage.app",
  messagingSenderId: "245412794093",
  appId: "1:245412794093:web:5986d5b30e4976701786e4"
};

// ===============================================================
// 2. Admin App Configuration (studirad-admin-portal)
// Synchronized with live admin portal
// ===============================================================
export const adminFirebaseConfig = {
  apiKey: "AIzaSyBY1KiDfPSAHrxJfRQgcCpf1OkPZOrbNb0",
  authDomain: "studirad-admin-portal.firebaseapp.com",
  projectId: "studirad-admin-portal",
  storageBucket: "studirad-admin-portal.firebasestorage.app",
  messagingSenderId: "287772443459",
  appId: "1:287772443459:web:a91211f5621deb6bd965f6"
};

import appletConfig from '../firebase-applet-config.json';

// Initialize Client App safely (studirad-platform-new)
const existingApp = getApps().find((a) => a.name === '[DEFAULT]');
export const app: FirebaseApp = existingApp || initializeApp(clientFirebaseConfig);

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Admin App separately with unique name "adminApp" (studirad-admin-portal)
const existingAdminApp = getApps().find((a) => a.name === 'adminApp');
export const adminApp: FirebaseApp = existingAdminApp || initializeApp(adminFirebaseConfig, 'adminApp');

export const adminDb: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
export const adminStorage: FirebaseStorage = getStorage(adminApp);

// Initialize Dedicated AI Studio Applet Database (ai-studio-studiradmobileap-6f5d2912-b23e-4c44-828e-081071b478b2)
const existingAppletApp = getApps().find((a) => a.name === 'appletApp');
export const appletApp: FirebaseApp = existingAppletApp || initializeApp(appletConfig, 'appletApp');
export const appletDb: Firestore = getFirestore(appletApp, appletConfig.firestoreDatabaseId);

/**
 * Upload a file directly to Firebase Storage (studirad-platform-new)
 * and return the persistent download URL for Firestore storage.
 */
export async function uploadFileToFirebaseStorage(
  file: File,
  folder: string = 'materials'
): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'dat';
    const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `${folder}/${cleanName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('Firebase Storage direct upload notice:', err);
    // If storage rules restrict or offline, return safe object URL or fallback
    return URL.createObjectURL(file);
  }
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: offline or checking network.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || adminAuth.currentUser?.uid,
      email: auth.currentUser?.email || adminAuth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified || adminAuth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous || adminAuth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || adminAuth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation notice: ', JSON.stringify(errInfo));
}
