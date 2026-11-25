import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc,
  getDocs, 
  query,
  limit
} from 'firebase/firestore';
import { db, adminDb, appletDb, handleFirestoreError, OperationType } from '../firebase';
import { 
  Opportunity, 
  LiveClass, 
  Webinar, 
  Course, 
  ClinicalResource, 
  ClinicalModality, 
  StudyMaterial, 
  EnrolledCourseRecord,
  TutorApplication,
  TutorialRequest,
  TutorAvailability,
  AppNotification,
  PrivateClass,
  PrivateClassBookingRequest,
  RatableContentType,
  ContentRating
} from '../types';
import { getYouTubeThumbnail } from '../utils/youtube';
import { formatTime12h } from '../utils/timeFormat';
import { RESEARCH_REPRESENTATIVES, RepresentativeInfo } from './researchAssistanceConfig';

export type { EnrolledCourseRecord };

export interface UserIdentityFilter {
  userId?: string;
  email?: string;
  fullName?: string;
  isInstructor?: boolean;
}

function matchesUserRecord(
  filter: UserIdentityFilter,
  ...candidates: Array<string | undefined | null>
): boolean {
  const uid = filter.userId?.trim();
  const email = filter.email?.trim().toLowerCase();
  return candidates.some((val) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (uid && trimmed === uid) return true;
    if (email && trimmed.toLowerCase() === email) return true;
    return false;
  });
}

/**
 * Recursively removes undefined values from objects/arrays so Firestore setDoc never throws
 * "Unsupported field value: undefined". Preserves Date objects and Firestore Timestamps.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (typeof (value as any).toDate === 'function') return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  const cleanObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(value as Record<string, any>)) {
    if (v === undefined) continue;
    const sanitizedVal = sanitizeForFirestore(v);
    if (sanitizedVal !== undefined) {
      cleanObj[k] = sanitizedVal;
    }
  }
  return cleanObj as T;
}

/**
 * Writes a document reliably across appletDb (authoritative AI Studio DB), db, and adminDb.
 * Succeeds if at least one DB write succeeds (primarily appletDb), preventing external project rules
 * from blocking legitimate submissions.
 */
async function writeDocToAllDbs(
  collectionName: string,
  docId: string,
  rawData: Record<string, any>,
  includeAdminDb: boolean = false
): Promise<void> {
  const cleanData = sanitizeForFirestore(rawData);
  const targets: Promise<void>[] = [];

  if (appletDb) {
    targets.push(setDoc(doc(appletDb, collectionName, docId), cleanData, { merge: true }));
  }
  if (db) {
    targets.push(setDoc(doc(db, collectionName, docId), cleanData, { merge: true }));
  }
  if (includeAdminDb && adminDb && adminDb !== db) {
    targets.push(setDoc(doc(adminDb, collectionName, docId), cleanData, { merge: true }));
  }

  const results = await Promise.allSettled(targets);
  const anySucceeded = results.some((r) => r.status === 'fulfilled');
  if (!anySucceeded) {
    const firstRejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    throw firstRejected?.reason || new Error(`Failed to write to ${collectionName}/${docId}`);
  }
}

async function deleteDocFromAllDbs(collectionName: string, docId: string): Promise<void> {
  const targets: Promise<void>[] = [];
  if (appletDb) targets.push(deleteDoc(doc(appletDb, collectionName, docId)));
  if (db) targets.push(deleteDoc(doc(db, collectionName, docId)));
  if (adminDb && adminDb !== db) targets.push(deleteDoc(doc(adminDb, collectionName, docId)));
  await Promise.allSettled(targets);
}

function toTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  return 0;
}

/**
 * Merges a document from multiple Firestore projects without letting a lagging external DB
 * overwrite a newer update or revert an admin-approved 'published' doc back to 'pending_approval'.
 */
function mergeStatusDoc<T extends { status?: string; updatedAt?: any; createdAt?: any; _deleted?: boolean }>(
  existing: T | undefined,
  incoming: T,
  sourcePriority: 'applet' | 'secondary' = 'secondary'
): T {
  if (!existing) return incoming;
  if (incoming._deleted) return incoming;
  if (existing._deleted) return existing;

  const exTime = Math.max(toTimestampMs(existing.updatedAt), toTimestampMs(existing.createdAt));
  const inTime = Math.max(toTimestampMs(incoming.updatedAt), toTimestampMs(incoming.createdAt));

  // If existing is already published and incoming has stale pending_approval from an un-updated external DB, keep published
  if (existing.status === 'published' && incoming.status === 'pending_approval' && inTime <= exTime) {
    return {
      ...incoming,
      ...existing,
      status: 'published',
    };
  }
  if (incoming.status === 'published' && existing.status === 'pending_approval' && inTime >= exTime) {
    return {
      ...existing,
      ...incoming,
      status: 'published',
    };
  }
  if (inTime > exTime) return incoming;
  if (exTime > inTime) return existing;
  return sourcePriority === 'applet' ? incoming : existing;
}

export interface UserCompletedRecord {
  classId: string;
  title: string;
  modality?: string;
  cpdCredits?: string;
  completedAt: string;
}

/**
 * Maps course/category string to standardized clinical modality
 */
export function mapCourseToModality(courseName?: string): ClinicalModality {
  if (!courseName) return 'xray';
  const lower = courseName.toLowerCase();
  if (lower.includes('ct') || lower === 'computed tomography') return 'ct';
  if (lower.includes('mri') || lower === 'magnetic resonance') return 'mri';
  if (lower.includes('ultrasound') || lower.includes('sono') || lower.includes('dvt') || lower.includes('fast')) return 'ultrasound';
  if (lower.includes('anatomy') || lower.includes('skeleton')) return 'anatomy';
  if (lower.includes('physic') || lower.includes('equipment') || lower.includes('drl') || lower.includes('tech')) return 'rad_physics';
  if (lower.includes('care') || lower.includes('practice') || lower.includes('hospital') || lower.includes('physiology')) return 'hospital_practice';
  return 'xray';
}

/**
 * Helper to parse opportunity doc snapshots from either adminDb or db
 * supporting both the web app schema (AdminPostOpportunity) and the mobile app schema
 */
function parseOpportunityDoc(docSnap: any, sourceCollection: string): Opportunity {
  const data = docSnap.data();
  const rawType = data.opportunityType || (sourceCollection === 'internships' ? 'Internship' : sourceCollection === 'scholarships' ? 'Scholarship' : data.type || 'NHS Locum');
  
  let formattedType = 'NHS Locum';
  if (rawType.toLowerCase().includes('intern')) formattedType = 'Internship';
  else if (rawType.toLowerCase().includes('scholar')) formattedType = 'Scholarship';
  else if (rawType.toLowerCase().includes('perm')) formattedType = 'Permanent';
  else if (rawType.toLowerCase().includes('locum')) formattedType = 'NHS Locum';
  else formattedType = data.type || 'Full-time';

  return {
    id: docSnap.id,
    title: data.title || 'Radiography Professional',
    organisation: data.organization || data.organisation || 'Healthcare Organisation',
    location: data.location || 'United Kingdom',
    type: formattedType,
    rate: data.salaryOrAmount || data.rate || 'Competitive Rate',
    specialty: data.specialty || data.course || data.title || '',
    deadline: data.deadline || 'Ongoing',
    experienceLevel: data.experienceLevel || data.duration || 'Post-Qualification',
    urgent: !!data.urgent || (formattedType === 'NHS Locum'),
    description: data.description || '',
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    howToApply: data.link || data.contactInfo || data.howToApply || 'Apply via StudiRad portal',
    modality: mapCourseToModality(data.specialty || data.title || data.course),
    link: data.link || '',
    contactInfo: data.contactInfo || '',
    opportunityType: sourceCollection === 'internships' ? 'internship' : sourceCollection === 'scholarships' ? 'scholarship' : 'job',
    sourceCollection,
  };
}

/**
 * Real-time listener for opportunities
 * Synchronized simultaneously with web app collections (jobs, internships, scholarships in adminDb and db)
 */
