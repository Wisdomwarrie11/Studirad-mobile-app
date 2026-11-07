import { 
  collection, 
  onSnapshot, 
  doc, 
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
  AppNotification
} from '../types';
import { MOCK_OPPORTUNITIES, MOCK_LIVE_CLASSES, MOCK_WEBINARS, MOCK_COURSES, MOCK_RESOURCES } from '../data/mockData';
import { getYouTubeThumbnail } from '../utils/youtube';

export type { EnrolledCourseRecord };

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
export const ACTIVE_CLASSES: LiveClass[] = [
  {
    id: "artifacts-abdominal-ultrasound-2026",
    title: "Artifacts in Abdominal Ultrasound: Recognition, Interpretation, and Clinical Application",
    category: "Ultrasound",
    level: "All Levels",
    status: "completed",
    price: "FREE",
    isPaid: false,
    duration: "4 Days (1st – 4th September 2026)",
    time: "7:00 PM Daily",
    venue: "StudiRad Classroom",
    thumbnail: "/artifacts.jpeg",
    image: "/artifacts.jpeg",
    hasCustomRegistration: true,
    customConfirmationMessage: "Congratulations! Your registration for Artifacts in Abdominal Ultrasound is complete. To successfully join the class, please use the secure Google Classroom invitation link below.",
    description: "Master the principles, physics, and clinical significance of abdominal ultrasound artifacts. Learn to differentiate real pathology from artificial signals and avoid common diagnostic pitfalls.",
    features: [
      "Live Interactive Classroom",
      "Physics & Artifact Formation",
      "Case-Based Pathology Differentiation",
      "Diagnostic Pitfalls & Errors Guide"
    ],
    whatYouWillLearn: [
      "Understand ultrasound artifacts and why they occur",
      "Learn the physics behind artifact formation",
      "Recognise common abdominal ultrasound artifacts",
      "Differentiate artifacts from pathology",
      "Apply artifacts in clinical interpretation",
      "Avoid common pitfalls and diagnostic errors"
    ],
    technologies: ["StudiRad Classroom", "Google Classroom", "Google Meet"],
    createdAt: 1788259200,
    instructor: "StudiRad Ultrasound Faculty",
    instructorRole: "Lead Clinical Sonographer",
    cpdCredits: "2.0 CPD Points",
    date: "1st – 4th September 2026",
    modality: "ultrasound",
    cohortStatus: "completed",
  },
  {
    id: "chest-critique-2026",
    title: "Radiographic Image Critique: Systematic Evaluation of Chest Radiographs",
    category: "X-ray",
    level: "All Levels",
    status: "completed",
    price: "FREE",
    isPaid: false,
    duration: "5 Days (22nd – 26th June 2026)",
    time: "8:30 PM Daily",
    venue: "StudiRad Google Classroom",
    thumbnail: "/Critiquing.jpeg",
    image: "/Critiquing.jpeg",
    hasCustomRegistration: true,
    customConfirmationMessage: "Congratulations! Your registration is complete. To successfully join the class, please use the secure Google Classroom invitation link below.",
    description: "Master the art and science of chest radiograph interpretation. This intensive five-day cohort is designed for radiography students, pre-interns, interns, and practicing radiographers who want to perfect their systematic approach to chest X-ray quality evaluation and pattern recognition.",
    features: [
      "Live Classes",
      "Case-Based Sessions",
      "Guided Image Critique"
    ],
    whatYouWillLearn: [
      "Systematic assessment of chest radiograph image quality",
      "Recognition of major chest radiographic patterns",
      "Identification of common chest pathologies",
      "And more…"
    ],
    technologies: ["Google Classroom", "Google Meet"],
    createdAt: 1781827200,
    instructor: "StudiRad Radiology Faculty",
    instructorRole: "Consultant Radiography Specialist",
    cpdCredits: "2.5 CPD Points",
    date: "22nd – 26th June 2026",
    modality: "xray",
    cohortStatus: "completed",
  }
];

