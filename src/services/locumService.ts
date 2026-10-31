import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, adminDb } from '../firebase';
import { LocumProfile } from '../types';

export const PRIMARY_LOCUM_COLLECTION = 'locum_profiles';
export const FALLBACK_LOCUM_COLLECTION = 'locums';

/**
 * Sanitizes email for use as document ID matching web app logic:
 * email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '_')
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '_');
};

/**
 * Generates searchKeys matching web app logic:
 * State and State_LGA
 */
export const generateSearchKeys = (locations: { state: string; lgas: string[] }[] = []): string[] => {
  const searchKeys: string[] = [];
  locations.forEach((loc) => {
    if (loc.state) {
      searchKeys.push(loc.state); // State-level tag
      searchKeys.push(loc.state.toLowerCase());
      loc.lgas?.forEach((lga) => {
        searchKeys.push(`${loc.state}_${lga}`); // Specific LGA tag
        searchKeys.push(`${loc.state.toLowerCase()}_${lga.toLowerCase()}`);
      });
    }
  });
  return Array.from(new Set(searchKeys));
};

/**
 * Helper to parse a Firestore document snapshot into LocumProfile
 */
function parseLocumDoc(docSnap: any): LocumProfile {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    fullName: data.fullName || data.name || 'Radiographer',
    email: data.email || docSnap.id,
    phone: data.phone || data.phoneNumber || '',
    specialties: Array.isArray(data.specialties) ? data.specialties : [],
    gender: data.gender || 'Male',
    minCharge: Number(data.minCharge) || Number(data.rate) || 25000,
    maxHours: Number(data.maxHours) || 8,
    availability: Array.isArray(data.availability) ? data.availability : [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    isAvailable: data.isAvailable !== undefined ? !!data.isAvailable : true,
    isOpenToWork: data.isOpenToWork !== undefined ? !!data.isOpenToWork : (data.isAvailable !== undefined ? !!data.isAvailable : true),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Search locums by State and optional LGA in Firestore (studirad-platform-new & studirad-admin-portal)
 * Queries 'locum_profiles' and falls back to 'locums'
 */
export async function searchLocums(state?: string, lga?: string): Promise<LocumProfile[]> {
  const resultsMap = new Map<string, LocumProfile>();

  const processDoc = (docSnap: any) => {
    const data = docSnap.data();
    // Exclude only explicitly offline users
    if (data.isAvailable === false && data.isOpenToWork === false) return;

    const profile = parseLocumDoc(docSnap);
    const searchKeys: string[] = Array.isArray(data.searchKeys) ? data.searchKeys : [];

    // If no state filter, return all available locums
    if (!state || state.trim() === '' || state.toLowerCase() === 'all') {
      resultsMap.set(profile.email || docSnap.id, profile);
      return;
    }

    // Match criteria:
    // 1. Check array-contains style searchKeys
    const searchTag = lga && lga !== 'All' ? `${state}_${lga}` : state;
    const searchTagLower = searchTag.toLowerCase();
    const hasTagInSearchKeys = searchKeys.some(
      (k) => k.toLowerCase() === searchTagLower || k.toLowerCase() === state.toLowerCase()
    );

    // 2. Check locations array directly
    const hasLocationMatch = profile.locations?.some((loc) => {
      const matchState = loc.state?.toLowerCase() === state.toLowerCase();
      if (!matchState) return false;
      if (!lga || lga === '' || lga === 'All') return true;
      return loc.lgas?.some((l) => l.toLowerCase() === lga.toLowerCase());
    });

    if (hasTagInSearchKeys || hasLocationMatch) {
      resultsMap.set(profile.email || docSnap.id, profile);
    }
  };

  // 1. Fetch from 'locum_profiles' in db
  try {
    const snap1 = await getDocs(collection(db, PRIMARY_LOCUM_COLLECTION));
    snap1.docs.forEach(processDoc);
  } catch (e) {
    console.warn('Error querying db locum_profiles:', e);
  }

  // 2. Fetch from 'locums' in db as fallback
  try {
    const snap2 = await getDocs(collection(db, FALLBACK_LOCUM_COLLECTION));
    snap2.docs.forEach(processDoc);
  } catch (e) {
    console.warn('Error querying db locums:', e);
  }

  // 3. Fetch from 'locum_profiles' in adminDb (studirad-admin-portal)
  try {
    const snap3 = await getDocs(collection(adminDb, PRIMARY_LOCUM_COLLECTION));
    snap3.docs.forEach(processDoc);
  } catch (e) {
    console.warn('Error querying adminDb locum_profiles:', e);
  }

  return Array.from(resultsMap.values());
}

/**
 * Real-time listener for all active locums in Firestore
 */
export function subscribeLocums(
  onUpdate: (locums: LocumProfile[]) => void,
  state?: string,
  lga?: string
): () => void {
  const locumsMap = new Map<string, LocumProfile>();

  const emit = () => {
    const all = Array.from(locumsMap.values());
    if (!state || state === 'All') {
      onUpdate(all);
      return;
    }
    const filtered = all.filter((p) => {
      return p.locations?.some((loc) => {
        const matchState = loc.state?.toLowerCase() === state.toLowerCase();
        if (!matchState) return false;
        if (!lga || lga === 'All' || lga === '') return true;
        return loc.lgas?.some((l) => l.toLowerCase() === lga.toLowerCase());
      });
    });
    onUpdate(filtered);
  };

  const unsubs: (() => void)[] = [];

  // Listen to locum_profiles in db
  try {
    const u1 = onSnapshot(collection(db, PRIMARY_LOCUM_COLLECTION), (snap) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isAvailable !== false || data.isOpenToWork !== false) {
          locumsMap.set(docSnap.id, parseLocumDoc(docSnap));
        }
      });
      emit();
    }, (err) => console.warn('locum_profiles listener error:', err));
    unsubs.push(u1);
  } catch {}

  // Also listen to locums in db
  try {
    const u2 = onSnapshot(collection(db, FALLBACK_LOCUM_COLLECTION), (snap) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isAvailable !== false || data.isOpenToWork !== false) {
          locumsMap.set(docSnap.id, parseLocumDoc(docSnap));
        }
      });
      emit();
    }, (err) => console.warn('locums listener error:', err));
    unsubs.push(u2);
  } catch {}

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Fetch a single locum profile by email matching web app logic
 */