export function subscribeOpportunities(
  onUpdate: (opportunities: Opportunity[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const oppsMap = new Map<string, Opportunity>();

  const emit = () => {
    const list = Array.from(oppsMap.values());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];

  // 1. Listen to 'jobs' in adminDb (from web app AdminPostOpportunity)
  try {
    const jobsRef = collection(adminDb, 'jobs');
    const u1 = onSnapshot(jobsRef, (snap) => {
      for (const [k, v] of oppsMap.entries()) {
        if (v.sourceCollection === 'jobs_admin') oppsMap.delete(k);
      }
      snap.docs.forEach((d) => {
        oppsMap.set(`job_admin_${d.id}`, parseOpportunityDoc(d, 'jobs_admin'));
      });
      emit();
    }, (err) => console.warn('adminDb jobs notice:', err));
    unsubs.push(u1);
  } catch (e) {
    console.warn('Jobs listener error:', e);
  }

  // 2. Listen to 'internships' in adminDb (from web app AdminPostOpportunity)
  try {
    const internRef = collection(adminDb, 'internships');
    const u2 = onSnapshot(internRef, (snap) => {
      for (const [k, v] of oppsMap.entries()) {
        if (v.sourceCollection === 'internships_admin') oppsMap.delete(k);
      }
      snap.docs.forEach((d) => {
        oppsMap.set(`intern_admin_${d.id}`, parseOpportunityDoc(d, 'internships_admin'));
      });
      emit();
    }, (err) => console.warn('adminDb internships notice:', err));
    unsubs.push(u2);
  } catch (e) {
    console.warn('Internships listener error:', e);
  }

  // 3. Listen to 'scholarships' in adminDb (from web app AdminPostOpportunity)
  try {
    const scholarRef = collection(adminDb, 'scholarships');
    const u3 = onSnapshot(scholarRef, (snap) => {
      for (const [k, v] of oppsMap.entries()) {
        if (v.sourceCollection === 'scholarships_admin') oppsMap.delete(k);
      }
      snap.docs.forEach((d) => {
        oppsMap.set(`scholar_admin_${d.id}`, parseOpportunityDoc(d, 'scholarships_admin'));
      });
      emit();
    }, (err) => console.warn('adminDb scholarships notice:', err));
    unsubs.push(u3);
  } catch (e) {
    console.warn('Scholarships listener error:', e);
  }

  // 4. Also listen to 'jobs' in db (studirad-platform-new)
  try {
    const dbJobsRef = collection(db, 'jobs');
    const u4 = onSnapshot(dbJobsRef, (snap) => {
      for (const [k, v] of oppsMap.entries()) {
        if (v.sourceCollection === 'jobs_client') oppsMap.delete(k);
      }
      snap.docs.forEach((d) => {
        oppsMap.set(`job_client_${d.id}`, parseOpportunityDoc(d, 'jobs_client'));
      });
      emit();
    }, (err) => console.warn('db jobs notice:', err));
    unsubs.push(u4);
  } catch (e) {
    console.warn('DB Jobs listener error:', e);
  }

  // 5. Also listen to 'opportunities' in db (studirad-platform-new) with silent fallback
  try {
    const dbOppsRef = collection(db, 'opportunities');
    const u5 = onSnapshot(dbOppsRef, (snap) => {
      for (const [k, v] of oppsMap.entries()) {
        if (v.sourceCollection === 'opportunities') oppsMap.delete(k);
      }
      snap.docs.forEach((d) => {
        oppsMap.set(`opp_${d.id}`, parseOpportunityDoc(d, 'opportunities'));
      });
      emit();
    }, (err: any) => {
      // Suppress permissions notice if external project rules restrict access
      if (err?.code === 'permission-denied') return;
      console.warn('db opportunities notice:', err);
    });
    unsubs.push(u5);
  } catch (e) {
    console.warn('DB Opportunities listener error:', e);
  }

  // 6. Listen to 'opportunities' in appletDb (ai-studio-studiradmobileap-6f5d2912-b23e-4c44-828e-081071b478b2)
  try {
    const appletOppsRef = collection(appletDb, 'opportunities');
    const u6 = onSnapshot(appletOppsRef, (snap) => {
      for (const [k, v] of oppsMap.entries()) {
        if (v.sourceCollection === 'opportunities_applet') oppsMap.delete(k);
      }
      snap.docs.forEach((d) => {
        oppsMap.set(`opp_applet_${d.id}`, parseOpportunityDoc(d, 'opportunities_applet'));
      });
      emit();
    }, () => {});
    unsubs.push(u6);
  } catch (_) {}

  return () => {
    unsubs.forEach((u) => u());
  };
}

// =========================================================================
// Official Classes: Completed Cohorts & Coming Soon Masterclasses
// Provided by StudiRad faculty & synchronized directly to Firestore
// =========================================================================
export const ACTIVE_CLASSES: LiveClass[] = [];
export const COMING_SOON_CLASSES: LiveClass[] = [];
export const OFFICIAL_CLASSES: LiveClass[] = [];

const SEEDED_DUMMY_CLASS_IDS = new Set([
  'live_pediatric_nai',
  'live_ct_contrast_emergency',
  'live_mri_safety_implants',
  'live_ultrasound_dvt',
  'live_anatomy_cspine',
  'live_rad_physics_drl',
  'live_hospital_chaperone',
]);

/**
 * Real-time listener for classes (upcoming, coming-soon, and completed cohorts)
 * Synchronized across appletDb, db (studirad-platform-new), and adminDb (studirad-admin-portal)
 * while excluding legacy mock placeholders and deleted docs.
 */
export function subscribeClasses(
  onUpdate: (classes: LiveClass[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const classesMap = new Map<string, LiveClass & { updatedAt?: any; createdAt?: any; _deleted?: boolean }>();

  const emit = () => {
    const list = Array.from(classesMap.values()).filter((cls) => !cls._deleted);
    onUpdate(list);
  };

  const parseClassDoc = (docSnap: any): LiveClass & { updatedAt?: any; createdAt?: any; _deleted?: boolean } => {
    const data = docSnap.data() || {};
    const rawCategory = data.category || data.modality || 'X-ray';
    const rawStatus = String(data.status || '').toLowerCase().trim();
    const rawCohortStatus = String(data.cohortStatus || '').toLowerCase().trim();
    const isCompleted =
      rawStatus === 'completed' ||
      rawStatus === 'past' ||
      rawStatus === 'ended' ||
      rawStatus === 'archived' ||
      rawCohortStatus === 'completed' ||
      rawCohortStatus === 'past' ||
      rawCohortStatus === 'ended' ||
      data.completed === true ||
      data.isCompleted === true;
    const isComingSoon =
      !isCompleted &&
      (rawStatus === 'coming-soon' ||
        rawStatus === 'coming_soon' ||
        rawCohortStatus === 'coming-soon' ||
        rawCohortStatus === 'coming_soon');

    return {
      id: docSnap.id,
      title: data.title || '',
      instructor: data.instructor || 'StudiRad Faculty',
      instructorRole: data.instructorRole || 'Lead Radiography Specialist',
      date: data.date || data.duration || '',
      time: data.time || '',
      duration: data.duration || 'Session',
      isLiveNow: !!data.isLiveNow,
      isRegistered: false,
      cpdCredits: data.cpdCredits || '',
      description: data.description || '',
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      relatedMaterials: Array.isArray(data.relatedMaterials) ? data.relatedMaterials : [],
      meetingLink: data.meetingLink || data.registrationLink || '',
      registerLink: data.registerLink || data.registrationLink || data.link || data.meetingLink || '',
      registrationLink: data.registrationLink || data.registerLink || '',
      category: rawCategory,
      modality: mapCourseToModality(rawCategory),
      image: data.thumbnail || data.image || '',
      thumbnail: data.thumbnail || data.image || '',
      price: data.price !== undefined ? (data.price || 'FREE') : 'FREE',
      isPaid: !!data.isPaid,
      level: data.level || 'All Levels',
      venue: data.venue || 'StudiRad Classroom',
      hasCustomRegistration: !!data.hasCustomRegistration,
      customConfirmationMessage: data.customConfirmationMessage || '',
      features: Array.isArray(data.features) ? data.features : [],
      technologies: Array.isArray(data.technologies) ? data.technologies : [],
      status: isCompleted ? 'completed' : isComingSoon ? 'coming-soon' : (data.status || 'published'),
      cohortStatus: isCompleted ? 'completed' : isComingSoon ? 'coming-soon' : 'upcoming',
      whatYouWillLearn: Array.isArray(data.whatYouWillLearn) ? data.whatYouWillLearn : [],
      rating: typeof data.rating === 'number' ? data.rating : 0,
      reviewsCount: data.reviewsCount || '0',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      _deleted: !!data._deleted,
    };
  };

  const isVisibleClass = (docSnap: any) => {
    if (SEEDED_DUMMY_CLASS_IDS.has(docSnap.id)) return false;
    const data = docSnap.data();
    if (!data || data._deleted) return false;
    const rawStatus = String(data.status || '').toLowerCase().trim();
    const rawCohortStatus = String(data.cohortStatus || '').toLowerCase().trim();
    if ((rawStatus === 'draft' || rawStatus === 'rejected') && rawCohortStatus !== 'completed') {
      return false;
    }
    return true;
  };

  const unsubs: (() => void)[] = [];
  const dbs = [
    { name: 'applet' as const, instance: appletDb },
    { name: 'client' as const, instance: db },
    { name: 'admin' as const, instance: adminDb },
  ].filter((d) => Boolean(d.instance));

  if (dbs.length === 0) {
    onUpdate([]);
    return () => {};
  }

  dbs.forEach(({ name, instance }) => {
    const prio = name === 'applet' ? 'applet' : 'secondary';
    try {
      const collRef = collection(instance, 'classes');
      const unsub = onSnapshot(
        collRef,
        (snapshot) => {
          snapshot.docs.forEach((docSnap) => {
            if (SEEDED_DUMMY_CLASS_IDS.has(docSnap.id)) return;
            const rawData = docSnap.data();
            if (rawData?._deleted) {
              classesMap.set(docSnap.id, {
                ...(classesMap.get(docSnap.id) || parseClassDoc(docSnap)),
                _deleted: true,
                updatedAt: rawData.updatedAt || Date.now(),
              });
              return;
            }
            if (!isVisibleClass(docSnap)) return;
            const parsed = parseClassDoc(docSnap);
            classesMap.set(docSnap.id, mergeStatusDoc(classesMap.get(docSnap.id), parsed, prio));
          });
          emit();
        },
        (error: any) => {
          if (error?.code === 'permission-denied') return;
          console.warn(`${name}Db Classes subscription notice:`, error);
          if (name === 'applet') {
            onError?.(error);
          }
        }
      );
      unsubs.push(unsub);
    } catch (error) {
      console.warn(`Classes subscription error (${name}):`, error);
    }
  });

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Real-time listener for webinars
 */
export function subscribeWebinars(
  onUpdate: (webinars: Webinar[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const collPath = 'webinars';
  try {
    const collRef = collection(db, collPath);
    return onSnapshot(
      collRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
        } else {
          const list: Webinar[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || '',
              speaker: data.speaker || '',
              speakerRole: data.speakerRole || '',
              duration: data.duration || '',
              date: data.date || '',
              views: data.views || '0 views',
              rating: typeof data.rating === 'number' ? data.rating : 0,
              cpdCredits: data.cpdCredits || '',
              description: data.description || '',
              thumbnail: data.thumbnail || '',
              modality: data.modality || 'xray',
            };
          });
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Webinars subscription notice:', error);
        onError?.(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
    return () => {};
  }
}

/**
 * Real-time listener for user completed classes (strictly appletDb)
 */
export function subscribeUserCompletedClasses(
  userId: string,
  onUpdate: (records: UserCompletedRecord[]) => void
): () => void {
  if (!userId || !appletDb) {
    onUpdate([]);
    return () => {};
  }

  try {
    const appletRef = collection(appletDb, 'users', userId, 'completedClasses');
    return onSnapshot(
      appletRef,
      (snapshot) => {
        const list: UserCompletedRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            classId: d.classId || docSnap.id,
            title: d.title || 'Completed Masterclass',
            modality: d.modality || 'General',
            cpdCredits: '',
            completedAt: d.completedAt || new Date().toISOString(),
          };
        });
        onUpdate(list);
      },
      () => onUpdate([])
    );
  } catch (_) {
    onUpdate([]);
    return () => {};
  }
}

/**
 * Record a completed class for the user in Firestore
 */
export async function recordClassCompletionInFirestore(
  userId: string,
  classData: {
    classId: string;
    title: string;
    modality?: string;
    cpdCredits?: string;
  }
): Promise<void> {
  const payload = {
    classId: classData.classId,
    title: classData.title,
    modality: classData.modality || 'xray',
    cpdCredits: '',
    completedAt: new Date().toISOString(),
    userId,
  };

  try {
    if (appletDb) {
      const appletDocRef = doc(appletDb, 'users', userId, 'completedClasses', classData.classId);
      await setDoc(appletDocRef, payload, { merge: true });
    }
  } catch (_) {}
}

/**
 * Real-time listener for per-user registered class IDs (strictly appletDb)
 */
export function subscribeUserRegisteredClasses(
  userId: string,
  onUpdate: (classIds: string[]) => void
): () => void {
  if (!userId || !appletDb) {
    onUpdate([]);
    return () => {};
  }

  try {
    const appletRef = collection(appletDb, 'users', userId, 'registeredClasses');
    return onSnapshot(
      appletRef,
      (snapshot) => {
        onUpdate(snapshot.docs.map((d) => d.id));
      },
      () => onUpdate([])
    );
  } catch (_) {
    onUpdate([]);
    return () => {};
  }
}

/**
 * Persist a user's live class registration in their personal Firestore subcollection
 */
export async function registerUserForClass(
  userId: string,
  liveClass: Pick<LiveClass, 'id' | 'title' | 'meetingLink' | 'registrationLink' | 'registerLink'>
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !liveClass?.id || !appletDb) {
    return { success: false, error: 'Invalid user or class details' };
  }

  const payload = sanitizeForFirestore({
    classId: liveClass.id,
    title: liveClass.title || 'Live Class',
    meetingLink: liveClass.meetingLink || liveClass.registrationLink || liveClass.registerLink || '',
    registeredAt: new Date().toISOString(),
    userId,
  });

  try {
    await setDoc(doc(appletDb, 'users', userId, 'registeredClasses', liveClass.id), payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to register for class' };
  }
}

/**
 * Real-time listener for user's enrolled courses in Firestore
 */
export function subscribeUserEnrolledCourses(
  userId: string,
  onUpdate: (records: EnrolledCourseRecord[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  const unsubs: (() => void)[] = [];
  const enrolledMap = new Map<string, EnrolledCourseRecord>();
  const emit = () => onUpdate(Array.from(enrolledMap.values()));

  try {
    const collRef = collection(appletDb, 'users', userId, 'enrolled_courses');
    const u1 = onSnapshot(collRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        enrolledMap.set(docSnap.id, {
          courseId: d.courseId || docSnap.id,
          title: d.title || 'Enrolled Course',
          instructor: d.instructor || 'StudiRad Faculty',
          image: d.image || '',
          videoUrl: d.videoUrl || '',
          duration: d.duration || '',
          cpdCredits: d.cpdCredits || '',
          modality: d.modality || 'xray',
          progressPercent: typeof d.progressPercent === 'number' ? d.progressPercent : 0,
          completedLessonsCount: d.completedLessonsCount || 0,
          totalLessonsCount: d.totalLessonsCount || 1,
          enrolledAt: d.enrolledAt || new Date().toISOString(),
          lastAccessedAt: d.lastAccessedAt,
        });
      });
      emit();
    }, () => {});
    unsubs.push(u1);
  } catch (_) {}

  // Also listen on db users subcollection silently
  try {
    const dbRef = collection(db, 'users', userId, 'enrolled_courses');
    const u2 = onSnapshot(dbRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (!enrolledMap.has(docSnap.id)) {
          enrolledMap.set(docSnap.id, {
            courseId: d.courseId || docSnap.id,
            title: d.title || 'Enrolled Course',
            instructor: d.instructor || 'StudiRad Faculty',
            image: d.image || '',
            videoUrl: d.videoUrl || '',
            duration: d.duration || '',
            cpdCredits: d.cpdCredits || '',
            modality: d.modality || 'xray',
            progressPercent: typeof d.progressPercent === 'number' ? d.progressPercent : 0,
            completedLessonsCount: d.completedLessonsCount || 0,
            totalLessonsCount: d.totalLessonsCount || 1,
            enrolledAt: d.enrolledAt || new Date().toISOString(),
            lastAccessedAt: d.lastAccessedAt,
          });
        }
      });
      emit();
    }, () => {});
    unsubs.push(u2);
  } catch (_) {}

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Enrolls a user in a course and records it in Firestore
 */
export async function enrollUserInCourse(
  userId: string,
  course: Course
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !course?.id) return { success: false, error: 'Missing userId or course' };

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1;
  const payload = {
    courseId: course.id,
    title: course.title,
    instructor: course.instructor || 'StudiRad Faculty',
    image: course.image || '',
    videoUrl: course.videoUrl || '',
    duration: course.duration || '',
    cpdCredits: course.cpdCredits || '',
    modality: course.modality || 'xray',
    progressPercent: 15, // Initial active enrollment progress
    completedLessonsCount: 0,
    totalLessonsCount: totalLessons,
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  };

  try {
    const appletRef = doc(appletDb, 'users', userId, 'enrolled_courses', course.id);
    await setDoc(appletRef, payload, { merge: true });
    
    // Also record on user doc
    const userDocRef = doc(appletDb, 'users', userId);
    await setDoc(userDocRef, {
      enrolledCourseIds: [course.id]
    }, { merge: true }).catch(() => {});
  } catch (err: any) {
    console.warn('Enroll in appletDb error:', err);
  }

  try {
    const dbRef = doc(db, 'users', userId, 'enrolled_courses', course.id);
    await setDoc(dbRef, payload, { merge: true }).catch(() => {});
  } catch (_) {}

  return { success: true };
}

