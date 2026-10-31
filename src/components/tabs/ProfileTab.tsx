import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests, PrivateClassRequest } from '../../context/RequestContext';
import { 
  subscribeUserCompletedClasses, 
  UserCompletedRecord, 
  subscribeCourses, 
  subscribeUserEnrolledCourses, 
  EnrolledCourseRecord,
  subscribeOpportunities
} from '../../services/firebaseDataService';
import { subscribeLocumProfile, toggleLocumAvailability } from '../../services/locumService';
import { LocumProfile, Course, Opportunity } from '../../types';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { 
  Award, 
  BookOpen, 
  LogOut, 
  Trash2, 
  AlertTriangle,
  ChevronRight,
  GraduationCap,
  Calendar,
  Clock,
  Briefcase,
  Bookmark,
  Power,
  Play,
  Smartphone,
  ExternalLink,
  MapPin,
  Building2
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { ProfileSkeleton } from '../common/Skeletons';
import { PlayStoreModal } from '../modals/PlayStoreModal';

interface ProfileTabProps {
  onEditTopics: () => void;
  onOpenPlayer?: (course: Course) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onEditTopics, onOpenPlayer }) => {
  const { currentUser, signOut, deleteAccount, setScreen, setActiveTab } = useAuth();
  const { requests } = useRequests();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedClasses, setCompletedClasses] = useState<UserCompletedRecord[]>([]);
  const [locumProfile, setLocumProfile] = useState<LocumProfile | null>(null);
  const [togglingLocum, setTogglingLocum] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseRecord[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedOppIds, setSavedOppIds] = useState<(string | number)[]>([]);
  const [showPlayStoreModal, setShowPlayStoreModal] = useState(false);

  // Smooth perceived performance transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Real completed classes from Firestore
  useEffect(() => {
    if (currentUser?.id) {
      const unsub = subscribeUserCompletedClasses(currentUser.id, (records) => {
        setCompletedClasses(records || []);
      });
      return () => unsub?.();
    }
  }, [currentUser?.id]);

  // Real locum profile from Firestore
  useEffect(() => {
    if (currentUser?.email) {
      const unsub = subscribeLocumProfile(currentUser.email, (prof) => {
        setLocumProfile(prof);
      });
      return () => unsub?.();
    }
  }, [currentUser?.email]);

  // Real courses for enrolled verification
  useEffect(() => {
    const unsub = subscribeCourses((list) => {
      setCourses(list || []);
    });
    return () => unsub?.();
  }, []);

  // Real user enrolled courses from Firestore
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

  // Real opportunities & user saved bookmarks
  useEffect(() => {
    const unsub = subscribeOpportunities((list) => {
      setOpportunities(list || []);
    });
    try {
      const saved = JSON.parse(localStorage.getItem('studirad_saved_opps') || '[]');
      setSavedOppIds(saved);
    } catch {
      setSavedOppIds([]);
    }
    return () => unsub?.();
  }, []);

  const handleToggleLocum = async () => {
    if (!currentUser?.email) return;
    setTogglingLocum(true);
    const nextState = locumProfile ? !locumProfile.isAvailable : true;
    await toggleLocumAvailability(currentUser.email, nextState);
    setTogglingLocum(false);
  };

  const topicDisplayNames: Record<string, string> = {
    xray: 'X-Ray & Plain Film',
    ct: 'Computed Tomography (CT)',
    mri: 'Magnetic Resonance Imaging (MRI)',
    ultrasound: 'Ultrasound & Sonography',
    anatomy: 'Sectional Radiographic Anatomy',
    hospital_practice: 'Hospital Practice & Governance',
    rad_physics: 'Radiation Physics & IR(ME)R',
    general_radiography: 'General Radiography',
    ct_mri: 'CT & MRI',
    radiation_protection: 'Radiation Protection',
    research_cpd: 'Research & Academic CPD',
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const cpdHours = typeof currentUser?.cpdCredits === 'number' ? currentUser.cpdCredits : 0;
  const userJoinedDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'Recently';

  // Filter real scheduled private tutoring / 1-on-1 requests
  const scheduledSessions = requests.filter((r: any): r is PrivateClassRequest => r?.category === 'private_class');

  // Filter real saved opportunities
  const savedOpportunitiesList = opportunities.filter((opp) => savedOppIds.includes(opp.id));

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 flex flex-col pb-32 select-none text-left">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-6">
        
        {/* Top Header */}
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002147] dark:text-white tracking-tight">
            Account & Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time verified CPD records, enrolled courses, and clinical affiliations
          </p>
        </header>

        {/* Responsive Full-Width Layout: 2 Columns on Tablet / Laptop, 1 Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN (Profile Card, CPD, Interests, Locum, Settings) ================= */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. User Identity Card */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#002147] to-[#0A3266] text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0 ring-4 ring-white dark:ring-[#1E293B]">
                  {currentUser?.fullName
                    ?.split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('') || 'SR'}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {currentUser?.fullName || 'Radiography Professional'}
                  </h2>
                  <p className="text-xs text-[#002147] dark:text-[#38BDF8] font-semibold mt-0.5 truncate">
                    {currentUser?.role || 'Qualified Radiographer'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {currentUser?.email || 'scholar@studirad.org'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Member since {userJoinedDate}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Account Active
                </span>
              </div>
            </div>

            {/* 2. Verified CPD Credits Card */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#FF7F32]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Verified CPD Credits
                    </h3>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {cpdHours.toFixed(1)} CPD Points
                    </span>
                  </div>
                </div>

                {cpdHours > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                    Verified
                  </span>
                )}
              </div>

              {cpdHours > 0 ? (
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#002147] to-[#FF7F32] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cpdHours / 30) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Credits earned towards your statutory annual professional development record.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No CPD credits earned yet. Complete accredited classes or courses in the Learn tab to earn verifiable credits.
                </p>
              )}
            </div>

            {/* 3. Learning Interests & Specialties */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#002147] dark:text-[#38BDF8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Learning Interests
                  </h3>
                </div>
                <button
                  onClick={onEditTopics}
                  className="text-xs font-bold text-[#FF7F32] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {currentUser?.selectedTopics && currentUser.selectedTopics.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.selectedTopics.map((topicId) => (
                    <span
                      key={topicId}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      {topicDisplayNames[topicId] || topicId}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    No learning interests selected yet.
                  </p>
                  <button
                    onClick={onEditTopics}
                    className="text-xs font-bold text-[#002147] dark:text-[#38BDF8]"
                  >
                    + Add Interests
                  </button>
                </div>
              )}
            </div>

            {/* 4. Locum & Opportunity Network Status */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    locumProfile?.isAvailable
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Open to Work (Locum Network)
                    </h3>
                    <span className={`text-[11px] font-bold ${
                      locumProfile?.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                    }`}>
                      {locumProfile ? (locumProfile.isAvailable ? 'Available for Shifts' : 'Currently Offline') : 'Not Registered'}
                    </span>
                  </div>
                </div>

                {locumProfile ? (
                  <button
                    onClick={handleToggleLocum}
                    disabled={togglingLocum}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      locumProfile.isAvailable
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {locumProfile.isAvailable ? 'Go Offline' : 'Go Online'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="px-3 py-1.5 rounded-xl bg-[#002147] text-white text-xs font-bold"
                  >
                    Register
                  </button>
                )}
              </div>
            </div>

            {/* 5. Settings & Account Preferences */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="px-1 pt-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Settings & Preferences
                </h3>
              </div>

              {/* Theme Mode Option */}
              <ThemeToggle variant="expanded" />

              {/* Google Play Store & Direct Install */}
              <button
                onClick={() => setShowPlayStoreModal(true)}
                className="w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF7F32]" />
                  <span>Google Play & App Install</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Ready
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Account Actions */}
              <div className="pt-1 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => signOut()}
                  className="w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-slate-400" />
                    <span>Sign Out</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Delete Account</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (Enrolled Courses, Classes, Sessions, Saved Jobs) ================= */}
          <div className="lg:col-span-7 space-y-5">
            {/* 6. Enrolled Courses (Real Firestore Data) */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#002147] dark:text-[#38BDF8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Enrolled Courses ({enrolledCourses.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('learn');
                  }}
                  className="text-xs font-bold text-[#FF7F32] hover:underline"
                >
                  Browse
                </button>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 text-center space-y-2">
                  <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No courses enrolled yet
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Explore available courses in the Learn library to begin your accredited clinical development.
                  </p>
                  <button
                    onClick={() => setActiveTab('learn')}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#002147] hover:bg-[#002e63] dark:bg-[#FF7F32] dark:hover:bg-[#ff8f4a] text-white font-bold text-xs transition-colors"
                  >
                    Explore Courses
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((enr) => {
                    const matchingCourse = courses.find((c) => c.id === enr.courseId);
                    const thumb = (matchingCourse?.videoUrl ? getYouTubeThumbnail(matchingCourse.videoUrl) : null) || matchingCourse?.image || enr.image || '/artifacts.jpeg';

                    return (
                      <div 
                        key={enr.courseId} 
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 space-y-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                            <img 
                              src={thumb} 
                              alt={enr.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/artifacts.jpeg';
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {enr.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {enr.instructor || 'StudiRad Faculty'} {enr.duration ? `· ${enr.duration}` : ''}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              if (matchingCourse && onOpenPlayer) {
                                onOpenPlayer(matchingCourse);
                              } else {
                                setActiveTab('learn');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#002147] hover:bg-[#001733] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Resume</span>
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Course Progress</span>
                            <span className="font-bold text-[#FF7F32]">{enr.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#FF7F32] transition-all duration-300"
                              style={{ width: `${Math.max(5, enr.progressPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 7. Completed Classes History */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#002147] dark:text-[#38BDF8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Registered / Completed Classes ({completedClasses.length})
                  </h3>
                </div>
              </div>

              {completedClasses.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No completed classes logged yet.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {completedClasses.map((rec, idx) => (
                    <div
                      key={rec.classId || idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                          {rec.title}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {rec.cpdCredits || '1.0 CPD Point'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="uppercase font-semibold text-[#002147] dark:text-[#38BDF8]">{rec.modality || 'General'}</span>
                        <span>{new Date(rec.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 8. Scheduled 1-on-1 Sessions */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF7F32]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Scheduled 1-on-1 Sessions ({scheduledSessions.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-xs font-bold text-[#002147] dark:text-[#38BDF8] hover:underline"
                >
                  Book
                </button>
              </div>

              {scheduledSessions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No scheduled 1-on-1 sessions. You can book bespoke private tutorials with senior radiographers in the Services tab.
                </p>
              ) : (
                <div className="space-y-2">
                  {scheduledSessions.map((session: PrivateClassRequest) => (
                    <div key={session.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white truncate">{session.subjectTopic}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">{session.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Format: {session.preferredFormat || 'Online 1-on-1'} · Ref: {session.referenceCode}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 9. Saved Locum & Job Vacancies */}
            <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#FF7F32]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Saved Opportunities ({savedOpportunitiesList.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="text-xs font-bold text-[#002147] dark:text-[#38BDF8] hover:underline"
                >
                  Explore
                </button>
              </div>

              {savedOpportunitiesList.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No saved opportunities yet. Bookmark hospital locum positions and internships in the Opportunities tab.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {savedOpportunitiesList.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => setActiveTab('explore')}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {opp.title}
                        </h4>
                        <span className="text-[10px] font-bold text-[#FF7F32] shrink-0">
                          {opp.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {opp.organisation}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {opp.location}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121824] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This will permanently delete your user profile, saved CPD records, and class registrations.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play Store & PWA Install Modal */}
      <PlayStoreModal
        isOpen={showPlayStoreModal}
        onClose={() => setShowPlayStoreModal(false)}
      />
    </div>
  );
};
