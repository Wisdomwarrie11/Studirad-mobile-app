import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiveClass, Opportunity, StudyMaterial, Course } from '../../types';
import { 
  subscribeOpportunities, 
  subscribeClasses, 
  subscribeStudyMaterials,
  subscribeCourses,
  subscribeUserCompletedClasses,
  UserCompletedRecord
} from '../../services/firebaseDataService';
import { MaterialReaderModal } from '../modals/MaterialReaderModal';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { 
  Video, 
  ChevronRight, 
  Play, 
  FileText, 
  Bot, 
  HelpCircle, 
  Clock, 
  Briefcase,
  Building2,
  Calendar,
  Sparkles,
  BookOpen,
  CheckCircle2,
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
  const [studyMaterialsList, setStudyMaterialsList] = useState<StudyMaterial[]>([]);
  const [userCompletedClasses, setUserCompletedClasses] = useState<UserCompletedRecord[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('All');
  const [selectedMaterialForReader, setSelectedMaterialForReader] = useState<StudyMaterial | null>(null);

  // Real-time subscriptions to Firestore
  useEffect(() => {
    let received = 0;
    const markReceived = () => {
      received++;
      if (received >= 2) {
        setIsLoading(false);
      }
    };

    // Fast safety fallback ensures skeleton smoothly transitions even if Firestore snapshot takes time
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

    const unsubMats = subscribeStudyMaterials((mats) => {
      setStudyMaterialsList(mats || []);
      markReceived();
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubOpps?.();
      unsubCls?.();
      unsubCourses?.();
      unsubMats?.();
    };
  }, []);

  // Listen to user's real completed classes
  useEffect(() => {
    if (currentUser?.id) {
      const unsubUser = subscribeUserCompletedClasses(currentUser.id, (records) => {
        setUserCompletedClasses(records || []);
      });
      return () => unsubUser?.();
    }
  }, [currentUser?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = currentUser?.fullName?.split(' ')[0] || 'Radiographer';

  // Check for REAL user learning in progress:
  // 1. If user has completed classes in Firestore
  // 2. Or if user is registered for a live class
  const registeredClass = liveClassesList.find((c) => c.isRegistered);
  const latestCompletedClass = userCompletedClasses[0];

  // Recommended items from real Firestore (Live Classes or Study Materials - NO fake courses)
  const recommendedItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      category: string;
      image?: string;
      type: 'class' | 'material';
      subtitle: string;
      originalData: LiveClass | StudyMaterial;
    }> = [];

    // Prioritize published upcoming classes
    const upcoming = liveClassesList.filter((c) => c.cohortStatus !== 'completed' && c.status === 'published');
    upcoming.slice(0, 2).forEach((cls) => {
      items.push({
        id: `rec_cls_${cls.id}`,
        title: cls.title,
        category: cls.category || 'Live Cohort',
        image: cls.image || cls.thumbnail,
        type: 'class',
        subtitle: `${cls.instructor} · ${cls.date || cls.time || 'Live Class'}`,
        originalData: cls,
      });
    });

    // If fewer than 2 upcoming classes, fill with study materials
    if (items.length < 2) {
      studyMaterialsList.slice(0, 2 - items.length).forEach((mat) => {
        items.push({
          id: `rec_mat_${mat.id}`,
          title: mat.title,
          category: mat.course || 'Study Material',
          image: mat.thumbnailUrl,
          type: 'material',
          subtitle: `${mat.uploader} · ${mat.type === 'video' ? 'Video Lecture' : 'Document'}`,
          originalData: mat,
        });
      });
    }

    return items;
  }, [liveClassesList, studyMaterialsList]);

  // Classes filtered by selected modality
  const modalityFilteredClasses = useMemo(() => {
    if (selectedModality === 'All') {
      return liveClassesList.slice(0, 4);
    }
    return liveClassesList.filter((cls) => {
      const cat = (cls.category || cls.modality || '').toLowerCase();
      return cat.includes(selectedModality.toLowerCase());
    });
  }, [selectedModality, liveClassesList]);

  // Upcoming live classes
  const upcomingClasses = useMemo(() => {
    return liveClassesList.filter((c) => c.cohortStatus !== 'completed' && c.status === 'published').slice(0, 2);
  }, [liveClassesList]);

  const handleRecommendedClick = (item: (typeof recommendedItems)[0]) => {
    if (item.type === 'class') {
      onSelectLiveClass(item.originalData as LiveClass);
    } else {
      setSelectedMaterialForReader(item.originalData as StudyMaterial);
    }
  };

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

          {/* ================= CONTINUE LEARNING (BASED ON REAL DATA) ================= */}
          {registeredClass ? (
            // Real In-Progress / Registered Live Class
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
                  {registeredClass.cpdCredits}
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
          ) : latestCompletedClass ? (
            // Real Completed Record from Firestore
            <div
              onClick={() => setActiveTab('profile')}
              className="w-full bg-white dark:bg-[#121824] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-[#002147] dark:hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recent Milestone
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {latestCompletedClass.cpdCredits || '1.0 CPD'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {latestCompletedClass.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Completed on {new Date(latestCompletedClass.completedAt).toLocaleDateString()} · Modality: {latestCompletedClass.modality}
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Certificate auto-logged to your profile</span>
                <span className="font-bold text-[#002147] dark:text-[#38BDF8] flex items-center gap-1">
                  <span>View CPD Record</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ) : (
            // Clean motivational prompt when user has no active sessions (NO fake placeholders)
            <div
              onClick={() => navigateToLearn('classes')}
              className="w-full bg-gradient-to-r from-slate-900 to-[#002147] text-white rounded-2xl p-4 sm:p-5 shadow-xs cursor-pointer hover:opacity-95 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ready to Grow?
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-snug">
                Join an Upcoming Live Class
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Connect live with leading instructors, register and enjoy upcoming classes.
              </p>

              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-slate-300">Live classs available in Learn tab</span>
                <span className="font-bold text-[#FF7F32] flex items-center gap-1">
                  <span>Browse Classes</span>
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
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Quizzes
              </span>
            </button>
          </div>
        </section>

        {/* ================= 2. RECOMMENDED FOR YOU (REAL DATA: LIVE CLASSES & MATERIALS) ================= */}
        <section className="text-left space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Recommended for You
            </h2>
            <button
              onClick={() => setActiveTab('learn')}
              className="text-xs sm:text-sm font-semibold text-[#002147] dark:text-[#38BDF8] hover:text-[#FF7F32] transition-colors"
            >
              View all
            </button>
          </div>

          {recommendedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {recommendedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRecommendedClick(item)}
                  className="w-full bg-white dark:bg-[#121824] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-[#002147] dark:hover:border-slate-600 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 relative overflow-hidden shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : item.type === 'class' ? (
                      <img
                        src={classesImg}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#002147] flex items-center justify-center text-[#FF7F32]">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-[#FF7F32] uppercase tracking-wider block truncate">
                      {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#002147] dark:group-hover:text-white transition-colors shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                No recommended classes scheduled right now
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check back soon or explore study materials in the Learn tab.
              </p>
            </div>
          )}
        </section>

        {/* ================= 3. TOP COURSES (REAL DATA FROM FIRESTORE) ================= */}
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
              {upcomingClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => onSelectLiveClass(cls)}
                  className="w-full bg-[#002147] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="relative z-10 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                          Coming Soon
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium">
                        {cls.cpdCredits}
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

                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-1.5 rounded-xl bg-white/15 text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-not-allowed opacity-80"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Coming Soon</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Reader / Video Modal for Study Materials clicked from Recommended */}
      <MaterialReaderModal
        isOpen={!!selectedMaterialForReader}
        onClose={() => setSelectedMaterialForReader(null)}
        material={selectedMaterialForReader}
      />
    </div>
  );
};