/**
 * Real-time listener for courses
 * Note: There are currently NO courses published yet; YouTube videos are study materials, NOT courses.
 * If empty, returns [] (zero placeholders).
 */
export function subscribeCourses(
  onUpdate: (courses: Course[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const coursesMap = new Map<string, Course>();

  const emit = () => {
    const list = Array.from(coursesMap.values());
    onUpdate(list);
  };

  const parseCourseDoc = (docSnap: any): Course => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title || '',
      institution: data.institution || 'StudiRad Clinical Academy',
      instructor: data.instructor || 'Clinical Specialist',
      instructorRole: data.instructorRole || 'Clinical Specialist',
      rating: typeof data.rating === 'number' ? data.rating : 0,
      reviewsCount: data.reviewsCount || '0',
      learners: data.learners || '0',
      duration: data.duration || 'Flexible',
      level: data.level || 'All Levels',
      category: data.category || 'general_radiography',
      cpdCredits: data.cpdCredits || '',
      price: data.price || 'Free',
      isFree: data.isFree !== undefined ? !!data.isFree : true,
      overview: data.overview || '',
      learningOutcomes: Array.isArray(data.learningOutcomes) ? data.learningOutcomes : [],
      image: data.image || '',
      videoUrl: data.videoUrl || '',
      modules: Array.isArray(data.modules) ? data.modules : [],
      materials: Array.isArray(data.materials) ? data.materials : [],
      links: Array.isArray(data.links) ? data.links : [],
      quiz: Array.isArray(data.quiz) ? data.quiz : [],
      progressPercent: typeof data.progressPercent === 'number' ? data.progressPercent : 0,
      modality: data.modality || mapCourseToModality(data.course || data.category),
      status: data.status || 'published',
      tutorAvailability: data.tutorAvailability || undefined,
      creatorId: data.creatorId || undefined,
      creatorRole: data.creatorRole || undefined,
      creatorName: data.creatorName || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  };

  const unsubs: (() => void)[] = [];

  // 1. Dedicated courses collection in db (primary external Firestore)
  try {
    const coursesRef = collection(db, 'courses');
    const u1 = onSnapshot(coursesRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const parsed = parseCourseDoc(docSnap);
        coursesMap.set(docSnap.id, mergeStatusDoc(coursesMap.get(docSnap.id), parsed, 'secondary'));
      });
      emit();
    }, (err) => {
      console.warn('Primary courses subscription notice:', err);
      onError?.(err);
    });
    unsubs.push(u1);
  } catch (e) {
    console.warn('Courses listener error:', e);
  }

  // 2. Synchronized courses collection in adminDb if separate
  try {
    if (adminDb && adminDb !== db) {
      const adminCoursesRef = collection(adminDb, 'courses');
      const u2 = onSnapshot(adminCoursesRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const parsed = parseCourseDoc(docSnap);
          coursesMap.set(docSnap.id, mergeStatusDoc(coursesMap.get(docSnap.id), parsed, 'secondary'));
        });
        emit();
      }, (err) => {
        console.warn('Admin courses subscription notice:', err);
      });
      unsubs.push(u2);
    }
  } catch (e) {
    console.warn('Admin courses listener error:', e);
  }

  // 3. Dedicated appletDb courses collection (authoritative AI Studio DB)
  try {
    if (appletDb) {
      const appletCoursesRef = collection(appletDb, 'courses');
      const u3 = onSnapshot(appletCoursesRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const parsed = parseCourseDoc(docSnap);
          coursesMap.set(docSnap.id, mergeStatusDoc(coursesMap.get(docSnap.id), parsed, 'applet'));
        });
        emit();
      }, () => {});
      unsubs.push(u3);
    }
  } catch (_) {}

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Real-time listener for clinical materials & protocols
 * Synchronized with db collections: 'materials' and 'videos' (from web app AdminMaterialsPage)
 */
export function subscribeMaterials(
  onUpdate: (materials: ClinicalResource[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const matsMap = new Map<string, ClinicalResource & { updatedAt?: any; createdAt?: any }>();

  const emit = () => {
    const list = Array.from(matsMap.values());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  const dbs = [
    { name: 'applet' as const, instance: appletDb },
    { name: 'client' as const, instance: db },
    { name: 'admin' as const, instance: adminDb },
  ].filter((d) => Boolean(d.instance));

  const inferFormat = (data: any, resolvedLink: string): string => {
    if (data.format) return data.format;
    const lower = resolvedLink.toLowerCase();
    if (lower.includes('.pdf')) return 'PDF';
    if (lower.includes('.ppt') || lower.includes('docs.google.com/presentation')) return 'Slide Deck';
    if (lower.includes('.doc') || lower.includes('docs.google.com/document')) return 'Document';
    if (lower.includes('.txt') || lower.includes('.md')) return 'Notes';
    return data.type === 'file' || data.type === 'pdf' ? 'PDF' : 'Guideline';
  };

  // 1. Materials across synced dbs
  dbs.forEach(({ name, instance }) => {
    const prio = name === 'applet' ? 'applet' : 'secondary';
    try {
      const matsRef = collection(instance, 'materials');
      const u1 = onSnapshot(matsRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?._deleted) {
            matsMap.delete(`mat_${docSnap.id}`);
            return;
          }
          const resolvedLink = (data.link || data.downloadUrl || data.url || '').trim();
          const parsed: ClinicalResource & { updatedAt?: any; createdAt?: any } = {
            id: docSnap.id,
            title: data.title || 'Clinical Material',
            category: data.course || data.category || 'General Radiography',
            format: inferFormat(data, resolvedLink),
            size: data.size || data.fileSize || '1.8 MB',
            description: data.description || `Clinical material for ${data.course || 'radiography'} uploaded by ${data.uploader || 'StudiRad Faculty'}.`,
            downloadUrl: resolvedLink,
            modality: mapCourseToModality(data.course || data.modality),
            course: data.course,
            uploader: data.uploader,
            link: resolvedLink,
            status: data.status || 'published',
            rating: typeof data.rating === 'number' ? data.rating : 0,
            reviewsCount: data.reviewsCount || '0',
            updatedAt: data.updatedAt,
            createdAt: data.createdAt,
          };
          matsMap.set(`mat_${docSnap.id}`, mergeStatusDoc(matsMap.get(`mat_${docSnap.id}`), parsed, prio));
        });
        emit();
      }, (err) => {
        console.warn('Materials subscription notice:', err);
        onError?.(err);
      });
      unsubs.push(u1);
    } catch (e) {
      console.warn('Materials listener error:', e);
    }

    // 2. Videos across synced dbs
    try {
      const vidsRef = collection(instance, 'videos');
      const u2 = onSnapshot(vidsRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?._deleted) {
            matsMap.delete(`vid_${docSnap.id}`);
            return;
          }
          const resolvedLink = (data.link || data.downloadUrl || data.url || '').trim();
          const parsed: ClinicalResource & { updatedAt?: any; createdAt?: any } = {
            id: docSnap.id,
            title: data.title || 'Recorded Clinical Video',
            category: data.course || 'Educational Video',
            format: 'Video',
            size: 'Stream',
            description: data.description || `Recorded clinical session on ${data.course || 'radiography'} by ${data.uploader || 'StudiRad'}.`,
            downloadUrl: resolvedLink,
            modality: mapCourseToModality(data.course),
            course: data.course,
            uploader: data.uploader,
            link: resolvedLink,
            status: data.status || 'published',
            rating: typeof data.rating === 'number' ? data.rating : 0,
            reviewsCount: data.reviewsCount || '0',
            updatedAt: data.updatedAt,
            createdAt: data.createdAt,
          };
          matsMap.set(`vid_${docSnap.id}`, mergeStatusDoc(matsMap.get(`vid_${docSnap.id}`), parsed, prio));
        });
        emit();
      }, (err) => console.warn('Videos as materials notice:', err));
      unsubs.push(u2);
    } catch (e) {
      console.warn('Videos as materials listener error:', e);
    }
  });

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Real-time listener for study materials (Reading Materials & Video Lectures)
 * Directly synchronized with 'materials' and 'videos' collections across synced Firestore DBs
 */
export function subscribeStudyMaterials(
  onUpdate: (materials: StudyMaterial[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const matsMap = new Map<string, StudyMaterial>();

  const emit = () => {
    const list = Array.from(matsMap.values());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  const dbs = [
    { name: 'applet', instance: appletDb },
    { name: 'client', instance: db },
    { name: 'admin', instance: adminDb },
  ].filter((d) => Boolean(d.instance));

  const inferStudyType = (data: any, resolvedLink: string): StudyMaterial['type'] => {
    const lower = resolvedLink.toLowerCase();
    const isDirectVid =
      data.type === 'video' ||
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('docs.google.com/videos/') ||
      /\.(mp4|webm|ogg|mov)($|\?)/i.test(lower) ||
      lower.includes('/video/upload/');
    if (isDirectVid) return 'video';
    if (data.type === 'pdf' || lower.includes('.pdf')) return 'pdf';
    if (data.type === 'document' || data.type === 'file') return 'document';
    if (data.type === 'link') return 'link';
    return 'pdf';
  };

  dbs.forEach(({ name, instance }) => {
    const prio = name === 'applet' ? 'applet' : 'secondary';
    try {
      const matsRef = collection(instance, 'materials');
      const u1 = onSnapshot(matsRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?._deleted) {
            matsMap.delete(`mat_${docSnap.id}`);
            return;
          }
          const resolvedLink = (data.link || data.downloadUrl || data.url || '').trim();
          const parsed: StudyMaterial & { updatedAt?: any } = {
            id: docSnap.id,
            title: data.title || 'Study Material',
            course: data.course || data.category || 'Others',
            uploader: data.uploader || 'StudiRad Faculty',
            link: resolvedLink,
            type: inferStudyType(data, resolvedLink),
            fileSize: data.size || data.fileSize,
            thumbnailUrl: data.thumbnailUrl,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            description: data.description,
            status: data.status || 'published',
            rating: typeof data.rating === 'number' ? data.rating : 0,
            reviewsCount: data.reviewsCount || '0',
          };
          matsMap.set(`mat_${docSnap.id}`, mergeStatusDoc(matsMap.get(`mat_${docSnap.id}`) as any, parsed as any, prio));
        });
        emit();
      }, (err) => {
        console.warn('Study materials subscription notice:', err);
        onError?.(err);
      });
      unsubs.push(u1);
    } catch (e) {
      console.warn('Materials listener error:', e);
    }

    try {
      const vidsRef = collection(instance, 'videos');
      const u2 = onSnapshot(vidsRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?._deleted) {
            matsMap.delete(`vid_${docSnap.id}`);
            return;
          }
          const resolvedLink = (data.link || data.downloadUrl || data.url || '').trim();
          const parsed: StudyMaterial & { updatedAt?: any } = {
            id: docSnap.id,
            title: data.title || 'Clinical Video Lecture',
            course: data.course || data.category || 'Others',
            uploader: data.uploader || 'StudiRad Faculty',
            link: resolvedLink,
            type: 'video',
            thumbnailUrl: data.thumbnailUrl,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            description: data.description || 'Recorded clinical session',
            status: data.status || 'published',
            rating: typeof data.rating === 'number' ? data.rating : 0,
            reviewsCount: data.reviewsCount || '0',
          };
          matsMap.set(`vid_${docSnap.id}`, mergeStatusDoc(matsMap.get(`vid_${docSnap.id}`) as any, parsed as any, prio));
        });
        emit();
      }, (err) => console.warn('Videos as materials notice:', err));
      unsubs.push(u2);
    } catch (e) {
      console.warn('Videos listener error:', e);
    }
  });

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Admin: Push or update a course in Firestore (studirad-platform-new)
 */
export async function pushCourseToFirestore(
  courseData: Partial<Course>
): Promise<{ success: boolean; id: string; error?: string }> {
  const courseId = courseData.id || `course_${Date.now()}`;
  const path = `courses/${courseId}`;
  try {
    const ytThumb = courseData.videoUrl ? getYouTubeThumbnail(courseData.videoUrl) : null;
    const resolvedImage = ytThumb || courseData.image || '';

    const payload = sanitizeForFirestore({
      ...courseData,
      id: courseId,
      image: resolvedImage,
      videoUrl: courseData.videoUrl || '',
      modules: Array.isArray(courseData.modules) ? courseData.modules : [],
      materials: Array.isArray(courseData.materials) ? courseData.materials : [],
      links: Array.isArray(courseData.links) ? courseData.links : [],
      quiz: Array.isArray(courseData.quiz) ? courseData.quiz : [],
      updatedAt: new Date().toISOString(),
      createdAt: courseData.createdAt || new Date().toISOString(),
    });

    await writeDocToAllDbs('courses', courseId, payload, true);

    return { success: true, id: courseId };
  } catch (error: any) {
    console.error('Error pushing course to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, id: courseId, error: error?.message || 'Failed to push course' };
  }
}

/**
 * Admin: Delete a course from Firestore across all databases
 */
export async function deleteCourseFromFirestore(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDocFromAllDbs('courses', courseId);
    try {
      await deleteDoc(doc(db, 'videos', courseId));
    } catch (_) {}

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return { success: false, error: error?.message || 'Failed to delete course' };
  }
}

