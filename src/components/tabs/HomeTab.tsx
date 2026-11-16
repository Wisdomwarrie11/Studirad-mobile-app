import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiveClass, Opportunity, Course } from '../../types';
import { 
  subscribeOpportunities, 
  subscribeClasses, 
  subscribeCourses,
  subscribeUserRegisteredClasses
} from '../../services/firebaseDataService';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { 
  Video, 
  ChevronRight, 
  Gamepad2, 
  FileText, 
  Bot, 
  Clock, 
  Briefcase,
  Building2,
  Calendar,
  GraduationCap
} from 'lucide-react';
import classesImg from '../../assets/images/onboarding_classes_1792606674536.jpg';
import { DashboardSkeleton } from '../common/Skeletons';

interface HomeTabProps {
  onSelectCourse?: (course: any) => void;
  onOpenPlayer?: (course: any) => void;
  onSelectLiveClass: (liveClass: LiveClass) => void;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onStartQuiz: () => void;
  onOpenNotifications?: () => void;
}

// Categories matching web app ClassesPage.tsx:
// const categories = ["X-ray", "Ultrasound", "MRI", "CT", "Nuclear Medicine"];
const CLASS_MODALITIES = ['All', 'X-ray', 'Ultrasound', 'MRI', 'CT', 'Nuclear Medicine'];

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectCourse,
  onSelectLiveClass,
  onSelectOpportunity,
  onStartQuiz,
}) => {
  const { currentUser, setActiveTab, navigateToLearn } = useAuth();
  
  // Real Firestore state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [liveOpps, setLiveOpps] = useState<Opportunity[]>([]);
  const [liveClassesList, setLiveClassesList] = useState<LiveClass[]>([]);
  const [liveCoursesList, setLiveCoursesList] = useState<Course[]>([]);
  const [registeredClassIds, setRegisteredClassIds] = useState<string[]>([]);

  // Real-time subscriptions to Firestore
  useEffect(() => {
    let received = 0;
    const markReceived = () => {
      received++;
      if (received >= 2) {
        setIsLoading(false);
      }
    };

    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 550);

    const unsubOpps = subscribeOpportunities((opps) => {
      setLiveOpps(opps || []);
      markReceived();
    });

    const unsubCls = subscribeClasses((cls) => {
      setLiveClassesList(cls || []);
      markReceived();
    });

    const unsubCourses = subscribeCourses((courses) => {
      setLiveCoursesList(courses || []);
      markReceived();
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubOpps?.();
      unsubCls?.();
      unsubCourses?.();
    };
  }, []);

  // Listen strictly to authenticated user's real registered classes
  useEffect(() => {
    if (currentUser?.id && !currentUser.isGuest) {
      const unsubRegistered = subscribeUserRegisteredClasses(currentUser.id, (ids) => {
        setRegisteredClassIds(ids || []);
      });
      return () => unsubRegistered?.();
    } else {
      setRegisteredClassIds([]);
    }
  }, [currentUser?.id, currentUser?.isGuest]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = currentUser?.fullName?.split(' ')[0] || 'Radiographer';

  // Show Registered Cohort ONLY if authenticated user actually registered for a real class
  const registeredClass = useMemo(() => {
    if (!currentUser || currentUser.isGuest) return undefined;
    return liveClassesList.find((c) => registeredClassIds.includes(c.id));
  }, [currentUser, liveClassesList, registeredClassIds]);

  // Upcoming live classes
  const upcomingClasses = useMemo(() => {
    return liveClassesList.filter((c) => c.cohortStatus !== 'completed' && c.status === 'published').slice(0, 2);
  }, [liveClassesList]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col pb-28 select-none overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-6 sm:space-y-8">
        
        {/* ================= 1. PERSONALIZED DASHBOARD HEADER ================= */}
        <section className="text-left space-y-3">
          {/* Greeting & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002147] dark:text-white tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
              Keep growing. Your clinical development is right on track.
            </p>
          </div>
       

          {/* ================= HERO: TRANSFORM YOUR RADIOGRAPHY JOURNEY ================= */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-sm group border border-slate-200/80 dark:border-slate-800">
            <div className="relative h-44 sm:h-52 w-full bg-[#002147] overflow-hidden">
              <img
                src="/transform_radiography.jpg"
                alt="Transform your radiography journey"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-85"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = classesImg;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/95 via-[#002147]/50 to-transparent flex flex-col justify-end p-5 text-left">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#FF7F32] flex items-center gap-1.5 mb-1">
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Transform your radiography journey
                </h2>
              </div>
            </div>
          </div>

          {/* ================= REGISTERED COHORT (ONLY IF USER ACTUALLY REGISTERED) ================= */}
          {registeredClass && (
            <div
              onClick={() => onSelectLiveClass(registeredClass)}
              className="w-full bg-white dark:bg-[#121824] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-[#002147] dark:hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF7F32] animate-pulse"></span>
                  Your Registered Cohort
                </span>
                <span className="text-xs font-bold text-[#002147] dark:text-[#38BDF8]">
                  {registeredClass.category || 'Live Cohort'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                {registeredClass.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                Instructor: {registeredClass.instructor} · {registeredClass.date || registeredClass.time || 'Upcoming Session'}
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tap to access live class details</span>
                <span className="font-bold text-[#FF7F32] flex items-center gap-1">
                  <span>Enter Cohort</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Quick Access Shortcuts Grid */}
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <button
              onClick={() => navigateToLearn('classes')}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5 text-[#FF7F32]" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Classes
              </span>
            </button>

            <button
              onClick={() => navigateToLearn('materials')}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Materials
              </span>
            </button>

            <button
              onClick={() => setActiveTab('aiTutor')}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                AI Tutor
              </span>
            </button>

            <button
              onClick={onStartQuiz}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-5 h-5 text-[#FF7F32]" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Game
              </span>
            </button>
          </div>
        </section>

        {/* ================= 2. TOP COURSES (REAL DATA FROM FIRESTORE) ================= */}
        <section className="text-left space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Top courses
            </h2>
            <button
              onClick={() => navigateToLearn('courses')}
              className="text-xs sm:text-sm font-semibold text-[#002147] dark:text-[#38BDF8] hover:text-[#FF7F32] transition-colors"
            >
              Browse
            </button>
          </div>

          {liveCoursesList.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {liveCoursesList.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onSelectCourse ? onSelectCourse(course) : navigateToLearn('courses')}
                  className="w-[calc(50%-6px)] min-w-[155px] max-w-[195px] sm:w-[220px] shrink-0 bg-white dark:bg-[#121824] rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:border-[#002147] dark:hover:border-slate-600 transition-all group"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
                      <img
                        src={(course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null) || course.image || classesImg}
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = classesImg;
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-xs text-white">
                          {course.level || 'Course'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mt-2 leading-snug group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      <GraduationCap className="w-3 h-3 text-[#FF7F32] shrink-0" />
                      <span className="truncate">{course.instructor || 'Faculty'}</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#002147] dark:text-[#38BDF8]">
                      {course.price || 'Free'}
                    </span>
                    <span className="text-[11px] font-bold text-[#FF7F32] group-hover:underline flex items-center gap-0.5">
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6 text-[#FF7F32]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                No courses for now or no course uploaded
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                When courses are uploaded from the admin side, they will be reflected here and in the course page.
              </p>
            </div>
          )}
        </section>

        {/* ================= 4. UPCOMING CLASSES ================= */}
        <section className="text-left space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Upcoming Classes
            </h2>
            <button
              onClick={() => setActiveTab('learn')}
              className="text-xs sm:text-sm font-semibold text-[#002147] dark:text-[#38BDF8] hover:text-[#FF7F32] transition-colors"
            >
              Schedule
            </button>
          </div>

          {upcomingClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingClasses.map((cls) => {
                const isComingSoon = cls.cohortStatus === 'coming-soon' || cls.status === 'coming-soon';
                return (
                <div
                  key={cls.id}
                  onClick={() => onSelectLiveClass(cls)}
                  className="w-full bg-[#002147] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="relative z-10 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isComingSoon ? 'bg-blue-400' : 'bg-[#FF7F32] animate-pulse'}`}></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                          {isComingSoon ? 'Coming Soon' : 'Upcoming Live'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium">
                        {cls.category || cls.level || 'Cohort'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                        {cls.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-0.5 line-clamp-1">
                        Instructor: {cls.instructor}
                      </p>
                    </div>

                    <div className="pt-2.5 flex items-center justify-between border-t border-white/15 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Clock className="w-4 h-4 text-[#FF7F32] shrink-0" />
                        <span>{cls.date || cls.time || 'Upcoming Cohort'}</span>
                      </div>

                      {isComingSoon ? (
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1.5 rounded-xl bg-white/15 text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-not-allowed opacity-80"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Coming Soon</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLiveClass(cls);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span>View Class</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No upcoming live cohorts scheduled right now.
              </p>
            </div>
          )}
        </section>

        {/* ================= 5. LATEST OPPORTUNITIES ================= */}
        <section className="text-left space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#002147] dark:text-[#38BDF8]" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Latest Opportunities
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('explore')}
              className="text-xs sm:text-sm font-semibold text-[#002147] dark:text-[#38BDF8] hover:text-[#FF7F32] transition-colors"
            >
              View all
            </button>
          </div>

          {/* Simple Cards with Little Snippets of Info from Firestore */}
          {liveOpps && liveOpps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveOpps.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  onClick={() => onSelectOpportunity(job)}
                  className="w-full bg-white dark:bg-[#121824] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] dark:hover:border-slate-600 transition-all cursor-pointer group text-left space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {job.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {job.deadline}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{job.organisation}</span>
                    <span>·</span>
                    <span>{job.location}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-[#002147] dark:text-[#38BDF8]">
                      {job.rate}
                    </span>
                    <span className="text-xs font-semibold text-[#002147] dark:text-[#38BDF8] flex items-center gap-0.5">
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <Briefcase className="w-6 h-6 text-slate-400 mx-auto" />
              <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                No opportunities posted yet
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                New clinical posts and locums will appear here automatically.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