export const COMING_SOON_CLASSES: LiveClass[] = [
  {
    id: "cs-class-1",
    title: "Foundation of Abdominal Ultrasound",
    category: "Ultrasound",
    level: "Beginner",
    status: "coming-soon",
    thumbnail: "/Abd.jpg",
    image: "/Abd.jpg",
    price: "FREE",
    isPaid: false,
    duration: "4 Weeks (Online)",
    time: "To be announced",
    venue: "StudiRad Google Classroom",
    registrationLink: "https://docs.google.com/forms/...",
    registerLink: "https://docs.google.com/forms/...",
    description: "A clinical masterclass on interpreting chest X-rays. Perfect for students and interns preparing for clinical rotations.",
    technologies: ["Google Meet", "StudiRad Google Classroom"],
    createdAt: 1785000000,
    instructor: "StudiRad Ultrasound Faculty",
    instructorRole: "Lead Sonography Specialist",
    cpdCredits: "4.0 CPD Points",
    date: "Coming Soon · 4 Weeks",
    modality: "ultrasound",
    cohortStatus: "coming-soon",
  }
];

export const OFFICIAL_CLASSES: LiveClass[] = [
  ...ACTIVE_CLASSES,
  ...COMING_SOON_CLASSES
];

/**
 * Real-time listener for classes
 * Synchronized with db and adminDb collection: 'classes' (matching web app ClassesPage & Admin)
 */
export function subscribeClasses(
  onUpdate: (classes: LiveClass[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const classesMap = new Map<string, LiveClass>();

  // Pre-seed official classes so UI renders instantly with verified data
  OFFICIAL_CLASSES.forEach((c) => {
    classesMap.set(c.id, c);
  });

  const emit = () => {
    const list = Array.from(classesMap.values());
    onUpdate(list);
  };

  const parseClassDoc = (docSnap: any): LiveClass => {
    const data = docSnap.data();
    const rawCategory = data.category || data.modality || 'X-ray';
    const isCompleted = data.status === 'completed' || data.cohortStatus === 'completed';
    const isComingSoon = data.status === 'coming-soon' || data.cohortStatus === 'coming-soon';

    return {
      id: docSnap.id,
      title: data.title || '',
      instructor: data.instructor || 'StudiRad Faculty',
      instructorRole: data.instructorRole || 'Lead Radiography Specialist',
      date: data.date || data.duration || '',
      time: data.time || '',
      duration: data.duration || 'Session',
      isLiveNow: !!data.isLiveNow,
      isRegistered: !!data.isRegistered,
      cpdCredits: data.cpdCredits || '2.0 CPD Points',
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
      status: data.status || (isCompleted ? 'completed' : isComingSoon ? 'coming-soon' : 'published'),
      cohortStatus: isCompleted ? 'completed' : isComingSoon ? 'coming-soon' : 'upcoming',
      whatYouWillLearn: Array.isArray(data.whatYouWillLearn) ? data.whatYouWillLearn : [],
      createdAt: data.createdAt,
    };
  };

  const unsubs: (() => void)[] = [];

  // Emit initial pre-seeded state
  emit();

  // 1. Subscribe to db (studirad-platform-new) with query matching web app ClassesPage
  try {
    const collRef = collection(db, 'classes');
    const u1 = onSnapshot(
      collRef,
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.status || data.status === 'published' || data.status === 'completed' || data.status === 'coming-soon' || data.status === 'upcoming') {
            classesMap.set(docSnap.id, parseClassDoc(docSnap));
          }
        });
        emit();
      },
      (error) => {
        console.warn('DB Classes subscription notice:', error);
        onError?.(error);
      }
    );
    unsubs.push(u1);
  } catch (error) {
    console.warn('Classes subscription error:', error);
  }

  // 2. Also subscribe to adminDb (studirad-admin-portal) in case admin created classes there
  try {
    const adminCollRef = collection(adminDb, 'classes');
    const u2 = onSnapshot(
      adminCollRef,
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.status || data.status === 'published' || data.status === 'completed' || data.status === 'coming-soon' || data.status === 'upcoming') {
            classesMap.set(docSnap.id, parseClassDoc(docSnap));
          }
        });
        emit();
      },
      (error) => {
        console.warn('AdminDb Classes notice:', error);
      }
    );
    unsubs.push(u2);
  } catch (error) {
    console.warn('AdminDb Classes subscription error:', error);
  }

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
          onUpdate(MOCK_WEBINARS);
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
              views: data.views || '1.2k views',
              rating: typeof data.rating === 'number' ? data.rating : 4.9,
              cpdCredits: data.cpdCredits || '1.0 CPD Point',
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
 * Real-time listener for user completed classes
 * Uses appletDb as primary source with deployed security rules,
 * with graceful fallback to db (studirad-platform-new)
 */