/**
 * Admin: Push or update a live class in Firestore across synced projects
 */
export async function pushClassToFirestore(
  classData: Partial<LiveClass>
): Promise<{ success: boolean; id: string; error?: string }> {
  const classId = classData.id || `live_${Date.now()}`;
  const payload = sanitizeForFirestore({
    ...classData,
    ...(classData.time ? { time: formatTime12h(classData.time) } : {}),
    id: classId,
    updatedAt: new Date().toISOString(),
    createdAt: classData.createdAt || new Date().toISOString(),
  });

  try {
    await writeDocToAllDbs('classes', classId, payload, true);
    return { success: true, id: classId };
  } catch (error: any) {
    console.warn('Error pushing class:', error);
    return { success: false, id: classId, error: error?.message || 'Failed to save class' };
  }
}

/**
 * Admin: Delete a live class from Firestore
 */
export async function deleteClassFromFirestore(
  classId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDocFromAllDbs('classes', classId);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return { success: false, error: error?.message || 'Failed to delete class' };
  }
}

/**
 * Admin: Push or update a clinical material in Firestore (studirad-platform-new)
 * Matching the exact fields of the web app AdminMaterialsPage
 */
export async function pushMaterialToFirestore(
  materialData: Partial<ClinicalResource>
): Promise<{ success: boolean; id: string; error?: string }> {
  const materialId = materialData.id || `mat_${Date.now()}`;
  const path = `materials/${materialId}`;
  
  const linkUrl = materialData.downloadUrl || materialData.link || '';
  const inferredType =
    materialData.format === 'PDF' || linkUrl.toLowerCase().includes('.pdf')
      ? 'pdf'
      : materialData.format === 'Checklist' || materialData.format === 'Slide Deck'
      ? 'document'
      : 'link';

  const payload = sanitizeForFirestore({
    course: materialData.course || materialData.category || 'General Radiography',
    title: materialData.title || '',
    uploader: materialData.uploader || 'StudiRad Faculty',
    link: linkUrl,
    format: materialData.format || (inferredType === 'pdf' ? 'PDF' : 'Guideline'),
    type: inferredType,
    size: materialData.size || '1.8 MB',
    modality: materialData.modality || 'xray',
    description: materialData.description || '',
    createdAt: new Date(),
  });

  try {
    await writeDocToAllDbs('materials', materialId, payload, false);
    return { success: true, id: materialId };
  } catch (error: any) {
    console.error('Error pushing material to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, id: materialId, error: error?.message || 'Failed to push material' };
  }
}

/**
 * Admin: Push or update a video resource in Firestore
 */
export async function pushVideoToFirestore(videoData: {
  course: string;
  title: string;
  uploader: string;
  link: string;
  thumbnailUrl?: string;
}): Promise<{ success: boolean; id: string; error?: string }> {
  const videoId = `vid_${Date.now()}`;
  const payload = sanitizeForFirestore({
    course: videoData.course || 'General Radiography',
    title: videoData.title || '',
    uploader: videoData.uploader || 'StudiRad Faculty',
    link: videoData.link || '',
    thumbnailUrl: videoData.thumbnailUrl || '',
    createdAt: new Date(),
  });

  try {
    await writeDocToAllDbs('videos', videoId, payload, false);
    return { success: true, id: videoId };
  } catch (error: any) {
    console.error('Error pushing video to Firestore:', error);
    return { success: false, id: videoId, error: error?.message || 'Failed to push video' };
  }
}

/**
 * Admin: Approve pending video or study material across all synced databases
 */
export async function approveMaterialOrVideoByAdmin(
  itemId: string,
  isVideo: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const collName = isVideo ? 'videos' : 'materials';
    await writeDocToAllDbs(collName, itemId, { status: 'published', updatedAt: nowIso }, true);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to approve content' };
  }
}

/**
 * Admin: Delete a clinical material or video from Firestore
 */
export async function deleteMaterialFromFirestore(
  materialId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDocFromAllDbs('materials', materialId);
    await deleteDocFromAllDbs('videos', materialId);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return { success: false, error: error?.message || 'Failed to delete material' };
  }
}

/**
 * Admin: Push or update an opportunity in Firestore
 * Synchronized with both adminDb ('jobs', 'internships', 'scholarships')
 * and db ('jobs', 'opportunities') matching the web app AdminPostOpportunity
 */
export async function pushOpportunityToFirestore(
  oppData: Partial<Opportunity>
): Promise<{ success: boolean; id: string | number; error?: string }> {
  const oppId = String(oppData.id || `opp_${Date.now()}`);
  
  const targetColl = oppData.type === 'Internship' || oppData.opportunityType === 'internship'
    ? 'internships'
    : oppData.type === 'Scholarship' || oppData.opportunityType === 'scholarship'
    ? 'scholarships'
    : 'jobs';

  const payload = {
    title: oppData.title || '',
    organization: oppData.organisation || 'Healthcare Organisation',
    location: oppData.location || 'United Kingdom',
    description: oppData.description || '',
    deadline: oppData.deadline || '',
    contactInfo: oppData.contactInfo || oppData.howToApply || '',
    link: oppData.link || oppData.howToApply || '',
    salaryOrAmount: oppData.rate || '',
    type: oppData.type || 'Full-time',
    duration: oppData.experienceLevel || '',
    requirements: Array.isArray(oppData.requirements) ? oppData.requirements : [],
    opportunityType: targetColl === 'internships' ? 'internship' : targetColl === 'scholarships' ? 'scholarship' : 'job',
    postedAt: new Date().toISOString(),
    createdAt: new Date(),
    urgent: !!oppData.urgent,
  };

  try {
    // 1. Write to adminDb (studirad-admin-portal) so the web app's AdminPostOpportunity sees it immediately!
    await setDoc(doc(adminDb, targetColl, oppId), payload, { merge: true });
  } catch (e) {
    console.warn('adminDb push notice:', e);
  }

  try {
    // 2. Also write to db (studirad-platform-new)
    await setDoc(doc(db, targetColl, oppId), payload, { merge: true });
    await setDoc(doc(db, 'opportunities', oppId), { ...payload, id: oppId, organisation: payload.organization }, { merge: true });
  } catch (e) {
    console.warn('db push notice:', e);
  }

  return { success: true, id: oppId };
}

/**
 * Admin: Delete an opportunity from Firestore across all synced collections
 */
export async function deleteOpportunityFromFirestore(
  oppId: number | string,
  sourceColl?: string
): Promise<{ success: boolean; error?: string }> {
  const idStr = String(oppId);
  const collectionsToCheck = sourceColl ? [sourceColl] : ['jobs', 'internships', 'scholarships', 'opportunities'];
  
  for (const coll of collectionsToCheck) {
    try {
      await deleteDoc(doc(adminDb, coll, idStr)).catch(() => {});
      await deleteDoc(doc(db, coll, idStr)).catch(() => {});
    } catch {}
  }
  return { success: true };
}

/**
 * Synchronizes the official list of completed cohorts and upcoming classes to Firestore
 * in both db (studirad-platform-new) and adminDb (studirad-admin-portal)
 */
export async function pushOfficialClassesToFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
  return { success: true, count: 0 };
}

export async function seedFirestoreIfEmpty(): Promise<void> {
  // No-op: Live classes and cohorts are populated strictly from real Admin & Instructor entries.
}

/**
export interface UserIdentityFilter {
  userId?: string;
  email?: string;
  fullName?: string;
  isInstructor?: boolean;
}

function matchesUserRecord(
  filter: UserIdentityFilter,
  ...candidates: Array<string | undefined | null>
): boolean {
  const uid = filter.userId?.trim();
  const em = filter.email?.trim().toLowerCase();
  if (!uid && !em) return false;

  return candidates.some((val) => {
    if (!val) return false;
    const str = String(val).trim();
    if (uid && str === uid) return true;
    if (em && str.toLowerCase() === em) return true;
    return false;
  });
}

/**
 * Persist non-research requests (e.g., general service or custom private class requests) into Firestore 'requests'
 */
export async function pushGeneralRequestToFirestore(
  requestDoc: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const id = requestDoc.id || `req_${Date.now()}`;
    await writeDocToAllDbs('requests', id, { ...requestDoc, id }, true);
    return { success: true };
  } catch (err: any) {
    console.warn('Could not persist general request to Firestore:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Remove / soft-delete a user request across collections
 */
export async function deleteUserRequestFromFirestore(
  requestId: string
): Promise<void> {
  try {
    await Promise.allSettled([
      deleteDocFromAllDbs('requests', requestId),
      writeDocToAllDbs('private_class_requests', requestId, { _deleted: true }, true),
      writeDocToAllDbs('tutorial_requests', requestId, { _deleted: true }, true),
    ]);
  } catch {}
}

/**
 * Real-time listener for user requests (research assistance, tutoring, etc.)
 * Accepts userId + email so all submitted requests match reliably across collections.
 */
export function subscribeUserRequests(
  identity: string | UserIdentityFilter,
  onUpdate: (requests: any[]) => void
): () => void {
  const filter: UserIdentityFilter =
    typeof identity === 'string'
      ? identity.includes('@')
        ? { email: identity }
        : { userId: identity }
      : identity || {};

  const reqMap = new Map<string, any>();
  const tutMap = new Map<string, any>();
  const privMap = new Map<string, any>();

  const emitCombined = () => {
    const combined = [
      ...Array.from(reqMap.values()),
      ...Array.from(tutMap.values()),
      ...Array.from(privMap.values()),
    ].filter((r) => !r?._deleted);
    combined.sort(
      (a, b) =>
        new Date(b.submittedAt || b.createdAt || 0).getTime() -
        new Date(a.submittedAt || a.createdAt || 0).getTime()
    );
    onUpdate(combined);
  };

  const unsubs: (() => void)[] = [];
  const databases = [appletDb, db].filter(Boolean);

  for (const targetDb of databases) {
    try {
      const u1 = onSnapshot(
        collection(targetDb, 'requests'),
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            if (docSnap.id === '_rep_routing') return;
            const data = docSnap.data();
            if (data?._deleted) {
              reqMap.delete(docSnap.id);
              return;
            }
            if (matchesUserRecord(filter, data.userId, data.userEmail, data.studentId, data.studentEmail)) {
              reqMap.set(docSnap.id, {
                id: docSnap.id,
                ...data,
              });
            }
          });
          emitCombined();
        },
        () => {}
      );
      unsubs.push(u1);
    } catch {}

    try {
      const u2 = onSnapshot(
        collection(targetDb, 'tutorial_requests'),
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data?._deleted) {
              tutMap.delete(docSnap.id);
              return;
            }
            if (matchesUserRecord(filter, data.studentId, data.studentEmail, data.userId, data.userEmail)) {
              const formattedSlot = formatTime12h(data.selectedTimeSlot);
              tutMap.set(docSnap.id, {
                id: docSnap.id,
                referenceCode: data.referenceCode || `SR-TUT-${docSnap.id.slice(-5)}`,
                category: 'private_class',
                userId: data.studentId || data.userId,
                userEmail: data.studentEmail || data.userEmail,
                userName: data.studentName || data.userName,
                status: data.status === 'confirmed' ? 'Scheduled' : data.status === 'completed' ? 'Completed' : 'Under Review',
                statusNotes:
                  data.adminFeedback ||
                  (data.status === 'confirmed'
                    ? `Confirmed with ${data.instructorName}. Room: ${data.meetingLink || 'Ready'}`
                    : 'Pending admin coordination. We will get back to you within 24–48 hours.'),
                submittedAt: data.createdAt || new Date().toISOString(),
                subjectTopic: `${data.courseTitle || 'Private Tutorial'} (${data.durationMinutes || 30} mins)`,
                learningObjectives: `Scheduled session with ${data.instructorName} on ${data.selectedDay} at ${formattedSlot}. Rate: ${data.currency} ${data.calculatedRate}.`,
                preferredTimes: `${data.selectedDay} - ${formattedSlot}`,
                ...data,
                selectedTimeSlot: formattedSlot,
              });
            }
          });
          emitCombined();
        },
        () => {}
      );
      unsubs.push(u2);
    } catch {}

    try {
      const u3 = onSnapshot(
        collection(targetDb, 'private_class_requests'),
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data?._deleted) {
              privMap.delete(docSnap.id);
              return;
            }
            if (matchesUserRecord(filter, data.studentId, data.studentEmail, data.userId, data.userEmail)) {
              const formattedSlot = formatTime12h(data.selectedTimeSlot);
              privMap.set(docSnap.id, {
                id: docSnap.id,
                referenceCode: data.referenceCode || `SR-CLS-${docSnap.id.slice(-5)}`,
                category: 'private_class',
                userId: data.studentId,
                userEmail: data.studentEmail,
                userName: data.studentName,
                status: data.status || 'New Request',
                statusNotes:
                  data.adminFeedback ||
                  (data.meetingLink
                    ? `Confirmed with ${data.instructorName}. Room: ${data.meetingLink}`
                    : 'Request received. Our admin team will notify your instructor and get back to you within 24–48 hours.'),
                submittedAt: data.createdAt || new Date().toISOString(),
                subjectTopic: `${data.classTitle} (${data.planType === 'monthly' ? 'Monthly Subscription' : `${data.selectedDays?.length || 1} Day(s)/Week`})`,
                currentKnowledgeLevel: data.classLevel || 'All Levels',
                learningObjectives: `Instructor: ${data.instructorName} · Schedule: ${(data.selectedDays || []).join(', ')} (${formattedSlot}) · Starts ${data.startDate}. ${data.notes ? `Notes: ${data.notes}` : ''}`.trim(),
                preferredFormat: 'Online 1-on-1',
                preferredSchedule: `${(data.selectedDays || []).join(', ')} · ${formattedSlot}`,
                ...data,
                selectedTimeSlot: formattedSlot,
              });
            }
          });
          emitCombined();
        },
        () => {}
      );
      unsubs.push(u3);
    } catch {}
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Real-time listener for all requests for admin dashboard
 */
