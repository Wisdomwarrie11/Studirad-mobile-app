export type AppScreen = 'splash' | 'onboarding' | 'auth' | 'personalise' | 'completed' | 'app' | 'admin' | 'adminAuth';

export type AuthMode = 'signIn' | 'signUp' | 'adminLogin' | 'forgotPassword' | 'verifyEmail';

export type NavTab = 'home' | 'learn' | 'search' | 'aiTutor' | 'services' | 'explore' | 'profile' | 'game';

export type ClinicalModality = 
  | 'all' 
  | 'xray' 
  | 'mri' 
  | 'ultrasound' 
  | 'ct' 
  | 'anatomy' 
  | 'hospital_practice' 
  | 'rad_physics';

export type ProfessionalRole = 
  | 'Radiography Student' 
  | 'Qualified Radiographer' 
  | 'Imaging Technologist' 
  | 'Clinical Educator' 
  | 'Radiology Resident'
  | 'Clinical Instructor / Tutor'
  | 'Guest Explorer'
  | 'Administrator';

export interface UserProfile {
  id: string;
  email: string;
  emailVerified?: boolean;
  fullName: string;
  role: ProfessionalRole;
  selectedTopics: string[];
  isGuest: boolean;
  isAdmin?: boolean;
  isInstructor?: boolean;
  instructorStatus?: 'none' | 'pending' | 'approved';
  instructorBio?: string;
  instructorAcademicBackground?: string;
  instructorExpertise?: string[];
  instructorExperience?: string;
  institution?: string;
  avatarUrl?: string;
  createdAt: string;
  cpdCredits?: number;
  gameScore?: number;
  bestStreak?: number;
  gamesSolved?: number;
  gameStats?: {
    fill_blank: { score: number; solved: number };
    word_scramble: { score: number; solved: number };
    memory_match: { score: number; solved: number };
    true_false: { score: number; solved: number };
    lastPlayedAt?: string;
  };
  enrolledCourseIds?: string[];
  courses?: EnrolledCourseRecord[];
  savedOpportunityIds?: (number | string)[];
  quizScores?: { quizTitle: string; score: number; total: number; date: string }[];
  bookings?: TutorBooking[];
}

export interface TutorApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  bio: string;
  academicBackground: string;
  areaOfExpertise: string[];
  experienceYears: string;
  summary: string;
  phone?: string;
  country?: string;
  academicQualification?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string | number;
  reviewedAt?: string | number;
  reviewedBy?: string;
  feedbackNotes?: string;
}

export interface TutorAvailability {
  enabled: boolean;
  days: string[];
  timeSlots: string[];
  minDurationMinutes: number; // 30
  maxDurationMinutes: number; // 60
  ratePer30Min: number; // base charge for 30 minutes
  currency: string;
  instructorBioSnippet?: string;
}

export interface TutorialRequest {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorId?: string;
  instructorName: string;
  instructorPhone?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  selectedDay: string;
  selectedTimeSlot: string;
  durationMinutes: number; // 30, 45, 60
  calculatedRate: number; // ratePer30Min * (durationMinutes / 30)
  currency: string;
  specificFocusTopic: string;
  status: 'pending' | 'confirmed' | 'completed' | 'declined';
  createdAt: string | number;
  adminFeedback?: string;
  meetingLink?: string;
  sharedWithInstructor?: boolean;
  notifiedInstructorAt?: string;
}

export type PrivateClassCategory =
  | 'X-Ray & Plain Film'
  | 'CT Imaging'
  | 'MRI Physics & Protocols'
  | 'Ultrasound & Sonography'
  | 'Radiographic Anatomy'
  | 'Radiation Physics'
  | 'Exam & Board Prep';

