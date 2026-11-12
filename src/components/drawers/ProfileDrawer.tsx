import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRequests, PrivateClassRequest } from '../../context/RequestContext';
import { subscribeUserEnrolledCourses, EnrolledCourseRecord } from '../../services/firebaseDataService';
import { 
  X, 
  Award, 
  DownloadCloud, 
  BookOpen, 
  Moon, 
  Sun,
  Bell, 
  ShieldCheck, 
  LogOut, 
  Trash2, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Calendar,
  Bookmark,
  HelpCircle,
  FileCheck2,
  FileText,
  Clock
} from 'lucide-react';
import { TutorApplicationModal } from '../modals/TutorApplicationModal';
import { InstructorStudioModal } from '../modals/InstructorStudioModal';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTopics: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  onEditTopics,
}) => {
  const { currentUser, signOut, deleteAccount, setScreen, openAuthWithTab, setActiveTab } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { requests } = useRequests();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [showTutorAppModal, setShowTutorAppModal] = useState(false);
  const [showInstructorStudioModal, setShowInstructorStudioModal] = useState(false);
  const [activeModalInfo, setActiveModalInfo] = useState<{
    title: string;
    content: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseRecord[]>([]);

  // Real enrolled courses
  useEffect(() => {
    if (currentUser?.id) {
      const unsub = subscribeUserEnrolledCourses(currentUser.id, (records) => {
        setEnrolledCourses(records || []);
      });
      return () => unsub?.();
    } else {
      setEnrolledCourses([]);
    }
  }, [currentUser?.id]);

  // Real scheduled 1-on-1 requests
  const scheduledSessions = requests.filter((r: any): r is PrivateClassRequest => r?.category === 'private_class');

  // Real saved opportunity IDs
  const savedOppIds: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('studirad_saved_opps') || '[]');
    } catch {
      return [];
    }
  })();

  if (!isOpen) return null;

  const topicDisplayNames: Record<string, string> = {
    general_radiography: 'General Radiography',
    ct_mri: 'CT & MRI',
    ultrasound: 'Ultrasound',
    mammography: 'Mammography',
    radiation_protection: 'Radiation Protection',
    research_cpd: 'Research & CPD',
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
    setShowDeleteModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-800 dark:text-slate-100 select-none">
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Slide-out Drawer Container */}
      <div 
        className="relative w-full max-w-sm h-full bg-[#F8FAFC] dark:bg-[#0B0F17] shadow-2xl flex flex-col z-10 overflow-hidden animate-slideLeft border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#121824] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Account & Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold text-base shrink-0">
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.fullName || 'Radiography Professional'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email || 'authenticated'}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#002147] dark:text-blue-300 text-[10px] font-bold">
                  {currentUser?.isGuest ? 'Guest Learner' : currentUser?.role || 'Qualified Radiographer'}
                </span>
              </div>
            </div>

            {/* Enrolled Courses Metric */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#FF7F32]" />
                <span>Enrolled Courses</span>
              </span>
              <span className="font-bold text-[#002147] dark:text-[#38BDF8] font-mono">
                {(currentUser?.courses?.length || currentUser?.enrolledCourseIds?.length || 0)} active
              </span>
            </div>
          </div>

          {/* Be a Tutor / Instructor CTA Card */}
          {currentUser?.isInstructor || currentUser?.role === 'Clinical Instructor / Tutor' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002147] via-[#0A3266] to-[#002147] text-white border border-slate-700 shadow-sm space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF7F32] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7F32] block">
                      Teaching Faculty
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      Instructor Studio
                    </h4>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Approved
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-snug">
                Manage your video courses and 1-on-1 private tutorial student bookings.
              </p>
              <button
                type="button"
                onClick={() => setShowInstructorStudioModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#FF7F32] hover:bg-[#E56A22] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Open Instructor Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : currentUser?.instructorStatus === 'pending' ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Clock className="w-4 h-4 text-[#FF7F32]" />
                <h4 className="text-xs font-bold">
                  Tutor Application Under Review
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Please check your email inbox within <strong>24–72 hours</strong> for verification feedback.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002147] via-[#0A3266] to-[#002147] text-white border border-slate-700 shadow-sm space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF7F32] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7F32] block">
                      Teaching Faculty
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      Be a Tutor / Instructor
                    </h4>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[#FF7F32] text-[10px] font-bold border border-orange-500/30">
                  Join
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-snug">
                Upload specialized courses and offer 1-on-1 private tutorials to radiography scholars.
              </p>
              <button
                type="button"
                onClick={() => setShowTutorAppModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#FF7F32] hover:bg-[#E56A22] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Be a Tutor / Instructor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}


          {/* Section 1: Learning, Courses & Quizzes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Learning & Records
            </span>

            <div className="bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
              {/* My Courses & Progress */}
              <div 
                onClick={() => {
                  if (enrolledCourses.length === 0) {
                    setActiveModalInfo({
                      title: 'Enrolled Courses',
                      content: 'You have not enrolled in any courses yet. Browse the Learn library to start accredited clinical imaging modules.',
                      actionLabel: 'Browse Courses',
                      onAction: () => {
                        onClose();
                        setActiveTab('learn');
                      }
                    });
                  } else {
                    const list = enrolledCourses.map((c, i) => `${i + 1}. ${c.title} — ${c.progressPercent}% complete`).join('\n');
                    setActiveModalInfo({
                      title: `Enrolled Courses (${enrolledCourses.length})`,
                      content: list,
                      actionLabel: 'Go to Learn',
                      onAction: () => {
                        onClose();
                        setActiveTab('learn');
                      }
                    });
                  }
                }}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      My Enrolled Courses ({enrolledCourses.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {enrolledCourses.length === 0 ? 'No courses enrolled yet' : `${enrolledCourses.length} active course${enrolledCourses.length > 1 ? 's' : ''} in progress`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Edit Specialty Topics */}
              <button
                onClick={onEditTopics}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-[#FF7F32] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Learning Interests ({currentUser?.selectedTopics?.length || 0})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentUser?.selectedTopics && currentUser.selectedTopics.length > 0 ? 'Modify selected specialties' : 'No interests selected yet'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Quiz History */}
              <div 
                onClick={() => setActiveModalInfo({
                  title: 'Quiz & Practice History',
                  content: 'No completed quiz attempts recorded yet. You can test your clinical knowledge and radiography recall directly from the Home or Learn tabs.'
                })}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Quiz Scores & Practice History
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Real-time assessment tracking
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* My Bookings */}
              <div 
                onClick={() => {
                  if (scheduledSessions.length === 0) {
                    setActiveModalInfo({
                      title: 'My 1-on-1 Sessions',
                      content: 'No scheduled 1-on-1 sessions. You can submit bespoke tutorial and case critique requests in the Services tab.',
                      actionLabel: 'Book a Session',
                      onAction: () => {
                        onClose();
                        setActiveTab('services');
                      }
                    });
                  } else {
                    const list = scheduledSessions.map((s, i) => `${i + 1}. ${s.subjectTopic} (Status: ${s.status}, Ref: ${s.referenceCode})`).join('\n');
                    setActiveModalInfo({
                      title: `My 1-on-1 Sessions (${scheduledSessions.length})`,
                      content: list,
                      actionLabel: 'View in Services',
                      onAction: () => {
                        onClose();
                        setActiveTab('services');
                      }
                    });
                  }
                }}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      My 1-on-1 Sessions ({scheduledSessions.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {scheduledSessions.length === 0 ? 'No scheduled sessions' : `${scheduledSessions.length} active request${scheduledSessions.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Saved Opportunities */}
              <div 
                onClick={() => {
                  if (savedOppIds.length === 0) {
                    setActiveModalInfo({
                      title: 'Saved Opportunities',
                      content: 'No saved opportunities yet. You can bookmark locum shifts, hospital vacancies, and internships in the Opportunities tab.',
                      actionLabel: 'Browse Opportunities',
                      onAction: () => {
                        onClose();
                        setActiveTab('explore');
                      }
                    });
                  } else {
                    setActiveModalInfo({
                      title: `Saved Opportunities (${savedOppIds.length})`,
                      content: `You have ${savedOppIds.length} bookmarked opportunit${savedOppIds.length > 1 ? 'ies' : 'y'}. Visit the Opportunities tab to view details and apply.`,
                      actionLabel: 'Go to Opportunities',
                      onAction: () => {
                        onClose();
                        setActiveTab('explore');
                      }
                    });
                  }
                }}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Saved Locum & Job Vacancies ({savedOppIds.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {savedOppIds.length === 0 ? 'No saved vacancies' : `${savedOppIds.length} bookmarked`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section 2: App Preferences */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Settings & Offline
            </span>

            <div className="bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
              {/* Dark Contrast */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 flex items-center justify-center">
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Clinical Dark Mode
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Currently {isDark ? 'Active' : 'Off (Light Mode)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  role="switch"
                  aria-checked={isDark}
                  aria-label="Toggle Clinical Dark Mode"
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                    isDark ? 'bg-[#002147] border border-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Push Alerts */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Class & Job Push Alerts
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Reminders before live webinars
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPushEnabled(!pushEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                    pushEnabled ? 'bg-[#FF7F32]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      pushEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Offline Protocols */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <DownloadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Download Over Wi-Fi Only
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Save mobile data on clinical rounds
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setOfflineSync(!offlineSync)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                    offlineSync ? 'bg-[#002147]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      offlineSync ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Legal, Terms & Support */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Legal & Support
            </span>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              <div 
                onClick={() => setActiveModalInfo({
                  title: 'Help & Academic Support',
                  content: 'Reach our clinical education team at support@studirad.org for curriculum questions, CPD certificate verification, and locum recruitment inquiries.'
                })}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800">
                  Help & Academic Support
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div 
                onClick={() => setActiveModalInfo({
                  title: 'Privacy Policy & Terms of Service',
                  content: 'StudiRad adheres to GDPR, NDPR, and healthcare clinical information standards. Only individuals 17 years of age or older are authorized to use the platform. Your learner records and diagnostic quiz attempts are confidential and protected.'
                })}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800">
                  Privacy Policy & Terms of Service
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section 4: Account Actions & App Store Account Deletion */}
          <div className="space-y-1.5 pt-2">
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {/* Faculty & Admin Portal */}
              <button
                onClick={() => {
                  onClose();
                  if (currentUser?.isAdmin) {
                    setScreen('admin');
                  } else {
                    openAuthWithTab('adminLogin');
                  }
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-amber-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Faculty & Admin Portal
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Push courses, classes & opportunities
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Sign Out */}
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    Sign Out of StudiRad
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* App Store Mandated Account Deletion (Guideline 5.1.1(v)) */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-red-600 block">
                      Delete Account
                    </span>
                    <span className="text-[10px] text-slate-400">
                      App Store Guideline 5.1.1(v) Compliant
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK INFO POPUP MODAL */}
      {activeModalInfo && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#121824] rounded-2xl p-5 shadow-2xl text-left space-y-3 animate-scaleIn border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#002147] dark:text-[#38BDF8]">
                {activeModalInfo.title}
              </span>
              <button
                onClick={() => setActiveModalInfo(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {activeModalInfo.content}
            </p>
            <div className="flex items-center gap-2 pt-1">
              {activeModalInfo.actionLabel && (
                <button
                  onClick={() => {
                    activeModalInfo.onAction?.();
                    setActiveModalInfo(null);
                  }}
                  className="flex-1 py-2 bg-[#FF7F32] hover:bg-[#e06820] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {activeModalInfo.actionLabel}
                </button>
              )}
              <button
                onClick={() => setActiveModalInfo(null)}
                className={`${activeModalInfo.actionLabel ? 'px-4' : 'w-full'} py-2 bg-[#002147] dark:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP STORE ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-red-100 flex flex-col text-left animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Delete StudiRad Account?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Pursuant to Apple App Store privacy policies, deleting your account will permanently wipe all stored data:
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1 mb-4 bg-red-50/50 p-3 rounded-xl border border-red-100">
              <li className="text-red-700">• All verified course certificates and learning records</li>
              <li className="text-red-700">• Course progress and clinical quiz submissions</li>
              <li className="text-red-700">• Bookmarked hospital locum vacancies</li>
              <li className="text-red-700">• Scheduled 1-on-1 tutor bookings</li>
            </ul>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-70"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Permanently Delete Account</span>
                )}
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Application Modal */}
      <TutorApplicationModal
        isOpen={showTutorAppModal}
        onClose={() => setShowTutorAppModal(false)}
      />

      {/* Instructor Studio Modal */}
      <InstructorStudioModal
        isOpen={showInstructorStudioModal}
        onClose={() => setShowInstructorStudioModal(false)}
      />
    </div>
  );
};