export function subscribeUserCompletedClasses(
  userId: string,
  onUpdate: (records: UserCompletedRecord[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  const unsubs: (() => void)[] = [];
  const recordsMap = new Map<string, UserCompletedRecord>();
  const emit = () => onUpdate(Array.from(recordsMap.values()));

  // 1. Primary listener from appletDb (ai-studio-studiradmobileap-6f5d2912-b23e-4c44-828e-081071b478b2)
  try {
    const appletRef = collection(appletDb, 'users', userId, 'completedClasses');
    const u1 = onSnapshot(appletRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        recordsMap.set(docSnap.id, {
          classId: d.classId || docSnap.id,
          title: d.title || 'Completed Masterclass',
          modality: d.modality || 'General',
          cpdCredits: d.cpdCredits || '1.0 CPD Point',
          completedAt: d.completedAt || new Date().toISOString(),
        });
      });
      emit();
    }, () => {});
    unsubs.push(u1);
  } catch (_) {}

  // 2. Secondary listener from db (studirad-platform-new) with silent permission fallback
  try {
    const collRef = collection(db, 'users', userId, 'completedClasses');
    const u2 = onSnapshot(
      collRef,
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          recordsMap.set(docSnap.id, {
            classId: d.classId || docSnap.id,
            title: d.title || 'Completed Masterclass',
            modality: d.modality || 'General',
            cpdCredits: d.cpdCredits || '1.0 CPD Point',
            completedAt: d.completedAt || new Date().toISOString(),
          });
        });
        emit();
      },
      (error: any) => {
        // Suppress permission notices if external project restricts unauthenticated reading
        if (error?.code === 'permission-denied') return;
        console.warn('Completed classes subscription notice:', error);
      }
    );
    unsubs.push(u2);
  } catch (_) {}

  return () => {
    unsubs.forEach((u) => u());
  };
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
    cpdCredits: classData.cpdCredits || '1.0 CPD Point',
    completedAt: new Date().toISOString(),
    userId,
  };

  try {
    // Write to appletDb with deployed rules
    const appletDocRef = doc(appletDb, 'users', userId, 'completedClasses', classData.classId);
    await setDoc(appletDocRef, payload, { merge: true });
  } catch (_) {}

  try {
    // Also sync to secondary db
    const docRef = doc(db, 'users', userId, 'completedClasses', classData.classId);
    await setDoc(docRef, payload, { merge: true }).catch(() => {});
  } catch (_) {}
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
      rating: typeof data.rating === 'number' ? data.rating : 5.0,
      reviewsCount: data.reviewsCount || '0',
      learners: data.learners || '0',
      duration: data.duration || 'Flexible',
      level: data.level || 'All Levels',
      category: data.category || 'general_radiography',
      cpdCredits: data.cpdCredits || '1.0 CPD Point',
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

  // 1. Dedicated courses collection in db (primary Firestore)
  try {
    const coursesRef = collection(db, 'courses');
    const u1 = onSnapshot(coursesRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        coursesMap.set(docSnap.id, parseCourseDoc(docSnap));
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
          coursesMap.set(docSnap.id, parseCourseDoc(docSnap));
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

  // 3. Dedicated appletDb courses collection (ai-studio-studiradmobileap-6f5d2912-b23e-4c44-828e-081071b478b2)
  try {
    if (appletDb) {
      const appletCoursesRef = collection(appletDb, 'courses');
      const u3 = onSnapshot(appletCoursesRef, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          coursesMap.set(docSnap.id, parseCourseDoc(docSnap));
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
  const matsMap = new Map<string, ClinicalResource>();

  const emit = () => {
    const list = Array.from(matsMap.values());
    onUpdate(list);
  };

  const unsubs: (() => void)[] = [];

  // 1. Materials from db (studirad-platform-new)
  try {
    const matsRef = collection(db, 'materials');
    const u1 = onSnapshot(matsRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        matsMap.set(`mat_${docSnap.id}`, {
          id: docSnap.id,
          title: data.title || 'Clinical Material',
          category: data.course || data.category || 'General Radiography',
          format: data.type === 'file' 
            ? (data.link?.toLowerCase().includes('.pdf') ? 'PDF' : 'Checklist')
            : (data.format || 'Guideline'),
          size: data.size || '1.8 MB',
          description: data.description || `Clinical material for ${data.course || 'radiography'} uploaded by ${data.uploader || 'StudiRad Faculty'}.`,
          downloadUrl: data.link || data.downloadUrl || '',
          modality: mapCourseToModality(data.course || data.modality),
          course: data.course,
          uploader: data.uploader,
          link: data.link,
        });
      });
      emit();
    }, (err) => console.warn('Materials subscription notice:', err));
    unsubs.push(u1);
  } catch (e) {
    console.warn('Materials listener error:', e);
  }

  // 2. Videos from db (studirad-platform-new)
  try {
    const vidsRef = collection(db, 'videos');
    const u2 = onSnapshot(vidsRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        matsMap.set(`vid_${docSnap.id}`, {
          id: docSnap.id,
          title: data.title || 'Recorded Clinical Video',
          category: data.course || 'Educational Video',
          format: 'Slide Deck',
          size: 'Stream',
          description: `Recorded clinical session on ${data.course || 'radiography'} by ${data.uploader || 'StudiRad'}.`,
          downloadUrl: data.link || '',
          modality: mapCourseToModality(data.course),
          course: data.course,
          uploader: data.uploader,
          link: data.link,
        });
      });
      emit();
    }, (err) => console.warn('Videos as materials notice:', err));
    unsubs.push(u2);
  } catch (e) {
    console.warn('Videos as materials listener error:', e);
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Real-time listener for study materials (Reading Materials & Video Lectures)
 * Directly synchronized with 'materials' and 'videos' collections in studirad-platform-new
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

  // 1. Subscribe to 'materials' in db (from web app MaterialsPage & admin)
  try {
    const matsRef = collection(db, 'materials');
    const u1 = onSnapshot(matsRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const isVid = data.type === 'video' || data.link?.includes('youtube.com') || data.link?.includes('youtu.be') || data.link?.includes('drive.google.com');
        matsMap.set(`mat_${docSnap.id}`, {
          id: docSnap.id,
          title: data.title || 'Study Material',
          course: data.course || 'Others',
          uploader: data.uploader || 'StudiRad Faculty',
          link: data.link || '',
          type: isVid ? 'video' : (data.type || 'pdf'),
          thumbnailUrl: data.thumbnailUrl,
          createdAt: data.createdAt,
          description: data.description,
        });
      });
      emit();
    }, (err) => console.warn('Study materials subscription notice:', err));
    unsubs.push(u1);
  } catch (e) {
    console.warn('Materials listener error:', e);
  }

  // 2. Subscribe to 'videos' in db
  try {
    const vidsRef = collection(db, 'videos');
    const u2 = onSnapshot(vidsRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        matsMap.set(`vid_${docSnap.id}`, {
          id: docSnap.id,
          title: data.title || 'Clinical Video Lecture',
          course: data.course || 'Others',
          uploader: data.uploader || 'StudiRad Faculty',
          link: data.link || '',
          type: 'video',
          thumbnailUrl: data.thumbnailUrl,
          createdAt: data.createdAt,
          description: data.description || 'Recorded clinical session',
        });
      });
      emit();
    }, (err) => console.warn('Videos as materials notice:', err));
    unsubs.push(u2);
  } catch (e) {
    console.warn('Videos listener error:', e);
  }

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

    const payload = {
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
    };

    // 1. Primary write to appletDb (ai-studio-studiradmobileap-6f5d2912-b23e-4c44-828e-081071b478b2)
    try {
      if (appletDb) {
        await setDoc(doc(appletDb, 'courses', courseId), payload, { merge: true });
      }
    } catch (_) {}

    // 2. Write to db (studirad-platform-new)
    const docRef = doc(db, 'courses', courseId);
    await setDoc(docRef, payload, { merge: true }).catch(() => {});

    // 3. Write to adminDb (studirad-admin-portal)
    try {
      if (adminDb && adminDb !== db) {
        await setDoc(doc(adminDb, 'courses', courseId), payload, { merge: true });
      }
    } catch (_) {}

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
    try {
      if (appletDb) {
        await deleteDoc(doc(appletDb, 'courses', courseId));
      }
    } catch (_) {}

    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (_) {}

    try {
      await deleteDoc(doc(adminDb, 'courses', courseId));
    } catch (_) {}

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
 * Admin: Push or update a live class in Firestore across both synced projects
 */
