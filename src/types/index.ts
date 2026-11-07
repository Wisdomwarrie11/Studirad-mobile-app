export type AppScreen = 'splash' | 'onboarding' | 'auth' | 'personalise' | 'completed' | 'app' | 'admin' | 'adminAuth';

export type AuthMode = 'signIn' | 'signUp' | 'adminLogin' | 'forgotPassword';

export type NavTab = 'home' | 'learn' | 'search' | 'aiTutor' | 'services' | 'explore' | 'profile';

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
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'tutor_application' | 'course_submission' | 'tutorial_request' | 'class' | 'job' | 'system' | 'quiz' | 'booking';
  targetRole?: 'admin' | 'instructor' | 'user';
  targetUserId?: string;
  relatedId?: string;
  read: boolean;
  createdAt?: string | number;
  timestamp?: string;
  linkTab?: string;
  actionTarget?: { tab: NavTab; itemId?: string };
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