export function subscribeAllRequests(
  onUpdate: (requests: any[]) => void
): () => void {
  const allMap = new Map<string, any>();
  const emit = () => {
    const all = Array.from(allMap.values());
    all.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
    onUpdate(all);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db, adminDb].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'requests'),
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            if (docSnap.id === '_rep_routing') return;
            allMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}

/**
 * Select a research representative dynamically based on live traffic counts in Firestore,
 * falling back to balanced round-robin alternation on ties or offline states.
 */
export async function selectRepresentativeByTraffic(): Promise<RepresentativeInfo> {
  const rep1 = RESEARCH_REPRESENTATIVES[0];
  const rep2 = RESEARCH_REPRESENTATIVES[1];
  const storageKey = 'studirad_rep_rr_index';

  const getLocalTieBreak = (): RepresentativeInfo => {
    try {
      const prev = Number(localStorage.getItem(storageKey) || '0');
      const next = prev % 2 === 0 ? 1 : 0;
      localStorage.setItem(storageKey, String(next));
      return RESEARCH_REPRESENTATIVES[next];
    } catch {
      return Date.now() % 2 === 0 ? rep1 : rep2;
    }
  };

  try {
    const snaps = await Promise.allSettled([
      appletDb ? getDocs(collection(appletDb, 'requests')) : Promise.reject('no appletDb'),
      db ? getDocs(collection(db, 'requests')) : Promise.reject('no db'),
    ]);

    const mergedDocs = new Map<string, any>();
    for (const res of snaps) {
      if (res.status === 'fulfilled') {
        res.value.forEach((docSnap) => {
          mergedDocs.set(docSnap.id, docSnap.data());
        });
      }
    }

    if (mergedDocs.size === 0) {
      return getLocalTieBreak();
    }

    let rep1Count = 0;
    let rep2Count = 0;
    let lastAssignedId: string | undefined;

    mergedDocs.forEach((data, docId) => {
      if (docId === '_rep_routing') {
        lastAssignedId = data?.lastAssignedId;
        return;
      }
      if (data?.category !== 'research') return;

      const phone = data.assignedRepPhone || data.assignedRepresentative?.displayPhone || '';
      if (phone === rep1.displayPhone) rep1Count++;
      else if (phone === rep2.displayPhone) rep2Count++;
    });

    let chosen: RepresentativeInfo;
    if (rep1Count < rep2Count) {
      chosen = rep1;
    } else if (rep2Count < rep1Count) {
      chosen = rep2;
    } else {
      chosen = lastAssignedId === rep1.id ? rep2 : rep1;
    }

    writeDocToAllDbs(
      'requests',
      '_rep_routing',
      {
        lastAssignedId: chosen.id,
        lastAssignedPhone: chosen.displayPhone,
        rep1Count: rep1Count + (chosen.id === rep1.id ? 1 : 0),
        rep2Count: rep2Count + (chosen.id === rep2.id ? 1 : 0),
        updatedAt: new Date().toISOString(),
      },
      true
    ).catch(() => {});

    return chosen;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'requests');
    return getLocalTieBreak();
  }
}

/**
 * Push a new research request to Firestore and create an admin notification
 */
export async function pushResearchRequestToFirestore(requestData: {
  userName: string;
  userEmail: string;
  userId?: string;
  researchTitle: string;
  discipline: string;
  assistanceType: string;
  currentStage: string;
  customStage?: string;
  supportDetails?: string;
  deadline: string;
  methodologyNotes?: string;
  academicLevel?: string;
  serviceCategory?: string;
  selectedServices?: string[];
  priceDisplay?: string;
  othersDescription?: string;
  whatsappMessage?: string;
  assignedRepresentative?: RepresentativeInfo;
}): Promise<{
  success: boolean;
  id?: string;
  referenceCode: string;
  assignedRepresentative?: RepresentativeInfo;
  submittedAt?: string;
  error?: string;
}> {
  try {
    const chosenRep = requestData.assignedRepresentative || (await selectRepresentativeByTraffic());
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const referenceCode = `SR-RES-${randomNum}`;
    const reqId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const submittedAt = new Date().toISOString();

    const payload = sanitizeForFirestore({
      ...requestData,
      id: reqId,
      referenceCode,
      category: 'research',
      status: 'New Request',
      statusNotes: `Request logged and routed to ${chosenRep.label} (${chosenRep.displayPhone}). Speak with your representative on WhatsApp to finalize your requirements.`,
      assignedRepresentative: chosenRep,
      assignedRepLabel: chosenRep.label,
      assignedRepPhone: chosenRep.displayPhone,
      assignedRepWhatsapp: chosenRep.whatsappNumber,
      submittedAt,
      createdAt: submittedAt,
    });

    await writeDocToAllDbs('requests', reqId, payload, true);

    // Save notification for admin side
    const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const categoryLabel = requestData.serviceCategory || requestData.assistanceType;
    const levelPrefix = requestData.academicLevel ? `[${requestData.academicLevel}] ` : '';
    const notifPayload = {
      id: notifId,
      type: 'research_request',
      linkTab: 'research',
      title: `New Research Request: ${levelPrefix}${categoryLabel}`,
      message: `${requestData.userName} (${requestData.userEmail}) submitted a ${categoryLabel} request (${requestData.researchTitle}). Assigned to ${chosenRep.label} (${chosenRep.displayPhone}).`,
      referenceCode,
      applicantName: requestData.userName,
      applicantEmail: requestData.userEmail,
      academicLevel: requestData.academicLevel || '',
      serviceCategory: categoryLabel,
      selectedServices: requestData.selectedServices || [],
      priceDisplay: requestData.priceDisplay || '',
      assignedRepLabel: chosenRep.label,
      assignedRepPhone: chosenRep.displayPhone,
      createdAt: submittedAt,
      read: false,
    };
    writeDocToAllDbs('admin_notifications', notifId, notifPayload, true).catch(() => {});

    // Notify logged-in user in their notifications feed
    if (requestData.userId) {
      const userNotifId = `notif_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const userNotif = {
        id: userNotifId,
        title: `Research Request Submitted (${referenceCode})`,
        message: `Your ${levelPrefix}${categoryLabel} inquiry has been logged as "New Request" and assigned to ${chosenRep.label} (${chosenRep.displayPhone}).`,
        type: 'research_request',
        targetRole: 'user',
        targetUserId: requestData.userId,
        relatedId: reqId,
        read: false,
        createdAt: submittedAt,
      };
      writeDocToAllDbs('notifications', userNotifId, userNotif, false).catch(() => {});
    }

    return {
      success: true,
      id: reqId,
      referenceCode,
      assignedRepresentative: chosenRep,
      submittedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'requests');
    console.error('Error pushing research request:', error);
    return {
      success: false,
      referenceCode: '',
      error: 'Could not submit request. Please check your internet connection and try again.',
    };
  }
}

/**
 * Admin: Update a Research Request's review status and coordinator notes
 */
export async function updateResearchRequestStatus(
  requestId: string,
  status: 'New Request' | 'Under Review' | 'In Progress' | 'Scheduled' | 'Completed',
  statusNotes?: string,
  userId?: string,
  referenceCode?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePayload = sanitizeForFirestore({
      status,
      ...(statusNotes !== undefined ? { statusNotes } : {}),
      updatedAt: new Date().toISOString(),
    });
    await writeDocToAllDbs('requests', requestId, updatePayload, true);

    if (userId) {
      const notifId = `notif_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      writeDocToAllDbs(
        'notifications',
        notifId,
        {
          id: notifId,
          title: `Research Request Update (${referenceCode || requestId})`,
          message: `Status changed to "${status}". ${statusNotes ? statusNotes : ''}`.trim(),
          type: 'research_request',
          targetRole: 'user',
          targetUserId: userId,
          relatedId: requestId,
          read: false,
          createdAt: new Date().toISOString(),
        },
        false
      ).catch(() => {});
    }

    return { success: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, `requests/${requestId}`);
    return { success: false, error: error?.message || 'Failed to update research request status' };
  }
}

/**
 * Real-time listener for admin notifications
 */
export function subscribeAdminNotifications(
  onUpdate: (notifications: any[]) => void
): () => void {
  const notifMap = new Map<string, any>();
  const emit = () => {
    const list = Array.from(notifMap.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db, adminDb].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'admin_notifications'),
        (snapshot) => {
          snapshot.forEach((d) => notifMap.set(d.id, { id: d.id, ...d.data() }));
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    await writeDocToAllDbs('admin_notifications', notifId, { read: true }, true);
  } catch (e) {
    console.warn('Error marking notification as read:', e);
  }
}

/**
 * Submit Tutor / Instructor Application
 */
export async function submitTutorApplication(
  applicationData: Omit<TutorApplication, 'id' | 'status' | 'appliedAt'>
): Promise<{ success: boolean; id: string; error?: string }> {
  const appId = `tutor_app_${Date.now()}`;
  try {
    const payload = sanitizeForFirestore<TutorApplication>({
      ...applicationData,
      id: appId,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    });

    await writeDocToAllDbs('tutor_applications', appId, payload, true);

    if (applicationData.userId) {
      writeDocToAllDbs(
        'users',
        applicationData.userId,
        {
          instructorStatus: 'pending',
          instructorBio: applicationData.bio,
          instructorAcademicBackground: applicationData.academicBackground,
          instructorExpertise: applicationData.areaOfExpertise,
          instructorExperience: applicationData.experienceYears,
          country: applicationData.country || '',
          academicQualification: applicationData.academicQualification || '',
        },
        false
      ).catch(() => {});
    }

    const notifId = `notif_${Date.now()}`;
    const notifPayload = {
      id: notifId,
      title: `New Tutor Application: ${applicationData.fullName}`,
      message: `${applicationData.fullName} applied to be an Instructor (${applicationData.experienceYears} experience).`,
      type: 'tutor_application',
      targetRole: 'admin',
      relatedId: appId,
      read: false,
      createdAt: new Date().toISOString(),
      linkTab: 'tutors',
    };
    writeDocToAllDbs('admin_notifications', notifId, notifPayload, true).catch(() => {});

    return { success: true, id: appId };
  } catch (error: any) {
    console.error('Error submitting tutor application:', error);
    const rawMsg = String(error?.message || '');
    const userFriendlyError = rawMsg.toLowerCase().includes('permission')
      ? 'Unable to submit application due to a security authorization check. Please ensure you are signed in or try again.'
      : 'Something went wrong while submitting your application. Please check your network and try again.';
    return { success: false, id: appId, error: userFriendlyError };
  }
}

/**
 * Real-time listener for Tutor Applications (Admin Register)
 */
export function subscribeTutorApplications(
  onUpdate: (apps: TutorApplication[]) => void
): () => void {
  const appsMap = new Map<string, TutorApplication>();
  const emit = () => {
    const list = Array.from(appsMap.values());
    list.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db, adminDb].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'tutor_applications'),
        (snapshot) => {
          snapshot.forEach((d) => appsMap.set(d.id, { id: d.id, ...d.data() } as TutorApplication));
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}