export async function pushClassToFirestore(
  classData: Partial<LiveClass>
): Promise<{ success: boolean; id: string; error?: string }> {
  const classId = classData.id || `live_${Date.now()}`;
  const path = `classes/${classId}`;
  const payload = {
    ...classData,
    id: classId,
    updatedAt: new Date().toISOString(),
    createdAt: classData.createdAt || new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'classes', classId);
    await setDoc(docRef, payload, { merge: true });
  } catch (error: any) {
    console.warn('Error pushing class to db:', error);
  }

  try {
    const adminDocRef = doc(adminDb, 'classes', classId);
    await setDoc(adminDocRef, payload, { merge: true });
  } catch (error: any) {
    console.warn('Error pushing class to adminDb:', error);
  }

  return { success: true, id: classId };
}

/**
 * Admin: Delete a live class from Firestore
 */
export async function deleteClassFromFirestore(
  classId: string
): Promise<{ success: boolean; error?: string }> {
  const path = `classes/${classId}`;
  try {
    const docRef = doc(db, 'classes', classId);
    await deleteDoc(docRef);
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
  
  const payload = {
    course: materialData.course || materialData.category || 'General Radiography',
    title: materialData.title || '',
    uploader: materialData.uploader || 'StudiRad Faculty',
    link: materialData.downloadUrl || materialData.link || '',
    type: materialData.format === 'PDF' || materialData.format === 'Checklist' ? 'file' : 'link',
    size: materialData.size || '1.8 MB',
    modality: materialData.modality || 'xray',
    description: materialData.description || '',
    createdAt: new Date(),
  };

  try {
    const docRef = doc(db, 'materials', materialId);
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: materialId };
  } catch (error: any) {
    console.error('Error pushing material to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, id: materialId, error: error?.message || 'Failed to push material' };
  }
}

/**
 * Admin: Push or update a video resource in Firestore (studirad-platform-new)
 * Matching the exact fields of the web app AdminMaterialsPage (videos tab)
 */
export async function pushVideoToFirestore(videoData: {
  course: string;
  title: string;
  uploader: string;
  link: string;
  thumbnailUrl?: string;
}): Promise<{ success: boolean; id: string; error?: string }> {
  const videoId = `vid_${Date.now()}`;
  const payload = {
    course: videoData.course || 'General Radiography',
    title: videoData.title || '',
    uploader: videoData.uploader || 'StudiRad Faculty',
    link: videoData.link || '',
    thumbnailUrl: videoData.thumbnailUrl || '',
    createdAt: new Date(),
  };

  try {
    await setDoc(doc(db, 'videos', videoId), payload, { merge: true });
    return { success: true, id: videoId };
  } catch (error: any) {
    console.error('Error pushing video to Firestore:', error);
    return { success: false, id: videoId, error: error?.message || 'Failed to push video' };
  }
}

/**
 * Admin: Delete a clinical material or video from Firestore
 */
export async function deleteMaterialFromFirestore(
  materialId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'materials', materialId)).catch(() => {});
    await deleteDoc(doc(db, 'videos', materialId)).catch(() => {});
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
  let count = 0;
  for (const cls of OFFICIAL_CLASSES) {
    try {
      const payload = {
        ...cls,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'classes', cls.id), payload, { merge: true });
      await setDoc(doc(adminDb, 'classes', cls.id), payload, { merge: true });
      count++;
    } catch (e) {
      console.warn(`Class ${cls.id} push notice:`, e);
    }
  }
  return { success: true, count };
}