export interface PrivateClass {
  id: string;
  title: string;
  category: PrivateClassCategory;
  level: string;
  image?: string;
  daysAvailable: string[]; // Max 3 days per week enforced
  timeSlots: string[];
  durationMinutes: number; // Max 120 minutes (2 hours) enforced
  overview: string;
  introVideoUrl: string; // Instructor promise video shown before final request/payment
  instructorId?: string;
  instructorName: string;
  instructorRole: string;
  instructorBio: string; // Details about instructor in relation to this class/title
  academicExperience: string;
  rating: number;
  reviewsCount?: number | string;
  instructorPhone?: string; // WhatsApp contact for admin dual notification
  chargePerHourNGN: number;
  chargePerHourUSD: number;
  monthlyChargeNGN: number;
  monthlyChargeUSD: number;
  creatorId?: string;
  creatorRole?: 'admin' | 'instructor';
  status: 'published' | 'pending_approval';
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface PrivateClassBookingRequest {
  id: string;
  referenceCode: string;
  classId: string;
  classTitle: string;
  classCategory: string;
  classLevel: string;
  instructorId?: string;
  instructorName: string;
  instructorPhone?: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentRole?: string;
  planType: 'per_day' | 'monthly';
  selectedDays: string[];
  selectedTimeSlot: string;
  startDate: string; // ISO YYYY-MM-DD, enforced >= today + 2 days
  durationMinutes: number;
  amountNGN: number;
  amountUSD: number;
  displayCurrency: 'NGN' | 'USD';
  notes?: string;
  videoWatched: boolean;
  status: 'New Request' | 'Under Review' | 'Instructor Notified' | 'Scheduled' | 'In Progress' | 'Completed' | 'Declined';
  sharedWithInstructor: boolean;
  notifiedInstructorAt?: string;
  adminFeedback?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'tutor_application' | 'course_submission' | 'course_approval' | 'course' | 'tutorial_request' | 'class' | 'job' | 'system' | 'quiz' | 'booking';
  targetRole?: 'admin' | 'instructor' | 'user';
  targetUserId?: string;
  relatedId?: string;
  read: boolean;
  createdAt?: string | number;
  timestamp?: string;
  linkTab?: string;
  actionTarget?: { tab: NavTab; itemId?: string };
}

export type RatableContentType = 'course' | 'private_class' | 'live_class' | 'material';

export interface ContentRating {
  id: string;
  itemType: RatableContentType;
  itemId: string;
  userId: string;
  userName?: string;
  score: number;
  updatedAt: string;
}

export interface EnrolledCourseRecord {
  courseId: string;
  title: string;
  instructor?: string;
  image?: string;
  videoUrl?: string;
  duration?: string;
  cpdCredits?: string;
  modality?: ClinicalModality;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  enrolledAt: string;
  lastAccessedAt?: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  moduleCount: number;
}

export interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
}

export interface CourseMaterialLink {
  id: string;
  title: string;
  url: string;
  type?: 'pdf' | 'doc' | 'link' | 'video';
  size?: string;
}

