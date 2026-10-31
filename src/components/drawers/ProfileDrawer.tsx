import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  FileText
} from 'lucide-react';

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
  const { currentUser, signOut, deleteAccount, setScreen, openAuthWithTab } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [activeModalInfo, setActiveModalInfo] = useState<string | null>(null);

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

            {/* CPD Credits Metric */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#FF7F32]" />
                <span>Verified CPD Credits</span>
              </span>
              <span className="font-bold text-[#002147] dark:text-[#38BDF8] font-mono">
                {(typeof currentUser?.cpdCredits === 'number' ? currentUser.cpdCredits : 0).toFixed(1)} hrs
              </span>
            </div>
          </div>

          {/* Section 1: Learning, Courses & Quizzes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Learning & Records
            </span>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {/* My Courses & Progress */}
              <div 
                onClick={() => setActiveModalInfo('Enrolled Courses: Chest Radiography Mastery (65%), Advanced CT & MRI (20%)')}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#002147] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      My Enrolled Courses (2)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      View ongoing modules & progress
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Edit Specialty Topics */}
              <button
                onClick={onEditTopics}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF7F32] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Learning Interests ({currentUser?.selectedTopics?.length || 0})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Modify recommended specialties
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Quiz History */}
              <div 
                onClick={() => setActiveModalInfo('Quiz History: Clinical Radiography 101 (Score: 5/5, 100% on Oct 21)')}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Quiz Scores & Practice History
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Latest: 5/5 on Diagnostic Challenge
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* My Bookings */}
              <div 
                onClick={() => setActiveModalInfo('My Bookings: 1 session booked with Dr. Marcus Thorne (Tomorrow at 17:00 BST). Join link active in Services tab.')}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      My 1-on-1 Sessions (1)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      View meeting link & tutor notes
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Saved Opportunities */}
              <div 
                onClick={() => setActiveModalInfo('Saved Opportunities: Band 6 Rotational Radiographer at Guy\'s and St Thomas\' NHS')}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Saved Locum & Job Vacancies
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Bookmarked hospital postings
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
                onClick={() => setActiveModalInfo('Help & Academic Support: Reach our clinical education team at support@studirad.org for curriculum questions, CPD certificate verification, and locum recruitment inquiries.')}
                className="p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800">
                  Help & Academic Support
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div 
                onClick={() => setActiveModalInfo('StudiRad Privacy Policy & Terms: We adhere to GDPR and NHS clinical information standards. Your learner records and diagnostic quiz attempts are confidential and protected.')}
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
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-left space-y-3 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#002147]">StudiRad Information</span>
              <button
                onClick={() => setActiveModalInfo(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeModalInfo}
            </p>
            <button
              onClick={() => setActiveModalInfo(null)}
              className="w-full py-2 bg-[#002147] text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
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
              <li className="text-red-700">• All logged CPD points & verified certificates</li>
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
    </div>
  );
};
