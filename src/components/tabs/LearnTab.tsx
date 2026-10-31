import React, { useState, useMemo, useEffect } from 'react';
import { Course, LiveClass, StudyMaterial } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { subscribeClasses, subscribeStudyMaterials, subscribeCourses } from '../../services/firebaseDataService';
import { MaterialReaderModal } from '../modals/MaterialReaderModal';
import { 
  Lock, 
  ChevronRight,
  Clock,
  Video,
  FileText,
  Search,
  Share2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  Link as LinkIcon,
  User,
  GraduationCap,
  Play,
  Layers,
  HelpCircle,
  Award
} from 'lucide-react';
import { getYouTubeThumbnail } from '../../utils/youtube';
import classesImg from '../../assets/images/onboarding_classes_1792606674536.jpg';

interface LearnTabProps {
  onSelectCourse: (course: Course) => void;
  onOpenPlayer: (course: Course) => void;
  onSelectLiveClass: (liveClass: LiveClass) => void;
  onStartQuiz: () => void;
}

type LearnMainView = 'classes' | 'materials' | 'courses';
type ClassStatusFilter = 'all' | 'upcoming' | 'completed';

// Categories matching web app's ClassesPage
const CLASS_CATEGORIES = ['All', 'X-ray', 'Ultrasound', 'MRI', 'CT', 'Nuclear Medicine'];

// Categories matching web app's MaterialsPage
const MATERIAL_COURSES = [
  'All',
  'Anatomy',
  'Physiology',
  'Rad Tech',
  'Rad Equipment',
  'Pathology',
  'CT',
  'MRI',
  'USS',
  'Projects',
  'Professional Exams PQ',
  'Others'
];