/**
 * Seeds initial documents if Firestore collections are empty
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    await pushOfficialClassesToFirestore();
  } catch (err) {
    console.warn('Initial classes push notice:', err);
  }
}

/**
 * Real-time listener for user requests (research assistance, tutoring, etc.)
 */
export function subscribeUserRequests(
  userEmailOrId: string,
  onUpdate: (requests: any[]) => void
): () => void {
  const collRef = collection(db, 'requests');
  
  const unsubscribe = onSnapshot(
    collRef,
    (snapshot) => {
      const all: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          !userEmailOrId ||
          data.userId === userEmailOrId ||
          data.userEmail?.toLowerCase() === userEmailOrId.toLowerCase()
        ) {
          all.push({
            id: docSnap.id,
            ...data,
          });
        }
      });
      all.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
      onUpdate(all);
    },
    (err) => {
      console.warn('Requests subscription notice:', err);
      try {
        const saved = JSON.parse(localStorage.getItem('studirad_user_requests') || '[]');
        onUpdate(saved);
      } catch {
        onUpdate([]);
      }
    }
  );

  return unsubscribe;
}

/**
 * Real-time listener for all requests for admin dashboard
 */
export function subscribeAllRequests(
  onUpdate: (requests: any[]) => void
): () => void {
  const collRef = collection(db, 'requests');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const all: any[] = [];
      snapshot.forEach((docSnap) => {
        all.push({ id: docSnap.id, ...docSnap.data() });
      });
      all.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
      onUpdate(all);
    },
    (err) => console.warn('Admin requests subscription notice:', err)
  );
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
  supportDetails?: string;
  deadline: string;
  methodologyNotes?: string;
}): Promise<{ success: boolean; referenceCode: string; error?: string }> {
  try {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const referenceCode = `SR-RES-${randomNum}`;
    const reqId = 'req_' + Date.now();

    const payload = {
      ...requestData,
      id: reqId,
      referenceCode,
      category: 'research',
      status: 'Submitted',
      statusNotes: 'Research inquiry received. An academic supervisor will review your project brief.',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'requests', reqId), payload, { merge: true });
    await setDoc(doc(adminDb, 'requests', reqId), payload, { merge: true }).catch(() => {});

    // Save notification for admin side
    const notifId = 'notif_' + Date.now();
    const notifPayload = {
      id: notifId,
      type: 'research_request',
      title: `New Research Request: ${requestData.researchTitle}`,
      message: `${requestData.userName} (${requestData.userEmail}) requested support for ${requestData.assistanceType}.`,
      referenceCode,
      applicantName: requestData.userName,
      applicantEmail: requestData.userEmail,
      discipline: requestData.discipline,
      assistanceType: requestData.assistanceType,
      createdAt: new Date().toISOString(),
      read: false,
    };
    await setDoc(doc(db, 'admin_notifications', notifId), notifPayload, { merge: true }).catch(() => {});
    await setDoc(doc(adminDb, 'admin_notifications', notifId), notifPayload, { merge: true }).catch(() => {});

    return { success: true, referenceCode };
  } catch (error) {
    console.error('Error pushing research request:', error);
    return { success: false, referenceCode: '', error: 'Could not submit request. Please check your internet connection.' };
  }
}