/**
 * Admin: Review and Approve/Decline Tutor Application
 */
export async function reviewTutorApplication(
  applicationId: string,
  userId: string,
  status: 'approved' | 'rejected',
  feedbackNotes?: string,
  reviewedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePayload = sanitizeForFirestore({
      status,
      feedbackNotes: feedbackNotes || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy || 'StudiRad Admin Team',
    });

    await writeDocToAllDbs('tutor_applications', applicationId, updatePayload, true);

    if (userId) {
      await writeDocToAllDbs(
        'users',
        userId,
        {
          role: status === 'approved' ? 'Clinical Instructor / Tutor' : 'Qualified Radiographer',
          isInstructor: status === 'approved',
          instructorStatus: status,
        },
        false
      ).catch(() => {});
    }

    const notifId = `notif_user_${Date.now()}`;
    const userNotif = {
      id: notifId,
      title: status === 'approved' ? 'Tutor Application Approved!' : 'Update on Tutor Application',
      message:
        status === 'approved'
          ? 'Congratulations! You are now an approved StudiRad Instructor. You can now build courses and offer private 1-on-1 tutorials.'
          : `Thank you for applying. Feedback from team: ${feedbackNotes || 'Please contact support for guidance.'}`,
      type: 'tutor_application',
      targetRole: 'user',
      targetUserId: userId,
      relatedId: applicationId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    writeDocToAllDbs('notifications', notifId, userNotif, false).catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error('Error reviewing tutor application:', err);
    return { success: false, error: err?.message || 'Failed to review application' };
  }
}

/**
 * Submit Private Tutorial Booking Request
 */
export async function submitTutorialRequest(
  requestData: Omit<TutorialRequest, 'id' | 'status' | 'createdAt'>
): Promise<{ success: boolean; id: string; error?: string }> {
  const reqId = `tut_req_${Date.now()}`;
  try {
    const formattedSlot = formatTime12h(requestData.selectedTimeSlot);
    const payload = sanitizeForFirestore<TutorialRequest>({
      ...requestData,
      selectedTimeSlot: formattedSlot,
      id: reqId,
      status: 'pending',
      sharedWithInstructor: false,
      createdAt: new Date().toISOString(),
    });

    await writeDocToAllDbs('tutorial_requests', reqId, payload, true);

    const adminNotifId = `notif_admin_${Date.now()}`;
    const adminNotif = {
      id: adminNotifId,
      title: `Private Tutorial Request: ${requestData.courseTitle}`,
      message: `${requestData.studentName} requested ${requestData.durationMinutes}min session with ${requestData.instructorName} on ${requestData.selectedDay} (${formattedSlot}). Rate: ${requestData.currency} ${requestData.calculatedRate}.`,
      type: 'tutorial_request',
      targetRole: 'admin',
      relatedId: reqId,
      read: false,
      createdAt: new Date().toISOString(),
      linkTab: 'tutorials',
    };
    writeDocToAllDbs('admin_notifications', adminNotifId, adminNotif, true).catch(() => {});

    return { success: true, id: reqId };
  } catch (error: any) {
    console.error('Error submitting tutorial request:', error);
    const rawMsg = String(error?.message || '');
    const userFriendlyError = rawMsg.toLowerCase().includes('permission')
      ? 'Unable to submit request due to a security authorization check. Please ensure you are signed in or try again.'
      : 'Something went wrong while submitting your request. Please check your network and try again.';
    return { success: false, id: reqId, error: userFriendlyError };
  }
}

/**
 * Admin: Forward/Notify Instructor of a Course Tutorial Request in their Profile
 */