export async function getLocumProfile(email: string): Promise<LocumProfile | null> {
  if (!email) return null;
  const docId = sanitizeEmail(email);

  // 1. Try 'locum_profiles' with docId
  try {
    const snap1 = await getDoc(doc(db, PRIMARY_LOCUM_COLLECTION, docId));
    if (snap1.exists()) return parseLocumDoc(snap1);
  } catch {}

  // 2. Try 'locum_profiles' with raw email
  try {
    const snap2 = await getDoc(doc(db, PRIMARY_LOCUM_COLLECTION, email.toLowerCase().trim()));
    if (snap2.exists()) return parseLocumDoc(snap2);
  } catch {}

  // 3. Try 'locums'
  try {
    const snap3 = await getDoc(doc(db, FALLBACK_LOCUM_COLLECTION, docId));
    if (snap3.exists()) return parseLocumDoc(snap3);
  } catch {}

  // 4. Query where email == email
  try {
    const q = query(collection(db, PRIMARY_LOCUM_COLLECTION), where('email', '==', email.toLowerCase().trim()));
    const snap4 = await getDocs(q);
    if (!snap4.empty) return parseLocumDoc(snap4.docs[0]);
  } catch {}

  return null;
}

/**
 * Register or update a locum profile in Firestore
 * Writes to 'locum_profiles' (and mirrors to 'locums' and adminDb)
 */
export async function registerLocum(profile: Partial<LocumProfile>): Promise<boolean> {
  if (!profile.email) return false;
  const docId = sanitizeEmail(profile.email);
  const cleanEmail = profile.email.toLowerCase().trim();

  // Generate search keys format: "State" and "State_LGA"
  const searchKeys = generateSearchKeys(profile.locations || []);

  const dataToSave = {
    ...profile,
    email: cleanEmail,
    id: docId,
    searchKeys,
    isAvailable: profile.isAvailable !== undefined ? profile.isAvailable : true,
    isOpenToWork: profile.isOpenToWork !== undefined ? profile.isOpenToWork : true,
    subscription: { isActive: true },
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let success = false;

  // 1. Save to db 'locum_profiles' (Primary web app collection)
  try {
    await setDoc(doc(db, PRIMARY_LOCUM_COLLECTION, docId), dataToSave, { merge: true });
    success = true;
  } catch (e) {
    console.error('Error saving to locum_profiles:', e);
  }

  // 2. Save to db 'locums' for backward compatibility
  try {
    await setDoc(doc(db, FALLBACK_LOCUM_COLLECTION, docId), dataToSave, { merge: true });
  } catch {}

  // 3. Mirror to adminDb 'locum_profiles'
  try {
    await setDoc(doc(adminDb, PRIMARY_LOCUM_COLLECTION, docId), dataToSave, { merge: true });
  } catch {}

  localStorage.setItem('studiRad_locum_email', cleanEmail);
  return success;
}

/**
 * Update Locum Profile
 */
export const updateLocum = registerLocum;

/**
 * Toggle Locum availability ("Open to Work" status)
 */
export async function toggleLocumAvailability(email: string, isAvailable: boolean): Promise<boolean> {
  if (!email) return false;
  const docId = sanitizeEmail(email);
  const cleanEmail = email.toLowerCase().trim();

  const updatePayload = {
    isAvailable,
    isOpenToWork: isAvailable,
    updatedAt: new Date().toISOString(),
  };

  let success = false;

  // Update locum_profiles
  try {
    await updateDoc(doc(db, PRIMARY_LOCUM_COLLECTION, docId), updatePayload);
    success = true;
  } catch {
    try {
      await setDoc(doc(db, PRIMARY_LOCUM_COLLECTION, docId), updatePayload, { merge: true });
      success = true;
    } catch {}
  }

  // Update locums
  try {
    await updateDoc(doc(db, FALLBACK_LOCUM_COLLECTION, docId), updatePayload).catch(() => {});
  } catch {}

  // Mirror to adminDb
  try {
    await updateDoc(doc(adminDb, PRIMARY_LOCUM_COLLECTION, docId), updatePayload).catch(() => {});
  } catch {}

  return success;
}

/**
 * Subscribe in real time to current user's locum profile
 */
export function subscribeLocumProfile(
  email: string,
  onUpdate: (profile: LocumProfile | null) => void
): () => void {
  if (!email) {
    onUpdate(null);
    return () => {};
  }

  const docId = sanitizeEmail(email);
  const cleanEmail = email.toLowerCase().trim();

  try {
    const unsub = onSnapshot(doc(db, PRIMARY_LOCUM_COLLECTION, docId), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(parseLocumDoc(docSnap));
      } else {
        // Fallback check
        getLocumProfile(cleanEmail).then((p) => onUpdate(p)).catch(() => onUpdate(null));
      }
    }, (err) => {
      console.warn('subscribeLocumProfile notice:', err);
    });

    return unsub;
  } catch {
    return () => {};
  }
}