/**
 * Real-time listener for admin notifications
 */
export function subscribeAdminNotifications(
  onUpdate: (notifications: any[]) => void
): () => void {
  const collRef = collection(db, 'admin_notifications');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Admin notifications subscription notice:', err)
  );
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'admin_notifications', notifId), { read: true }, { merge: true });
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
    const payload: TutorApplication = {
      ...applicationData,
      id: appId,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    // Save to tutor_applications
    await setDoc(doc(db, 'tutor_applications', appId), payload, { merge: true });
    if (appletDb) {
      await setDoc(doc(appletDb, 'tutor_applications', appId), payload, { merge: true }).catch(() => {});
    }

    // Also update user's profile with instructorStatus = 'pending'
    if (applicationData.userId) {
      const userRef = doc(db, 'users', applicationData.userId);
      await setDoc(userRef, {
        instructorStatus: 'pending',
        instructorBio: applicationData.bio,
        instructorAcademicBackground: applicationData.academicBackground,
        instructorExpertise: applicationData.areaOfExpertise,
        instructorExperience: applicationData.experienceYears,
      }, { merge: true }).catch(() => {});
    }

    // Create Admin notification for the new application
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
    await setDoc(doc(db, 'admin_notifications', notifId), notifPayload, { merge: true }).catch(() => {});

    return { success: true, id: appId };
  } catch (error: any) {
    console.error('Error submitting tutor application:', error);
    return { success: false, id: appId, error: error?.message || 'Failed to submit application' };
  }
}