export interface CourseQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  videoDurationSec?: number;
  completed: boolean;
  type: 'video' | 'pdf' | 'interactive';
  summary?: string;
  materials?: CourseMaterialLink[];
  links?: CourseMaterialLink[];
  quiz?: CourseQuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  institution: string;
  instructor: string;
  instructorRole: string;
  rating: number;
  reviewsCount: string;
  learners: string;
  duration: string;
  level: string;
  category: string;
  cpdCredits: string;
  price: string;
  isFree: boolean;
  overview: string;
  description?: string;
  learningOutcomes: string[];
  image: string;
  videoUrl?: string;
  modules: CourseModule[];
  materials?: CourseMaterialLink[];
  links?: CourseMaterialLink[];
  quiz?: CourseQuizQuestion[];
  progressPercent?: number;
  likes?: number;
  modality?: ClinicalModality;
  status?: 'published' | 'pending_approval' | 'draft';
  tutorAvailability?: TutorAvailability;
  creatorId?: string;
  creatorRole?: 'admin' | 'instructor';
  creatorName?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface LiveClass {
  id: string;
  title: string;
  instructor?: string;
  instructorRole?: string;
  date?: string;
  time?: string;
  duration?: string;
  isLiveNow?: boolean;
  isRegistered?: boolean;
  cpdCredits?: string;
  description?: string;
  requirements?: string[];
  relatedMaterials?: string[];
  meetingLink?: string;
  registerLink?: string;
  registrationLink?: string;
  modality?: ClinicalModality | string;
  category?: string;
  image?: string;
  thumbnail?: string;
  price?: string;
  isPaid?: boolean;
  level?: string;
  venue?: string;
  hasCustomRegistration?: boolean;
  customConfirmationMessage?: string;
  features?: string[];
  technologies?: string[];
  status?: 'published' | 'upcoming' | 'completed' | 'coming-soon' | string;
  cohortStatus?: 'upcoming' | 'completed' | 'coming-soon' | string;
  whatYouWillLearn?: string[];
  rating?: number;
  reviewsCount?: number | string;
  createdAt?: number | string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  course: string;
  uploader: string;
  link: string;
  type: 'pdf' | 'document' | 'video' | 'link' | string;
  thumbnailUrl?: string;
  createdAt?: any;
  description?: string;
  fileSize?: string;
  status?: 'published' | 'pending_approval';
  rating?: number;
  reviewsCount?: number | string;
}

export interface ClinicalResource {
  id: string;
  title: string;
  category: string;
  format: 'PDF' | 'Checklist' | 'Guideline' | 'Slide Deck' | string;
  size: string;
  description: string;
  downloadUrl?: string;
  modality?: ClinicalModality;
  uploader?: string;
  course?: string;
  link?: string;
  type?: string;
  thumbnailUrl?: string;
  status?: 'published' | 'pending_approval';
  rating?: number;
  reviewsCount?: number | string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clinicalTip: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  durationMin: number;
  questionCount: number;
  questions: QuizQuestion[];
}

export interface Tutor {
  id: string;
  name: string;
  role: string;
  hospital: string;
  specialties: string[];
  hourlyRate: string;
  rating: number;
  reviewCount: number;
  bio: string;
  availableDays: string[];
  avatar: string;
}

export interface TutorBooking {
  id: string;
  tutorName: string;
  tutorRole: string;
  topic: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  meetingUrl: string;
}

export interface ResearchService {
  id: string;
  title: string;
  category: string;
  price: string;
  turnaround: string;
  description: string;
  deliverables: string[];
}

export interface Opportunity {
  id: number | string;
  title: string;
  organisation: string;
  location: string;
  type: 'NHS Locum' | 'Permanent' | 'Internship' | 'Scholarship' | 'Full-time' | string;
  rate: string;
  specialty: string;
  deadline: string;
  experienceLevel: string;
  urgent: boolean;
  description: string;
  requirements: string[];
  howToApply: string;
  modality?: ClinicalModality;
  link?: string;
  contactInfo?: string;
  opportunityType?: 'job' | 'internship' | 'scholarship' | string;
  sourceCollection?: string;
}

export interface Webinar {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  duration: string;
  date: string;
  views: string;
  rating: number;
  cpdCredits: string;
  description: string;
  videoUrl?: string;
  thumbnail: string;
  modality?: ClinicalModality;
}

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  readTime: string;
  publishedAt: string;
  category: string;
  summary: string;
  content: string;
  image?: string;
}

export interface LocumLocation {
  state: string;
  lgas: string[];
}

export interface LocumProfile {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  gender: 'Male' | 'Female';
  minCharge: number;
  maxHours: number;
  availability: string[];
  locations: LocumLocation[];
  isAvailable: boolean; // Open to Work toggle
  isOpenToWork?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface JobListing {
  id?: string;
  title: string;
  organization: string;
  location: string;
  type: string;
  postedAt?: string;
  deadline?: string;
  description?: string;
  requirements?: string[];
  salaryOrAmount?: string;
  contactInfo?: string;
  link?: string;
  specialty?: string;
}