export async function notifyInstructorOfTutorialRequest(
  req: TutorialRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    await writeDocToAllDbs(
      'tutorial_requests',
      req.id,
      { sharedWithInstructor: true, notifiedInstructorAt: nowIso },
      true
    );

    if (req.instructorId) {
      const instNotifId = `notif_inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      writeDocToAllDbs(
        'notifications',
        instNotifId,
        {
          id: instNotifId,
          title: `Admin Forwarded Tutorial Request: ${req.courseTitle}`,
          message: `${req.studentName} (${req.studentEmail}) booked a ${req.durationMinutes}min session on ${req.selectedDay} (${formatTime12h(req.selectedTimeSlot)}). Check Instructor Studio to review.`,
          type: 'tutorial_request',
          targetRole: 'instructor',
          targetUserId: req.instructorId,
          relatedId: req.id,
          read: false,
          createdAt: nowIso,
        },
        false
      ).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to notify instructor' };
  }
}

/**
 * Real-time listener for Tutorial Requests
 */
export function subscribeTutorialRequests(
  onUpdate: (requests: TutorialRequest[]) => void
): () => void {
  const tutMap = new Map<string, TutorialRequest>();
  const emit = () => {
    const list = Array.from(tutMap.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db, adminDb].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'tutorial_requests'),
        (snapshot) => {
          snapshot.forEach((d) => tutMap.set(d.id, { id: d.id, ...d.data() } as TutorialRequest));
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}

/**
 * Update Tutorial Request Status (Admin / Instructor confirms with meeting link or feedback)
 */
export async function updateTutorialRequestStatus(
  requestId: string,
  status: 'confirmed' | 'declined' | 'completed',
  adminFeedback?: string,
  meetingLink?: string,
  studentId?: string,
  courseTitle?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePayload = sanitizeForFirestore<Partial<TutorialRequest>>({
      status,
      adminFeedback: adminFeedback || '',
      meetingLink: meetingLink || '',
    });
    await writeDocToAllDbs('tutorial_requests', requestId, updatePayload, true);

    if (studentId) {
      const notifId = `notif_user_${Date.now()}`;
      const userNotif = {
        id: notifId,
        title: status === 'confirmed' ? 'Tutorial Session Confirmed!' : 'Tutorial Request Update',
        message:
          status === 'confirmed'
            ? `Your private session for "${courseTitle || 'Course'}" has been confirmed! Meeting Room: ${meetingLink || 'Check dashboard for details.'}`
            : `Update on your tutorial request for "${courseTitle || 'Course'}": ${adminFeedback || status}`,
        type: 'tutorial_request',
        targetRole: 'user',
        targetUserId: studentId,
        relatedId: requestId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      writeDocToAllDbs('notifications', notifId, userNotif, false).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error updating tutorial request:', err);
    return { success: false, error: err?.message || 'Failed to update request' };
  }
}

/**
 * Admin: Approve and Publish Course (Tutors create courses with status 'pending_approval')
 */
export async function approveCourseByAdmin(
  courseId: string,
  creatorId?: string,
  courseTitle?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await writeDocToAllDbs(
      'courses',
      courseId,
      {
        status: 'published',
        updatedAt: new Date().toISOString(),
      },
      true
    );

    if (creatorId) {
      const notifId = `notif_creator_${Date.now()}`;
      const notif = {
        id: notifId,
        title: 'Course Published!',
        message: `Your course "${courseTitle || 'New Course'}" has been approved by admin and is now live to all learners!`,
        type: 'course_submission',
        targetRole: 'instructor',
        targetUserId: creatorId,
        relatedId: courseId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      writeDocToAllDbs('notifications', notifId, notif, false).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error approving course:', err);
    return { success: false, error: err?.message || 'Failed to approve course' };
  }
}

/**
 * Real-time listener for user/instructor notifications (synchronized across Home bell & Instructor Studio)
 */
export function subscribeUserNotifications(
  identity: string | UserIdentityFilter,
  onUpdate: (notifications: any[]) => void
): () => void {
  const filter: UserIdentityFilter =
    typeof identity === 'string' ? { userId: identity } : identity || {};
  const userId = filter.userId || '';
  const userEmail = filter.email?.trim().toLowerCase() || '';
  const fullNameLower = filter.fullName?.trim().toLowerCase() || '';
  const isInstructor = Boolean(filter.isInstructor);

  const notifMap = new Map<string, any>();
  const synthMap = new Map<string, any>();

  const readSyntheticIds = (): Record<string, boolean> => {
    try {
      return JSON.parse(localStorage.getItem(`studirad_read_notifs_${userId || 'anon'}`) || '{}');
    } catch {
      return {};
    }
  };

  const emit = () => {
    const readLookup = readSyntheticIds();
    const merged = new Map<string, any>();

    synthMap.forEach((val, key) => {
      merged.set(key, {
        ...val,
        read: Boolean(val.read || readLookup[key]),
      });
    });

    notifMap.forEach((val, key) => {
      merged.set(key, {
        ...val,
        read: Boolean(val.read || readLookup[key]),
      });
    });

    const list = Array.from(merged.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'notifications'),
        (snapshot) => {
          snapshot.forEach((d) => {
            const data = d.data();
            const matchesDirect =
              (userId && data.targetUserId === userId) ||
              (userEmail && data.targetEmail?.toLowerCase() === userEmail) ||
              (!data.targetUserId && data.targetRole === 'user') ||
              (isInstructor && !data.targetUserId && data.targetRole === 'instructor');

            if (matchesDirect) {
              const existing = notifMap.get(d.id);
              notifMap.set(d.id, {
                id: d.id,
                ...data,
                read: Boolean(existing?.read || data.read),
              });
            }
          });
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}

    // When user is an instructor, sync forwarded bookings & tutorials directly into the unified bell
    if (isInstructor) {
      const matchesInstructor = (d: any) =>
        (userId && d.instructorId === userId) ||
        (fullNameLower && String(d.instructorName || '').trim().toLowerCase() === fullNameLower);

      try {
        const uTut = onSnapshot(
          collection(targetDb, 'tutorial_requests'),
          (snapshot) => {
            snapshot.forEach((d) => {
              const data = d.data();
              if (!data?._deleted && data?.sharedWithInstructor === true && matchesInstructor(data)) {
                const synthId = `inst_tut_${d.id}`;
                synthMap.set(synthId, {
                  id: synthId,
                  title: `Course Tutorial Request: ${data.courseTitle || '1-on-1 Session'}`,
                  message: `${data.studentName || 'A student'} requested ${data.durationMinutes || 30}min session (${data.selectedDay} at ${formatTime12h(data.selectedTimeSlot)}). Open Instructor Studio to review.`,
                  type: 'tutorial_request',
                  targetRole: 'instructor',
                  targetUserId: userId,
                  relatedId: d.id,
                  read: Boolean(notifMap.get(synthId)?.read),
                  createdAt: data.notifiedInstructorAt || data.createdAt || new Date().toISOString(),
                });
              }
            });
            emit();
          },
          () => {}
        );
        unsubs.push(uTut);
      } catch {}

      try {
        const uPc = onSnapshot(
          collection(targetDb, 'private_class_requests'),
          (snapshot) => {
            snapshot.forEach((d) => {
              const data = d.data();
              if (!data?._deleted && data?.sharedWithInstructor === true && matchesInstructor(data)) {
                const synthId = `inst_pc_${d.id}`;
                synthMap.set(synthId, {
                  id: synthId,
                  title: `Assigned Private Class (${data.referenceCode || d.id})`,
                  message: `Admin forwarded ${data.studentName || 'a student'} for "${data.classTitle}" (${(data.selectedDays || []).join(', ')} starting ${data.startDate}). Open Instructor Studio to review.`,
                  type: 'booking',
                  targetRole: 'instructor',
                  targetUserId: userId,
                  relatedId: d.id,
                  read: Boolean(notifMap.get(synthId)?.read),
                  createdAt: data.notifiedInstructorAt || data.updatedAt || data.createdAt || new Date().toISOString(),
                });
              }
            });
            emit();
          },
          () => {}
        );
        unsubs.push(uPc);
      } catch {}
    }
  }

  return () => unsubs.forEach((u) => u());
}

export type RadiographyGameMode = 'fill_blank' | 'word_scramble' | 'memory_match' | 'true_false';

export interface GameAttemptRecord {
  id: string;
  mode: RadiographyGameMode;
  category: string;
  points: number;
  correct: boolean;
  timestamp: string;
}

export interface UserGameProgress {
  activeMode?: RadiographyGameMode;
  currentLevel: 'easy' | 'medium' | 'difficult';
  levelIndices: {
    easy: number;
    medium: number;
    difficult: number;
  };
  scrambleIndices?: {
    easy: number;
    medium: number;
    difficult: number;
  };
  trueFalseIndices?: {
    easy: number;
    medium: number;
    difficult: number;
  };
  memoryCompletedDecks?: string[];
  solvedQuestionIds: string[];
  totalScore: number;
  streak: number;
  bestStreak: number;
  marblesCount: number;
  modeScores?: Record<RadiographyGameMode, number>;
  modeSolved?: Record<RadiographyGameMode, number>;
  gamesPlayed?: number;
  correctAnswers?: number;
  attemptsCount?: number;
  recentActivity?: GameAttemptRecord[];
  lastPlayedAt: string;
}

export interface PlayerScoreRecord {
  userId: string;
  playerName: string;
  role: string;
  totalScore: number;
  bestStreak: number;
  currentStreak: number;
  solvedCount: number;
  gamesPlayed: number;
  correctAnswers: number;
  attemptsCount: number;
  modeScores: Record<RadiographyGameMode, number>;
  modeSolved: Record<RadiographyGameMode, number>;
  updatedAt: string;
}

const DEFAULT_MODE_MAP: Record<RadiographyGameMode, number> = {
  fill_blank: 0,
  word_scramble: 0,
  memory_match: 0,
  true_false: 0,
};

const DEFAULT_GAME_PROGRESS: UserGameProgress = {
  activeMode: 'fill_blank',
  currentLevel: 'easy',
  levelIndices: {
    easy: 0,
    medium: 0,
    difficult: 0,
  },
  scrambleIndices: {
    easy: 0,
    medium: 0,
    difficult: 0,
  },
  trueFalseIndices: {
    easy: 0,
    medium: 0,
    difficult: 0,
  },
  memoryCompletedDecks: [],
  solvedQuestionIds: [],
  totalScore: 0,
  streak: 0,
  bestStreak: 0,
  marblesCount: 0,
  modeScores: { ...DEFAULT_MODE_MAP },
  modeSolved: { ...DEFAULT_MODE_MAP },
  gamesPlayed: 0,
  correctAnswers: 0,
  attemptsCount: 0,
  recentActivity: [],
  lastPlayedAt: new Date().toISOString(),
};

/**
 * Save user radiographic game progress, push total score directly to user profile,
 * and update real-time player scoreboard record in Firestore.
 */
export async function saveUserGameProgress(
  userId: string,
  progress: UserGameProgress,
  playerMeta?: { fullName?: string; role?: string }
): Promise<void> {
  if (!userId) return;
  const storageKey = `studirad_game_progress_${userId}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {}

  const cleanProgress = sanitizeForFirestore({
    ...progress,
    recentActivity: (progress.recentActivity || []).slice(0, 15),
  });

  const modeScores: Record<RadiographyGameMode, number> = {
    fill_blank: progress.modeScores?.fill_blank ?? 0,
    word_scramble: progress.modeScores?.word_scramble ?? 0,
    memory_match: progress.modeScores?.memory_match ?? 0,
    true_false: progress.modeScores?.true_false ?? 0,
  };
  const modeSolved: Record<RadiographyGameMode, number> = {
    fill_blank: progress.modeSolved?.fill_blank ?? 0,
    word_scramble: progress.modeSolved?.word_scramble ?? 0,
    memory_match: progress.modeSolved?.memory_match ?? (progress.memoryCompletedDecks?.length || 0),
    true_false: progress.modeSolved?.true_false ?? 0,
  };
  const solvedCount =
    (progress.solvedQuestionIds?.length || 0) + (progress.memoryCompletedDecks?.length || 0);
  const nowIso = new Date().toISOString();

  const writes: Promise<any>[] = [
    appletDb
      ? setDoc(doc(appletDb, 'users', userId, 'game_progress', 'state'), cleanProgress, { merge: true }).catch((e) =>
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/game_progress/state`)
        )
      : Promise.resolve(),
    db
      ? setDoc(doc(db, 'users', userId, 'game_progress', 'state'), cleanProgress, { merge: true }).catch(() => {})
      : Promise.resolve(),
  ];

  // Push total score & stats directly to signed-in user's profile and real player scoreboard
  if (userId !== 'guest') {
    const profilePatch = sanitizeForFirestore({
      gameScore: progress.totalScore || 0,
      bestStreak: progress.bestStreak || 0,
      gamesSolved: solvedCount,
      gameStats: {
        fill_blank: { score: modeScores.fill_blank, solved: modeSolved.fill_blank },
        word_scramble: { score: modeScores.word_scramble, solved: modeSolved.word_scramble },
        memory_match: { score: modeScores.memory_match, solved: modeSolved.memory_match },
        true_false: { score: modeScores.true_false, solved: modeSolved.true_false },
        lastPlayedAt: nowIso,
      },
      updatedAt: nowIso,
    });

    const scoreboardRecord = sanitizeForFirestore({
      userId,
      playerName: playerMeta?.fullName?.trim() || 'Radiography Scholar',
      role: playerMeta?.role || 'Radiographer',
      totalScore: progress.totalScore || 0,
      bestStreak: progress.bestStreak || 0,
      currentStreak: progress.streak || 0,
      solvedCount,
      gamesPlayed: progress.gamesPlayed || 0,
      correctAnswers: progress.correctAnswers || 0,
      attemptsCount: progress.attemptsCount || 0,
      modeScores,
      modeSolved,
      updatedAt: nowIso,
    });

    writes.push(
      appletDb
        ? setDoc(doc(appletDb, 'users', userId), profilePatch, { merge: true }).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, `users/${userId}`)
          )
        : Promise.resolve(),
      db ? setDoc(doc(db, 'users', userId), profilePatch, { merge: true }).catch(() => {}) : Promise.resolve(),
      appletDb
        ? setDoc(doc(appletDb, 'game_scores', userId), scoreboardRecord, { merge: true }).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, `game_scores/${userId}`)
          )
        : Promise.resolve(),
      db ? setDoc(doc(db, 'game_scores', userId), scoreboardRecord, { merge: true }).catch(() => {}) : Promise.resolve()
    );
  }

  await Promise.allSettled(writes);
}

/**
 * Load user radiographic game progress (resumes where they stopped across all modes)
 */
export async function loadUserGameProgress(
  userId: string
): Promise<UserGameProgress> {
  const storageKey = `studirad_game_progress_${userId || 'guest'}`;
  let localProgress: UserGameProgress | null = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      localProgress = JSON.parse(saved);
    }
  } catch {}

  if (!userId || userId === 'guest') {
    return localProgress
      ? {
          ...DEFAULT_GAME_PROGRESS,
          ...localProgress,
          modeScores: { ...DEFAULT_MODE_MAP, ...(localProgress.modeScores || {}) },
          modeSolved: { ...DEFAULT_MODE_MAP, ...(localProgress.modeSolved || {}) },
        }
      : DEFAULT_GAME_PROGRESS;
  }

  for (const targetDb of [appletDb, db].filter(Boolean)) {
    try {
      const docRef = doc(targetDb, 'users', userId, 'game_progress', 'state');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserGameProgress;
        const merged: UserGameProgress = {
          ...DEFAULT_GAME_PROGRESS,
          ...localProgress,
          ...data,
          levelIndices: {
            ...DEFAULT_GAME_PROGRESS.levelIndices,
            ...(localProgress?.levelIndices || {}),
            ...(data.levelIndices || {}),
          },
          scrambleIndices: {
            ...DEFAULT_GAME_PROGRESS.scrambleIndices!,
            ...(localProgress?.scrambleIndices || {}),
            ...(data.scrambleIndices || {}),
          },
          trueFalseIndices: {
            ...DEFAULT_GAME_PROGRESS.trueFalseIndices!,
            ...(localProgress?.trueFalseIndices || {}),
            ...(data.trueFalseIndices || {}),
          },
          modeScores: {
            ...DEFAULT_MODE_MAP,
            ...(localProgress?.modeScores || {}),
            ...(data.modeScores || {}),
          },
          modeSolved: {
            ...DEFAULT_MODE_MAP,
            ...(localProgress?.modeSolved || {}),
            ...(data.modeSolved || {}),
          },
          memoryCompletedDecks: Array.from(
            new Set([...(localProgress?.memoryCompletedDecks || []), ...(data.memoryCompletedDecks || [])])
          ),
          recentActivity: Array.isArray(data.recentActivity)
            ? data.recentActivity
            : localProgress?.recentActivity || [],
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    } catch {}
  }

  return localProgress
    ? {
        ...DEFAULT_GAME_PROGRESS,
        ...localProgress,
        modeScores: { ...DEFAULT_MODE_MAP, ...(localProgress.modeScores || {}) },
        modeSolved: { ...DEFAULT_MODE_MAP, ...(localProgress.modeSolved || {}) },
      }
    : DEFAULT_GAME_PROGRESS;
}

/**
 * Subscribe to real Firestore player scoreboard records (no dummy entries)
 */
export function subscribePlayerScores(
  onUpdate: (players: PlayerScoreRecord[]) => void
): () => void {
  const playersMap = new Map<string, PlayerScoreRecord>();

  const emit = () => {
    const sorted = Array.from(playersMap.values())
      .filter((p) => p.totalScore > 0 || p.solvedCount > 0 || p.gamesPlayed > 0)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.bestStreak - a.bestStreak;
      });
    onUpdate(sorted);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db].filter(Boolean)) {
    try {
      const colRef = collection(targetDb, 'game_scores');
      const u = onSnapshot(
        colRef,
        (snapshot) => {
          snapshot.docs.forEach((d) => {
            const data = d.data();
            const uid = data.userId || d.id;
            const prev = playersMap.get(uid);
            const candidate: PlayerScoreRecord = {
              userId: uid,
              playerName: data.playerName || 'Radiography Scholar',
              role: data.role || 'Radiographer',
              totalScore: Number(data.totalScore) || 0,
              bestStreak: Number(data.bestStreak) || 0,
              currentStreak: Number(data.currentStreak) || 0,
              solvedCount: Number(data.solvedCount) || 0,
              gamesPlayed: Number(data.gamesPlayed) || 0,
              correctAnswers: Number(data.correctAnswers) || 0,
              attemptsCount: Number(data.attemptsCount) || 0,
              modeScores: {
                fill_blank: Number(data.modeScores?.fill_blank) || 0,
                word_scramble: Number(data.modeScores?.word_scramble) || 0,
                memory_match: Number(data.modeScores?.memory_match) || 0,
                true_false: Number(data.modeScores?.true_false) || 0,
              },
              modeSolved: {
                fill_blank: Number(data.modeSolved?.fill_blank) || 0,
                word_scramble: Number(data.modeSolved?.word_scramble) || 0,
                memory_match: Number(data.modeSolved?.memory_match) || 0,
                true_false: Number(data.modeSolved?.true_false) || 0,
              },
              updatedAt: data.updatedAt || '',
            };
            if (!prev || candidate.totalScore >= prev.totalScore) {
              playersMap.set(uid, candidate);
            }
          });
          emit();
        },
        (err) => console.warn('Player scores listener notice:', err)
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}

// =============================================================================
// PRIVATE CLASSES CATALOG & ADMIN-FIRST BOOKING REQUESTS
// =============================================================================

/**
 * Subscribe to real Private Classes catalog from Firestore (zero dummy data).
 * Merges appletDb, db, and adminDb seamlessly.
 */
export function subscribePrivateClasses(
  onUpdate: (classes: PrivateClass[]) => void
): () => void {
  const docsMap = new Map<string, any>();

  const emit = () => {
    const list: PrivateClass[] = [];
    docsMap.forEach((item) => {
      if (!item?._deleted) {
        list.push(item as PrivateClass);
      }
    });
    list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  const dbs = [
    { name: 'applet' as const, instance: appletDb },
    { name: 'db' as const, instance: db },
    { name: 'adminDb' as const, instance: adminDb },
  ].filter((d) => Boolean(d.instance));

  for (const { name, instance } of dbs) {
    try {
      const u = onSnapshot(
        collection(instance, 'private_classes'),
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const incoming = { id: docSnap.id, ...docSnap.data(), rating: Number(docSnap.data().rating) || 0 };
            docsMap.set(
              docSnap.id,
              mergeStatusDoc(docsMap.get(docSnap.id), incoming, name === 'applet' ? 'applet' : 'secondary')
            );
          });
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Create or update a Private Class (enforces max 3 days/week and max 120 mins/session)
 */
export async function pushPrivateClassToFirestore(
  classData: Partial<PrivateClass> & { id?: string }
): Promise<{ success: boolean; id: string; error?: string }> {
  const id = classData.id || `pc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  try {
    const cleanDays = Array.isArray(classData.daysAvailable)
      ? classData.daysAvailable.slice(0, 3)
      : ['Monday', 'Wednesday'];
    const cleanDuration = Math.min(120, Math.max(30, Number(classData.durationMinutes) || 60));
    const nowIso = new Date().toISOString();

    const formattedSlots =
      Array.isArray(classData.timeSlots) && classData.timeSlots.length > 0
        ? classData.timeSlots.map((slot) => formatTime12h(slot)).filter(Boolean)
        : ['5:00 PM - 7:00 PM WAT'];

    const payload = sanitizeForFirestore<PrivateClass>({
      id,
      title: (classData.title || 'Private Radiography Class').trim(),
      category: classData.category || 'X-Ray & Plain Film',
      level: classData.level || 'Undergraduate / BSc',
      image: (classData.image || '').trim(),
      daysAvailable: cleanDays,
      timeSlots: formattedSlots,
      durationMinutes: cleanDuration,
      overview: (classData.overview || '').trim(),
      introVideoUrl: (classData.introVideoUrl || '').trim(),
      instructorId: classData.instructorId || '',
      instructorName: classData.instructorName || 'Lead Clinical Instructor',
      instructorRole: classData.instructorRole || 'Clinical Instructor / Tutor',
      instructorBio: classData.instructorBio || '',
      academicExperience: classData.academicExperience || 'Clinical & Academic Educator',
      rating: typeof classData.rating === 'number' ? classData.rating : 0,
      reviewsCount: classData.reviewsCount || 0,
      instructorPhone: classData.instructorPhone || '',
      chargePerHourNGN: Number(classData.chargePerHourNGN) || 8000,
      chargePerHourUSD: Number(classData.chargePerHourUSD) || 5,
      monthlyChargeNGN: Number(classData.monthlyChargeNGN) || 45000,
      monthlyChargeUSD: Number(classData.monthlyChargeUSD) || 28,
      creatorId: classData.creatorId || '',
      creatorRole: classData.creatorRole || 'admin',
      status: classData.status || 'published',
      createdAt: classData.createdAt || nowIso,
      updatedAt: nowIso,
    });

    await writeDocToAllDbs('private_classes', id, payload, true);

    if (payload.creatorRole === 'instructor' && payload.status === 'pending_approval') {
      const notifId = `notif_pc_${Date.now()}`;
      writeDocToAllDbs(
        'admin_notifications',
        notifId,
        {
          id: notifId,
          title: `New Private Class Awaiting Review: ${payload.title}`,
          message: `${payload.instructorName} submitted a private class (${payload.category}) for approval.`,
          type: 'course_submission',
          targetRole: 'admin',
          relatedId: id,
          read: false,
          createdAt: nowIso,
          linkTab: 'private_classes',
        },
        true
      ).catch(() => {});
    }

    return { success: true, id };
  } catch (err: any) {
    console.error('Error saving private class:', err);
    return { success: false, id, error: err?.message || 'Failed to save private class' };
  }
}

export async function approvePrivateClassByAdmin(
  classId: string,
  creatorId?: string,
  classTitle?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    await writeDocToAllDbs('private_classes', classId, { status: 'published', updatedAt: nowIso }, true);

    if (creatorId) {
      const notifId = `notif_pc_app_${Date.now()}`;
      writeDocToAllDbs(
        'notifications',
        notifId,
        {
          id: notifId,
          title: 'Private Class Approved!',
          message: `Your private class "${classTitle || 'Private Class'}" has been approved by admin and is now live to learners.`,
          type: 'class',
          targetRole: 'instructor',
          targetUserId: creatorId,
          relatedId: classId,
          read: false,
          createdAt: nowIso,
        },
        false
      ).catch(() => {});
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to approve private class' };
  }
}

export async function deletePrivateClassFromFirestore(
  classId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDocFromAllDbs('private_classes', classId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete private class' };
  }
}

/**
 * Submit Private Class Booking Request (Admin-first routing: NEVER notifies instructor directly)
 */
export async function submitPrivateClassBooking(
  bookingData: Omit<
    PrivateClassBookingRequest,
    'id' | 'referenceCode' | 'status' | 'sharedWithInstructor' | 'createdAt'
  >
): Promise<{ success: boolean; id: string; referenceCode: string; error?: string }> {
  const id = `pc_req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const referenceCode = `SR-CLS-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowIso = new Date().toISOString();

  try {
    const formattedSlot = formatTime12h(bookingData.selectedTimeSlot);
    const payload = sanitizeForFirestore<PrivateClassBookingRequest>({
      ...bookingData,
      selectedTimeSlot: formattedSlot,
      instructorId: bookingData.instructorId || '',
      instructorPhone: bookingData.instructorPhone || '',
      notes: bookingData.notes?.trim() || '',
      id,
      referenceCode,
      status: 'New Request',
      sharedWithInstructor: false, // Strictly Admin-first!
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await writeDocToAllDbs('private_class_requests', id, payload, true);

    // Notify Admin ONLY
    const adminNotifId = `notif_admin_pc_${Date.now()}`;
    writeDocToAllDbs(
      'admin_notifications',
      adminNotifId,
      {
        id: adminNotifId,
        title: `New Private Class Request (${referenceCode})`,
        message: `${bookingData.studentName} (${bookingData.studentEmail}) requested "${bookingData.classTitle}" with ${bookingData.instructorName}. Plan: ${bookingData.planType === 'monthly' ? 'Monthly Subscription' : `${bookingData.selectedDays.join(', ')}`} starting ${bookingData.startDate}.`,
        type: 'booking',
        targetRole: 'admin',
        relatedId: id,
        read: false,
        createdAt: nowIso,
        linkTab: 'private_classes',
      },
      true
    ).catch(() => {});

    // Notify student confirmation
    if (bookingData.studentId) {
      const userNotifId = `notif_user_pc_${Date.now()}`;
      writeDocToAllDbs(
        'notifications',
        userNotifId,
        {
          id: userNotifId,
          title: `Private Class Request Logged (${referenceCode})`,
          message: `We received your booking request for "${bookingData.classTitle}". Our coordinator will notify your instructor and get back to you within 24–48 hours.`,
          type: 'booking',
          targetRole: 'user',
          targetUserId: bookingData.studentId,
          relatedId: id,
          read: false,
          createdAt: nowIso,
        },
        false
      ).catch(() => {});
    }

    return { success: true, id, referenceCode };
  } catch (err: any) {
    console.error('Error submitting private class booking:', err);
    return {
      success: false,
      id,
      referenceCode,
      error: err?.message || 'Could not submit private class request. Please try again.',
    };
  }
}

export function subscribePrivateClassBookings(
  onUpdate: (bookings: PrivateClassBookingRequest[]) => void
): () => void {
  const bookingsMap = new Map<string, PrivateClassBookingRequest>();
  const emit = () => {
    const list = Array.from(bookingsMap.values());
    list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db, adminDb].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'private_class_requests'),
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            bookingsMap.set(docSnap.id, {
              id: docSnap.id,
              ...docSnap.data(),
            } as PrivateClassBookingRequest);
          });
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}

/**
 * Admin: Forward/Notify Instructor of a Private Class Booking (In-App Profile + Notification Bell)
 */
export async function notifyInstructorOfPrivateBooking(
  booking: PrivateClassBookingRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    await writeDocToAllDbs(
      'private_class_requests',
      booking.id,
      { sharedWithInstructor: true, notifiedInstructorAt: nowIso, updatedAt: nowIso },
      true
    );

    if (booking.instructorId) {
      const notifId = `notif_inst_pc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      writeDocToAllDbs(
        'notifications',
        notifId,
        {
          id: notifId,
          title: `New Student Private Class Assigned (${booking.referenceCode})`,
          message: `Admin forwarded a booking from ${booking.studentName} for "${booking.classTitle}" (${booking.selectedDays.join(', ')} at ${formatTime12h(booking.selectedTimeSlot)}, starting ${booking.startDate}). Open Instructor Studio to review.`,
          type: 'booking',
          targetRole: 'instructor',
          targetUserId: booking.instructorId,
          relatedId: booking.id,
          read: false,
          createdAt: nowIso,
        },
        false
      ).catch(() => {});
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to notify instructor' };
  }
}

export async function updatePrivateClassBookingStatus(
  bookingId: string,
  status: PrivateClassBookingRequest['status'],
  adminFeedback?: string,
  meetingLink?: string,
  studentId?: string,
  classTitle?: string,
  referenceCode?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const updatePayload = sanitizeForFirestore<Partial<PrivateClassBookingRequest>>({
      status,
      ...(adminFeedback !== undefined ? { adminFeedback } : {}),
      ...(meetingLink !== undefined ? { meetingLink } : {}),
      updatedAt: nowIso,
    });

    await writeDocToAllDbs('private_class_requests', bookingId, updatePayload, true);

    if (studentId) {
      const notifId = `notif_user_pc_upd_${Date.now()}`;
      writeDocToAllDbs(
        'notifications',
        notifId,
        {
          id: notifId,
          title: `Private Class Update (${referenceCode || bookingId})`,
          message: `Status for "${classTitle || 'Private Class'}" is now "${status}". ${meetingLink ? `Classroom Link: ${meetingLink}` : adminFeedback || ''}`.trim(),
          type: 'booking',
          targetRole: 'user',
          targetUserId: studentId,
          relatedId: bookingId,
          read: false,
          createdAt: nowIso,
        },
        false
      ).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update private class booking' };
  }
}

// =============================================================================
// REAL CONTENT RATINGS (Courses, Private Classes, Live Classes, Videos/Materials)
// =============================================================================

export interface RatingSummary {
  average: number;
  count: number;
  userRatings: Record<string, number>;
}

const PARENT_COLLECTION_BY_TYPE: Record<RatableContentType, string[]> = {
  course: ['courses'],
  private_class: ['private_classes'],
  live_class: ['classes'],
  material: ['materials', 'videos'],
};

export async function submitContentRating(params: {
  itemType: RatableContentType;
  itemId: string;
  userId: string;
  userName?: string;
  score: number;
}): Promise<{ success: boolean; average?: number; count?: number; error?: string }> {
  const { itemType, itemId, userId, userName, score } = params;
  if (!itemId || !userId) return { success: false, error: 'Missing itemId or userId' };

  const clampedScore = Math.min(5, Math.max(1, Math.round(score)));
  const ratingId = `${itemType}_${itemId}_${userId}`;
  const nowIso = new Date().toISOString();

  const ratingDoc: ContentRating = {
    id: ratingId,
    itemType,
    itemId,
    userId,
    userName: userName || 'StudiRad User',
    score: clampedScore,
    updatedAt: nowIso,
  };

  try {
    await writeDocToAllDbs('ratings', ratingId, ratingDoc, true);

    // Recompute real average for this item across synced ratings docs
    const allScores = new Map<string, number>();
    allScores.set(userId, clampedScore);

    const snaps = await Promise.allSettled([
      appletDb ? getDocs(collection(appletDb, 'ratings')) : Promise.reject('no appletDb'),
      db ? getDocs(collection(db, 'ratings')) : Promise.reject('no db'),
    ]);

    for (const s of snaps) {
      if (s.status === 'fulfilled') {
        s.value.forEach((dSnap) => {
          const d = dSnap.data();
          if (d?.itemType === itemType && d?.itemId === itemId && d?.userId && typeof d?.score === 'number') {
            allScores.set(d.userId, d.score);
          }
        });
      }
    }

    const values = Array.from(allScores.values());
    const count = values.length;
    const avg = count > 0 ? Number((values.reduce((a, b) => a + b, 0) / count).toFixed(1)) : clampedScore;

    // Best-effort sync average back onto parent content doc
    const colls = PARENT_COLLECTION_BY_TYPE[itemType] || [];
    for (const collName of colls) {
      writeDocToAllDbs(
        collName,
        itemId,
        { rating: avg, reviewsCount: String(count), updatedAt: nowIso },
        false
      ).catch(() => {});
    }

    return { success: true, average: avg, count };
  } catch (err: any) {
    console.error('Error submitting rating:', err);
    return { success: false, error: err?.message || 'Failed to save rating' };
  }
}

export function subscribeContentRatings(
  onUpdate: (summaries: Record<string, RatingSummary>) => void
): () => void {
  const rawRatings = new Map<string, ContentRating>();

  const emit = () => {
    const grouped: Record<string, { total: number; count: number; userRatings: Record<string, number> }> = {};
    rawRatings.forEach((r) => {
      if (!r?.itemType || !r?.itemId || typeof r?.score !== 'number') return;
      const key = `${r.itemType}_${r.itemId}`;
      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0, userRatings: {} };
      }
      grouped[key].total += r.score;
      grouped[key].count += 1;
      if (r.userId) {
        grouped[key].userRatings[r.userId] = r.score;
      }
    });

    const summaries: Record<string, RatingSummary> = {};
    Object.entries(grouped).forEach(([k, g]) => {
      summaries[k] = {
        average: g.count > 0 ? Number((g.total / g.count).toFixed(1)) : 0,
        count: g.count,
        userRatings: g.userRatings,
      };
    });
    onUpdate(summaries);
  };

  const unsubs: (() => void)[] = [];
  for (const targetDb of [appletDb, db, adminDb].filter(Boolean)) {
    try {
      const u = onSnapshot(
        collection(targetDb, 'ratings'),
        (snapshot) => {
          snapshot.forEach((d) => {
            const data = d.data() as ContentRating;
            if (data?.itemType && data?.itemId && typeof data?.score === 'number') {
              const prev = rawRatings.get(d.id);
              if (!prev || toTimestampMs(data.updatedAt) >= toTimestampMs(prev.updatedAt)) {
                rawRatings.set(d.id, { ...data, id: d.id });
              }
            }
          });
          emit();
        },
        () => {}
      );
      unsubs.push(u);
    } catch {}
  }

  return () => unsubs.forEach((u) => u());
}