/**
 * Real-time listener for Tutor Applications (Admin Register)
 */
export function subscribeTutorApplications(
  onUpdate: (apps: TutorApplication[]) => void
): () => void {
  const collRef = collection(db, 'tutor_applications');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: TutorApplication[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as TutorApplication));
      list.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Tutor applications subscription notice:', err)
  );
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
    const updatePayload = {
      status,
      feedbackNotes: feedbackNotes || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy || 'StudiRad Admin Team',
    };

    await setDoc(doc(db, 'tutor_applications', applicationId), updatePayload, { merge: true });
    if (appletDb) {
      await setDoc(doc(appletDb, 'tutor_applications', applicationId), updatePayload, { merge: true }).catch(() => {});
    }

    // If approved, update user's role and instructor status
    if (userId) {
      await setDoc(doc(db, 'users', userId), {
        role: status === 'approved' ? 'Clinical Instructor / Tutor' : 'Qualified Radiographer',
        isInstructor: status === 'approved',
        instructorStatus: status,
      }, { merge: true });
    }

    // Notify user
    const notifId = `notif_user_${Date.now()}`;
    const userNotif = {
      id: notifId,
      title: status === 'approved' ? 'Tutor Application Approved! 🎉' : 'Update on Tutor Application',
      message: status === 'approved' 
        ? 'Congratulations! You are now an approved StudiRad Instructor. You can now build courses and offer private 1-on-1 tutorials.' 
        : `Thank you for applying. Feedback from team: ${feedbackNotes || 'Please contact support for guidance.'}`,
      type: 'tutor_application',
      targetRole: 'user',
      targetUserId: userId,
      relatedId: applicationId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'notifications', notifId), userNotif, { merge: true }).catch(() => {});

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
    const payload: TutorialRequest = {
      ...requestData,
      id: reqId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'tutorial_requests', reqId), payload, { merge: true });
    if (appletDb) {
      await setDoc(doc(appletDb, 'tutorial_requests', reqId), payload, { merge: true }).catch(() => {});
    }

    // Notify Admin
    const adminNotifId = `notif_admin_${Date.now()}`;
    const adminNotif = {
      id: adminNotifId,
      title: `Private Tutorial Request: ${requestData.courseTitle}`,
      message: `${requestData.studentName} requested ${requestData.durationMinutes}min session with ${requestData.instructorName} on ${requestData.selectedDay} (${requestData.selectedTimeSlot}). Rate: ${requestData.currency} ${requestData.calculatedRate}.`,
      type: 'tutorial_request',
      targetRole: 'admin',
      relatedId: reqId,
      read: false,
      createdAt: new Date().toISOString(),
      linkTab: 'tutorials',
    };
    await setDoc(doc(db, 'admin_notifications', adminNotifId), adminNotif, { merge: true }).catch(() => {});

    // Notify Instructor if instructorId is set
    if (requestData.instructorId) {
      const instNotifId = `notif_inst_${Date.now()}`;
      const instNotif = {
        id: instNotifId,
        title: `New Tutorial Request: ${requestData.courseTitle}`,
        message: `${requestData.studentName} requested a private session on ${requestData.selectedDay} (${requestData.selectedTimeSlot}). Rate: ${requestData.currency} ${requestData.calculatedRate}.`,
        type: 'tutorial_request',
        targetRole: 'instructor',
        targetUserId: requestData.instructorId,
        relatedId: reqId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', instNotifId), instNotif, { merge: true }).catch(() => {});
    }

    return { success: true, id: reqId };
  } catch (error: any) {
    console.error('Error submitting tutorial request:', error);
    return { success: false, id: reqId, error: error?.message || 'Failed to submit request' };
  }
}