// Color palette matching web app's MaterialsPage
const MATERIAL_COLORS: Record<string, { main: string; light: string; border: string }> = {
  Anatomy: { main: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-800' },
  Physiology: { main: 'text-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-200 dark:border-emerald-800' },
  'Rad Tech': { main: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-200 dark:border-purple-800' },
  'Rad Equipment': { main: 'text-rose-600', light: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-200 dark:border-rose-800' },
  Pathology: { main: 'text-red-600', light: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-200 dark:border-red-800' },
  CT: { main: 'text-cyan-600', light: 'bg-cyan-50 dark:bg-cyan-950/50', border: 'border-cyan-200 dark:border-cyan-800' },
  MRI: { main: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-800' },
  USS: { main: 'text-teal-600', light: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-200 dark:border-teal-800' },
  Projects: { main: 'text-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-800' },
  'Professional Exams PQ': { main: 'text-slate-600', light: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  Others: { main: 'text-pink-600', light: 'bg-pink-50 dark:bg-pink-950/50', border: 'border-pink-200 dark:border-pink-800' },
  All: { main: 'text-[#002147] dark:text-[#38BDF8]', light: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
};

export const LearnTab: React.FC<LearnTabProps> = ({
  onSelectCourse,
  onOpenPlayer,
  onSelectLiveClass,
}) => {
  const { currentUser, setScreen, learnInitialView } = useAuth();

  // Navigation mode: Classes, Study Materials, or Courses
  const [activeMainView, setActiveMainView] = useState<LearnMainView>(learnInitialView || 'classes');

  // Sync when navigation trigger changes from Home or other tabs
  useEffect(() => {
    if (learnInitialView) {
      setActiveMainView(learnInitialView);
    }
  }, [learnInitialView]);

  // --- Classes State ---
  const [classesList, setClassesList] = useState<LiveClass[]>([]);
  const [selectedClassCategory, setSelectedClassCategory] = useState<string>('All');
  const [classStatusFilter, setClassStatusFilter] = useState<ClassStatusFilter>('all');
  const [classSearchTerm, setClassSearchTerm] = useState('');

  // --- Materials State ---
  const [materialsList, setMaterialsList] = useState<StudyMaterial[]>([]);
  const [selectedMaterialCourse, setSelectedMaterialCourse] = useState<string>('All');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<'all' | 'reading' | 'videos'>('all');
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [selectedMaterialForReader, setSelectedMaterialForReader] = useState<StudyMaterial | null>(null);

  // --- Courses State (Real-time Firestore) ---
  const [coursesList, setCoursesList] = useState<Course[]>([]);

  // Authentication guard modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'class' | 'material'>('class');

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubClasses = subscribeClasses((liveCls) => {
      setClassesList(liveCls || []);
    });

    const unsubMaterials = subscribeStudyMaterials((mats) => {
      setMaterialsList(mats || []);
    });

    const unsubCourses = subscribeCourses((crs) => {
      setCoursesList(crs || []);
    });

    return () => {
      unsubClasses?.();
      unsubMaterials?.();
      unsubCourses?.();
    };
  }, []);

  const isUserAuthenticated = currentUser && !currentUser.isGuest;

  const handleClassClick = (cls: LiveClass) => {
    if (!isUserAuthenticated) {
      setAuthModalReason('class');
      setShowAuthModal(true);
      return;
    }
    onSelectLiveClass(cls);
  };

  const handleMaterialClick = (mat: StudyMaterial) => {
    if (!isUserAuthenticated) {
      setAuthModalReason('material');
      setShowAuthModal(true);
      return;
    }
    setSelectedMaterialForReader(mat);
  };

  const handleShareMaterial = (e: React.MouseEvent, mat: StudyMaterial) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${mat.title} | StudiRad Material`,
        text: `Check out this radiography study material on ${mat.course}!`,
        url: mat.link || window.location.href,
      }).catch(() => {});
    } else {
      if (mat.link) {
        navigator.clipboard.writeText(mat.link);
      }
    }
  };

  // --- Filtered Classes (matching web app ClassesPage) ---
  const filteredClasses = useMemo(() => {
    return classesList.filter((cls) => {
      // Category match
      const clsCat = cls.category || (cls.modality === 'xray' ? 'X-ray' : cls.modality === 'ct' ? 'CT' : cls.modality === 'mri' ? 'MRI' : cls.modality === 'ultrasound' ? 'Ultrasound' : 'All');
      const matchesCategory = selectedClassCategory === 'All' || clsCat.toLowerCase().includes(selectedClassCategory.toLowerCase());

      // Status match (Upcoming vs Completed)
      const isCompleted = cls.cohortStatus === 'completed' || cls.status === 'completed';
      const matchesStatus = 
        classStatusFilter === 'all' 
          ? true 
          : classStatusFilter === 'completed' 
            ? isCompleted 
            : !isCompleted;

      // Search match
      const matchesSearch = 
        !classSearchTerm.trim() || 
        cls.title.toLowerCase().includes(classSearchTerm.toLowerCase()) || 
        (cls.instructor && cls.instructor.toLowerCase().includes(classSearchTerm.toLowerCase()));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [classesList, selectedClassCategory, classStatusFilter, classSearchTerm]);

  // --- Filtered Materials (matching web app MaterialsPage) ---
  const filteredMaterials = useMemo(() => {
    return materialsList.filter((mat) => {
      // Course match
      const matchesCourse = selectedMaterialCourse === 'All' || mat.course === selectedMaterialCourse;

      // Type match (all vs reading vs videos)
      const isVideo = mat.type === 'video' || mat.link?.includes('youtube.com') || mat.link?.includes('youtu.be');
      const matchesType = 
        materialTypeFilter === 'all'
          ? true
          : materialTypeFilter === 'videos'
            ? isVideo
            : !isVideo;

      // Search match
      const matchesSearch = 
        !materialSearchTerm.trim() ||
        mat.title.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
        mat.uploader.toLowerCase().includes(materialSearchTerm.toLowerCase());

      return matchesCourse && matchesType && matchesSearch;
    });
  }, [materialsList, selectedMaterialCourse, materialTypeFilter, materialSearchTerm]);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col pb-28 select-none overflow-x-hidden text-left">
      <div className="w-full max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* ================= MAIN NAVIGATION TABS ================= */}
        {/* Classes | Study Materials | Courses */}
        <div className="p-1 rounded-2xl bg-slate-200/80 dark:bg-[#161F30] flex items-center justify-between shadow-inner">
          <button
            onClick={() => setActiveMainView('classes')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMainView === 'classes'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-[#FF7F32]" />
            <span>Classes</span>
          </button>

          <button
            onClick={() => setActiveMainView('materials')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMainView === 'materials'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#FF7F32]" />
            <span>Study Materials</span>
          </button>

          <button
            onClick={() => setActiveMainView('courses')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMainView === 'courses'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>Courses</span>
          </button>
        </div>

        {/* =========================================================================
            VIEW 1: LIVE CLASSES (Upcoming & Completed Cohorts)
        ========================================================================= */}
        {activeMainView === 'classes' && (
          <div className="space-y-4">
            
            {/* Header: Strictly "Top classes" as requested */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Top classes
              </h2>

              {/* Status Filter: All | Upcoming | Completed */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#161F30] p-1 rounded-xl">
                {(['all', 'upcoming', 'completed'] as ClassStatusFilter[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setClassStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                      classStatusFilter === st
                        ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Modality Filter Chips (Matching ClassesPage: All, X-ray, Ultrasound, MRI, CT, Nuclear Medicine) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {CLASS_CATEGORIES.map((cat) => {
                const isSelected = selectedClassCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedClassCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-2xs ${
                      isSelected
                        ? 'bg-[#002147] text-white shadow-sm'
                        : 'bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search classes input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search live cohorts by title or instructor..."
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002147]"
              />
            </div>

            {/* Horizontal Track: At least 2 cards visible per view on mobile */}
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">No classes in this view</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Try switching between Upcoming or Completed cohorts, or select another modality.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {filteredClasses.map((cls) => {
                  const isCompleted = cls.cohortStatus === 'completed' || cls.status === 'completed';

                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleClassClick(cls)}
                      className="w-[calc(50%-6px)] min-w-[145px] max-w-[185px] sm:w-[210px] shrink-0 bg-white dark:bg-[#121824] rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:border-[#002147] dark:hover:border-slate-600 transition-all group"
                    >
                      <div>
                        {/* Card Image */}
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
                          <img
                            src={cls.image || cls.thumbnail || classesImg}
                            alt={cls.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = classesImg;
                            }}
                          />

                          {/* Category Badge */}
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-xs text-white">
                              {cls.category || 'Cohort'}
                            </span>
                          </div>

                          {/* Completed / Coming Soon Badge */}
                          <div className="absolute bottom-2 left-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-slate-800 text-slate-200'
                                : 'bg-blue-600 text-white shadow-xs'
                            }`}>
                              {isCompleted ? 'Completed' : 'Coming Soon'}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mt-2 leading-snug group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                          {cls.title}
                        </h3>

                        {/* Time & Date */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                          <Clock className="w-3 h-3 text-[#FF7F32] shrink-0" />
                          <span className="truncate">{cls.date || cls.time || 'Scheduled Cohort'}</span>
                        </div>
                      </div>

                      {/* Register Link / Action (Inactive for Upcoming Classes) */}
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#002147] dark:text-[#38BDF8]">
                          {cls.price || 'Free Cohort'}
                        </span>

                        {isCompleted ? (
                          <span className="text-[11px] font-bold text-[#FF7F32] group-hover:underline flex items-center gap-0.5">
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md cursor-not-allowed">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 2: STUDY MATERIALS (Academic Repository: Reading & Video Lectures)
        ========================================================================= */}
        {activeMainView === 'materials' && (
          <div className="space-y-4">
            
            {/* Header & Sub-filter (All | Reading Materials | Video Lectures) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Study Materials
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reading documents, lecture notes & clinical video recordings
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#161F30] p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setMaterialTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    materialTypeFilter === 'all'
                      ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMaterialTypeFilter('reading')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                    materialTypeFilter === 'reading'
                      ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Reading</span>
                </button>
                <button
                  onClick={() => setMaterialTypeFilter('videos')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                    materialTypeFilter === 'videos'
                      ? 'bg-white dark:bg-[#002147] text-[#002147] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Video className="w-3 h-3 text-red-500" />
                  <span>Videos</span>
                </button>
              </div>
            </div>

            {/* Course Category Chips (Matching MaterialsPage) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {MATERIAL_COURSES.map((course) => {
                const isSelected = selectedMaterialCourse === course;
                const colors = MATERIAL_COLORS[course] || MATERIAL_COLORS.All;

                return (
                  <button
                    key={course}
                    onClick={() => setSelectedMaterialCourse(course)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? `${colors.main} ${colors.light} ${colors.border}`
                        : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {course}
                  </button>
                );
              })}
            </div>

            {/* Search materials */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, topic, or uploader..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002147]"
              />
            </div>

            {/* Study Materials Cards List */}
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">No materials found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Try clearing the search term or switching to "All" course categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredMaterials.map((mat) => {
                  const config = MATERIAL_COLORS[mat.course] || MATERIAL_COLORS.All;
                  const isVideo = mat.type === 'video' || mat.link?.includes('youtube.com') || mat.link?.includes('youtu.be');
                  const isLink = mat.type === 'link';

                  return (
                    <div
                      key={mat.id}
                      onClick={() => handleMaterialClick(mat)}
                      className="group relative bg-white dark:bg-[#121824] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] dark:hover:border-slate-600 transition-all flex flex-col justify-between cursor-pointer"
                    >
                      {/* Course colored accent edge */}
                      <div className={`absolute left-0 top-6 w-1 h-8 rounded-r-full ${config.main.replace('text-', 'bg-')}`}></div>

                      <div>
                        {/* Top Icon & Course Tag */}
                        <div className="flex items-center justify-between mb-2 pl-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${config.light} ${config.main}`}>
                              {isVideo ? (
                                <Video className="w-4 h-4 text-red-500" />
                              ) : isLink ? (
                                <LinkIcon className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${config.main}`}>
                              {mat.course}
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleShareMaterial(e, mat)}
                            title="Share Material"
                            className="p-1 text-slate-400 hover:text-[#002147] dark:hover:text-white transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug pl-2 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                          {mat.title}
                        </h3>

                        {/* Uploader & Date */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-2 mt-2">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{mat.uploader}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 pl-2">
                        <span className={`w-full py-1.5 px-3 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-1.5 ${
                          isVideo
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-[#002147]/10 dark:bg-slate-800 text-[#002147] dark:text-[#38BDF8]'
                        }`}>
                          {isVideo ? (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>Watch Video</span>
                            </>
                          ) : isLink ? (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Visit Link</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Read Document</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 3: COURSES (REAL FIRESTORE DATA)
        ========================================================================= */}
        {activeMainView === 'courses' && (
          <div className="space-y-4">
            {coursesList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coursesList.map((course) => {
                  const hasVideo = Boolean(course.videoUrl);
                  const modulesCount = course.modules?.length || 0;
                  const materialsCount = course.materials?.length || 0;
                  const quizCount = course.quiz?.length || 0;

                  return (
                    <div
                      key={course.id}
                      onClick={() => onOpenPlayer ? onOpenPlayer(course) : onSelectCourse(course)}
                      className="bg-white dark:bg-[#121824] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#002147] dark:hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Course Image / Thumbnail with Video Badge */}
                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900">
                          <img
                            src={(course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null) || course.image || classesImg}
                            alt={course.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = classesImg;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white">
                                {course.category || course.modality?.toUpperCase() || 'Course'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white">
                                {course.level || 'All Levels'}
                              </span>
                              {hasVideo && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-red-600/90 text-white flex items-center gap-1">
                                  <Play className="w-2.5 h-2.5 fill-white" />
                                  <span>In-App Video</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-[#FF7F32]" />
                              <span>{course.instructor || 'StudiRad Faculty'}</span>
                            </span>
                            {course.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{course.duration}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                            {course.title}
                          </h3>

                          {(course.description || course.overview) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                              {course.description || course.overview}
                            </p>
                          )}
                        </div>

                        {/* Badges for Curricular Features */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                          {course.cpdCredits ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              <span>{course.cpdCredits} CPD</span>
                            </span>
                          ) : null}

                          {modulesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>{modulesCount} {modulesCount === 1 ? 'Module' : 'Modules'}</span>
                            </span>
                          )}

                          {materialsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{materialsCount} {materialsCount === 1 ? 'Handout' : 'Handouts'}</span>
                            </span>
                          )}

                          {quizCount > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />
                              <span>{quizCount} MCQs</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#002147] dark:text-[#38BDF8]">
                          {course.price || 'Free'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenPlayer) onOpenPlayer(course);
                            else onSelectCourse(course);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Open Course</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 px-6 text-center bg-white dark:bg-[#121824] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    No courses uploaded yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Courses published from the admin console will appear here with in-app video lectures, study materials, and module quizzes.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => setActiveMainView('classes')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Video className="w-4 h-4 text-[#FF7F32]" />
                    <span>Explore Live Classes</span>
                  </button>

                  <button
                    onClick={() => setActiveMainView('materials')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-[#FF7F32]" />
                    <span>Browse Study Materials</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Reader / Video Modal */}
      <MaterialReaderModal
        isOpen={!!selectedMaterialForReader}
        onClose={() => setSelectedMaterialForReader(null)}
        material={selectedMaterialForReader}
      />

      {/* Auth Guard Modal for Guest Users */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn text-slate-900 dark:text-slate-100 select-none">
          <div className="w-full max-w-sm bg-white dark:bg-[#121824] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-[#FF7F32]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Account Required
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authModalReason === 'class'
                  ? 'Sign in or create your free account to register for live cohorts and track CPD credits.'
                  : 'Sign in or create your free account to access full study materials and video lectures.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setScreen('auth');
                }}
                className="w-full py-3 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Sign In / Register
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