/**
 * Real-time listener for Tutorial Requests
 */
export function subscribeTutorialRequests(
  onUpdate: (requests: TutorialRequest[]) => void
): () => void {
  const collRef = collection(db, 'tutorial_requests');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: TutorialRequest[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as TutorialRequest));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('Tutorial requests subscription notice:', err)
  );
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
    const updatePayload: Partial<TutorialRequest> = {
      status,
      adminFeedback: adminFeedback || '',
      meetingLink: meetingLink || '',
    };
    await setDoc(doc(db, 'tutorial_requests', requestId), updatePayload, { merge: true });

    // Notify Student
    if (studentId) {
      const notifId = `notif_user_${Date.now()}`;
      const userNotif = {
        id: notifId,
        title: status === 'confirmed' ? `Tutorial Session Confirmed! 📅` : `Tutorial Request Update`,
        message: status === 'confirmed'
          ? `Your private session for "${courseTitle || 'Course'}" has been confirmed! Meeting Room: ${meetingLink || 'Check dashboard for details.'}`
          : `Update on your tutorial request for "${courseTitle || 'Course'}": ${adminFeedback || status}`,
        type: 'tutorial_request',
        targetRole: 'user',
        targetUserId: studentId,
        relatedId: requestId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', notifId), userNotif, { merge: true }).catch(() => {});
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
    await setDoc(doc(db, 'courses', courseId), {
      status: 'published',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (creatorId) {
      const notifId = `notif_creator_${Date.now()}`;
      const notif = {
        id: notifId,
        title: 'Course Published! 🚀',
        message: `Your course "${courseTitle || 'New Course'}" has been approved by admin and is now live to all learners!`,
        type: 'course_submission',
        targetRole: 'instructor',
        targetUserId: creatorId,
        relatedId: courseId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', notifId), notif, { merge: true }).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error approving course:', err);
    return { success: false, error: err?.message || 'Failed to approve course' };
  }
}

/**
 * Real-time listener for user/instructor notifications
 */
export function subscribeUserNotifications(
  userId: string,
  onUpdate: (notifications: any[]) => void
): () => void {
  const collRef = collection(db, 'notifications');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.targetUserId === userId || (!data.targetUserId && data.targetRole === 'user')) {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => console.warn('User notifications subscription notice:', err)
  );
}
