import React, { useState, useMemo, useEffect } from 'react';
import { Course, Lesson, CourseMaterialLink, CourseQuizQuestion, StudyMaterial } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { enrollUserInCourse } from '../../services/firebaseDataService';
import { getVideoEmbedUrl, extractYouTubeId, extractGoogleDriveId } from '../../utils/youtube';
import { MaterialReaderModal } from './MaterialReaderModal';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  FileText, 
  Link as LinkIcon, 
  HelpCircle, 
  Play, 
  Info, 
  Check, 
  Heart,
  Maximize2,
  Minimize2,
  Lock,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface CoursePlayerModalProps {
  course: Course | null;
  onClose: () => void;
  onOpenQuiz?: () => void;
}

type PlayerTab = 'curriculum' | 'materials' | 'quiz' | 'overview';

export const CoursePlayerModal: React.FC<CoursePlayerModalProps> = ({
  course,
  onClose,
  onOpenQuiz,
}) => {
  // 1. All Hooks called unconditionally at top of component (Rules of Hooks compliant)
  const { currentUser } = useAuth();

  // Flatten lessons across all modules; provide safe fallback
  const allLessons: Lesson[] = useMemo(() => {
    if (!course) return [];
    if (course.modules && course.modules.length > 0) {
      const flattened = course.modules.flatMap((m) => m.lessons || []);
      if (flattened.length > 0) return flattened;
    }
    return [
      {
        id: `les_${course.id}_intro`,
        title: course.title || 'Course Lecture',
        duration: course.duration || '25 min',
        completed: false,
        type: 'video',
        videoUrl: course.videoUrl,
        summary: course.overview || 'Clinical radiographic masterclass video lecture.',
      },
    ];
  }, [course]);

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<PlayerTab>('curriculum');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [likedCourse, setLikedCourse] = useState(false);
  const [likedLessonIds, setLikedLessonIds] = useState<Record<string, boolean>>({});

  // In-app interactive quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [readingMaterial, setReadingMaterial] = useState<StudyMaterial | null>(null);
  const [quizNotice, setQuizNotice] = useState<string | null>(null);

  // Initialize completed lessons and likes from localStorage
  useEffect(() => {
    if (!course?.id) return;
    try {
      const savedCompleted = localStorage.getItem(`studirad_completed_${course.id}`);
      if (savedCompleted) {
        setCompletedLessonIds(JSON.parse(savedCompleted));
      } else {
        const initial = allLessons.filter((l) => l.completed).map((l) => l.id);
        setCompletedLessonIds(initial);
      }

      const savedLike = localStorage.getItem(`studirad_liked_course_${course.id}`);
      if (savedLike) {
        setLikedCourse(savedLike === 'true');
      }
    } catch (e) {
      // safe fallback
    }
  }, [course?.id, allLessons]);

  // Sync completed lessons to localStorage
  useEffect(() => {
    if (course?.id && completedLessonIds.length > 0) {
      try {
        localStorage.setItem(`studirad_completed_${course.id}`, JSON.stringify(completedLessonIds));
      } catch (e) {}
    }
  }, [course?.id, completedLessonIds]);

  // Auto-record active course enrollment in Firestore for this learner
  useEffect(() => {
    if (currentUser?.id && course) {
      enrollUserInCourse(currentUser.id, course).catch(() => {});
    }
  }, [currentUser?.id, course]);

  // Handle ESC key to exit expanded video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoExpanded) {
        setIsVideoExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVideoExpanded]);

  // Reset quiz inputs when changing lesson
  useEffect(() => {
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setQuizNotice(null);
  }, [currentLessonIndex]);

  const currentLesson: Lesson = allLessons[currentLessonIndex] || allLessons[0] || {
    id: 'placeholder',
    title: 'Radiography Lecture',
    duration: '20 min',
    completed: false,
    type: 'video',
  };

  const isCurrentCompleted = completedLessonIds.includes(currentLesson.id);

  // Extract active video URL (supports both YouTube and Google Drive)
  const activeVideoUrl = currentLesson.videoUrl || course?.videoUrl || '';
  const embedUrl = getVideoEmbedUrl(activeVideoUrl, false);
  const driveId = extractGoogleDriveId(activeVideoUrl);

  // Aggregate all course and lesson materials & links
  const accompanyingMaterials: CourseMaterialLink[] = useMemo(() => {
    if (!course) return [];
    const list: CourseMaterialLink[] = [];
    if (course.materials && Array.isArray(course.materials)) {
      list.push(...course.materials);
    }
    if (currentLesson?.materials && Array.isArray(currentLesson.materials)) {
      list.push(...currentLesson.materials);
    }
    return list;
  }, [course, currentLesson]);

  const accompanyingLinks: CourseMaterialLink[] = useMemo(() => {
    if (!course) return [];
    const list: CourseMaterialLink[] = [];
    if (course.links && Array.isArray(course.links)) {
      list.push(...course.links);
    }
    if (currentLesson?.links && Array.isArray(currentLesson.links)) {
      list.push(...currentLesson.links);
    }
    return list;
  }, [course, currentLesson]);

  // Aggregate quiz questions; provide clinical check questions if none configured
  const courseQuizQuestions: CourseQuizQuestion[] = useMemo(() => {
    if (currentLesson?.quiz && currentLesson.quiz.length > 0) {
      return currentLesson.quiz;
    }
    if (course?.quiz && course.quiz.length > 0) {
      return course.quiz;
    }
    // High-yield clinical check questions tailored to lesson
    const modalityName = course?.modality ? course.modality.toUpperCase() : 'Radiographic';
    return [
      {
        id: `chk_${currentLesson?.id || 1}_1`,
        question: `In clinical radiography for "${currentLesson?.title || 'this procedure'}", what is the primary technical check for diagnostic accuracy?`,
        options: [
          'Correct anatomical centering, collimation, and sharp trabecular bone definition',
          'Intentionally increasing exposure distance without compensating mAs',
          'Excluding primary region of clinical interest from collimation field',
          'Using non-standard projection angles without physician indication',
        ],
        correctAnswerIndex: 0,
        explanation: 'Accurate centering, precise anatomical collimation, and diagnostic sharpness are required for reliable clinical interpretation.',
      },
      {
        id: `chk_${currentLesson?.id || 1}_2`,
        question: `Under standard radiation protection and ALARA principles, which practice is essential during ${modalityName} imaging?`,
        options: [
          'Optimizing exposure factors and applying protective shielding where appropriate',
          'Doubling the dose without adjusting technical factors',
          'Omitting collimation to include unnecessary adjacent anatomy',
          'Using continuous exposure without immobilization verification',
        ],
        correctAnswerIndex: 0,
        explanation: 'ALARA dictates using the lowest radiation dose compatible with diagnostic image quality, alongside collimation and shielding.',
      },
    ];
  }, [course, currentLesson]);

  // Real-time Course Completion Loader Calculation
  const progressPercent = useMemo(() => {
    if (!allLessons || allLessons.length === 0) return 0;
    return Math.round((completedLessonIds.length / allLessons.length) * 100);
  }, [completedLessonIds, allLessons]);

  // Handlers
  const handleNextLesson = () => {
    if (!isCurrentCompleted) {
      setQuizNotice('Please complete the lesson quiz to mark this video done and advance.');
      setActiveTab('quiz');
      return;
    }
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
      setActiveTab('curriculum');
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex((prev) => prev - 1);
    }
  };

  const toggleCourseLike = () => {
    const next = !likedCourse;
    setLikedCourse(next);
    if (course?.id) {
      try {
        localStorage.setItem(`studirad_liked_course_${course.id}`, String(next));
      } catch (e) {}
    }
  };

  const toggleLessonLike = (lessonId: string) => {
    setLikedLessonIds((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    courseQuizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmitQuiz = () => {
    setSubmittedQuiz(true);
    // Automatically mark the lesson as completed upon taking the quiz!
    if (!completedLessonIds.includes(currentLesson.id)) {
      setCompletedLessonIds((prev) => [...prev, currentLesson.id]);
    }
  };

  // Safe early exit AFTER all hooks have executed
  if (!course || !currentUser) {
    return null;
  }

  const isLessonLiked = Boolean(likedLessonIds[currentLesson.id]);
  const hasNextLesson = currentLessonIndex < allLessons.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs transition-opacity text-slate-900 dark:text-slate-100 select-none">
      <div 
        className={`relative w-full h-full bg-white dark:bg-[#121824] flex flex-col shadow-2xl overflow-hidden text-left border-0 sm:border border-slate-200 dark:border-slate-800 transition-all ${
          isVideoExpanded 
            ? 'max-w-none max-h-none rounded-none' 
            : 'sm:max-w-4xl md:max-w-5xl sm:h-[96vh] rounded-none sm:rounded-3xl animate-scaleIn'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3 bg-[#002147] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[11px] font-bold text-[#FF7F32] uppercase tracking-wider shrink-0">
              {course.modality || 'Course'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              {course.title}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Like Course Button */}
            <button
              type="button"
              onClick={toggleCourseLike}
              className={`p-1.5 rounded-full flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                likedCourse
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
              title={likedCourse ? 'Unlike Course' : 'Like Course'}
            >
              <Heart className={`w-4 h-4 ${likedCourse ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="text-[11px] pr-1">{(course.likes || 24) + (likedCourse ? 1 : 0)}</span>
            </button>

            {/* Expand / Minimize Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsVideoExpanded((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title={isVideoExpanded ? 'Collapse Video' : 'Expand Video to Cover Screen'}
            >
              {isVideoExpanded ? (
                <Minimize2 className="w-4 h-4 text-[#FF7F32]" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Close Course Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Course Completion Loader Header */}
        <div className="bg-slate-100 dark:bg-[#161F30] px-4 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <span>Real-Time Course Completion</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({completedLessonIds.length} of {allLessons.length} lessons done)
              </span>
            </span>
            <span className="text-[#FF7F32] font-bold text-xs">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#002147] via-[#2563EB] to-[#FF7F32] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Video Player Container */}
        <div className={`relative w-full bg-black flex flex-col justify-between shrink-0 overflow-hidden ${
          isVideoExpanded ? 'flex-1 h-full' : 'aspect-video'
        }`}>
          {embedUrl ? (
            <div className="relative w-full h-full">
              <iframe
                key={embedUrl}
                className="w-full h-full border-0"
                src={embedUrl}
                title={currentLesson.title || course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                // Sandbox restricts opening external popups or navigating away to Google Drive
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />

              {/* Secure Top-Right Shield: Prevents accidental clicks on Google Drive popout icon */}
              {Boolean(driveId) && (
                <div 
                  className="absolute top-0 right-0 w-24 h-16 z-20 pointer-events-auto bg-transparent cursor-default"
                  title="StudiRad In-App Secure Player"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              )}
            </div>
          ) : (
            /* Fallback when no valid Video URL is present */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#002147] border border-[#FF7F32]/40 flex items-center justify-center text-[#FF7F32]">
                <Play className="w-7 h-7 ml-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {currentLesson.title}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {activeVideoUrl 
                    ? 'Could not parse video link. Please verify the YouTube or Google Drive link in the Admin Portal.'
                    : 'No lecture video attached yet. You can embed a YouTube or Google Drive video link from the Admin Portal.'}
                </p>
              </div>
            </div>
          )}

          {/* Floating Expand/Collapse Button Overlay in Video Container */}
          <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsVideoExpanded((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
            >
              {isVideoExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-[#FF7F32]" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* If video is not expanded, render tabs, quiz action, curriculum & footer */}
        {!isVideoExpanded && (
          <>
            {/* Take Quiz Callout Banner directly under Video */}
            <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-[#161F30] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {isCurrentCompleted ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 animate-pulse">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {isCurrentCompleted 
                      ? '✓ Lesson Completed & Quiz Passed' 
                      : 'Take Quiz to Complete Lesson & Unlock Next'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {isCurrentCompleted 
                      ? 'You have successfully verified understanding for this topic.' 
                      : 'Answer the clinical check questions to record lesson progress.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Like current lesson */}
                <button
                  type="button"
                  onClick={() => toggleLessonLike(currentLesson.id)}
                  className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    isLessonLiked
                      ? 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121824] text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title={isLessonLiked ? 'Liked' : 'Like this video'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLessonLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span className="hidden sm:inline text-[11px] font-semibold">
                    {isLessonLiked ? 'Liked' : 'Like'}
                  </span>
                </button>

                {/* Take Quiz Button */}
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    activeTab === 'quiz'
                      ? 'bg-[#FF7F32] text-white shadow-[#FF7F32]/20'
                      : isCurrentCompleted
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      : 'bg-[#FF7F32] hover:bg-[#e86f26] text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isCurrentCompleted ? 'Review Quiz' : 'Take Quiz'}</span>
                </button>
              </div>
            </div>

            {/* Lesson Sub-Navigation & Tabs */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-white dark:bg-[#121824] border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'curriculum'
                      ? 'bg-[#002147] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#FF7F32]" />
                  <span>Curriculum ({allLessons.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'quiz'
                      ? 'bg-[#002147] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Take Quiz ({courseQuizQuestions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('materials')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'materials'
                      ? 'bg-[#002147] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Materials & Links ({accompanyingMaterials.length + accompanyingLinks.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#002147] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Overview</span>
                </button>
              </div>
            </div>

            {/* Alert / Notice if user tries to jump without quiz */}
            {quizNotice && (
              <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
                <span>{quizNotice}</span>
                <button
                  onClick={() => setQuizNotice(null)}
                  className="text-amber-800 dark:text-amber-200 hover:opacity-75 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar text-slate-800 dark:text-slate-200">
              
              {/* TAB 1: CURRICULUM */}
              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-[#FF7F32] uppercase tracking-wider block mb-0.5">
                      Currently Viewing: Lesson {currentLessonIndex + 1} of {allLessons.length} · {currentLesson.duration}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {currentLesson.title}
                    </h3>
                  </div>

                  {currentLesson.summary && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Clinical Lesson Focus:</span>
                      <p>{currentLesson.summary}</p>
                    </div>
                  )}

                  {/* Modules Structure */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Course Modules & Lessons
                    </h4>

                    {course.modules && course.modules.length > 0 ? (
                      course.modules.map((module, mIdx) => (
                        <div
                          key={module.id || mIdx}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#121824]"
                        >
                          <div className="p-3 bg-slate-100/70 dark:bg-[#161F30] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {module.title}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {module.lessons?.length || 0} lessons
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {module.lessons?.map((lesson) => {
                              const flatIdx = allLessons.findIndex((l) => l.id === lesson.id);
                              const isActive = flatIdx === currentLessonIndex;
                              const isDone = completedLessonIds.includes(lesson.id);

                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => {
                                    if (flatIdx !== -1) setCurrentLessonIndex(flatIdx);
                                  }}
                                  className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-blue-50/70 dark:bg-[#1B2942] text-[#002147] dark:text-[#38BDF8]'
                                      : 'hover:bg-slate-50 dark:hover:bg-[#161F30] text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                      isActive
                                        ? 'bg-[#FF7F32] text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    </div>
                                    <div className="truncate">
                                      <span className="text-xs font-semibold block truncate">
                                        {lesson.title}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {lesson.duration}
                                      </span>
                                    </div>
                                  </div>

                                  {isDone ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Done</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                                      Quiz Pending
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                        {allLessons[0]?.title} ({allLessons[0]?.duration})
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TAKE QUIZ */}
              {activeTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7F32] block">
                        Lesson {currentLessonIndex + 1} Quiz
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentLesson.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Answer the questions below to verify clinical mastery and mark this lesson as completed.
                      </p>
                    </div>

                    {submittedQuiz && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-bold shrink-0">
                        Score: {calculateScore()} / {courseQuizQuestions.length}
                      </span>
                    )}
                  </div>

                  {submittedQuiz && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        <h5 className="font-bold text-xs sm:text-sm">
                          Quiz Completed! Lesson marked as completed 🎉
                        </h5>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Your real-time course progress has updated. You are now unlocked to advance to the next lesson!
                      </p>
                      {hasNextLesson && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleNextLesson}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <span>Proceed to Next Lesson</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    {courseQuizQuestions.map((q, qIdx) => {
                      const isAnswered = selectedAnswers[qIdx] !== undefined;
                      const isCorrect = submittedQuiz && selectedAnswers[qIdx] === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id || qIdx}
                          className={`p-4 rounded-2xl border transition-all ${
                            submittedQuiz
                              ? isCorrect
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                              : 'bg-white dark:bg-[#161F30] border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <span className="w-5 h-5 rounded-full bg-[#002147] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                              {q.question}
                            </span>
                          </div>

                          <div className="space-y-2 pl-7">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[qIdx] === optIdx;
                              const isRightAnswer = submittedQuiz && optIdx === q.correctAnswerIndex;
                              const isWrongSelection = submittedQuiz && isSelected && !isRightAnswer;

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleOptionSelect(qIdx, optIdx)}
                                  disabled={submittedQuiz}
                                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                    isRightAnswer
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                                      : isWrongSelection
                                      ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-200 font-bold'
                                      : isSelected
                                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-[#002147] dark:text-[#38BDF8] font-semibold'
                                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isRightAnswer && (
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {submittedQuiz && q.explanation && (
                            <div className="mt-3 ml-7 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700">
                              <span className="font-bold text-slate-900 dark:text-white">Clinical Note: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      {submittedQuiz ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSubmittedQuiz(false);
                            setSelectedAnswers({});
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Quiz</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(selectedAnswers).length < courseQuizQuestions.length}
                          className="px-5 py-2.5 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-[#FF7F32]/20 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit & Complete Lesson</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACCOMPANYING MATERIALS */}
              {activeTab === 'materials' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Accompanying Course Materials
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Supplementary clinical guides, textbooks, and protocol handouts.
                    </p>
                  </div>

                  {accompanyingMaterials.length === 0 && accompanyingLinks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No accompanying materials or links added yet.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Admin handouts and guidelines stored on Cloudinary will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {accompanyingMaterials.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Documents & Handouts ({accompanyingMaterials.length})
                          </span>
                          <div className="space-y-2">
                            {accompanyingMaterials.map((mat, idx) => (
                              <div
                                key={mat.id || idx}
                                className="p-3.5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                      {mat.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                      {mat.type || 'Clinical Document'}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const isVid = mat.type === 'video' || mat.url.includes('youtube') || mat.url.includes('youtu.be');
                                    setReadingMaterial({
                                      id: mat.id || `mat_${idx}`,
                                      title: mat.title,
                                      course: course.title,
                                      type: isVid ? 'video' : 'document',
                                      fileSize: mat.size || 'In-App Material',
                                      link: mat.url,
                                      uploader: course.instructor || 'StudiRad Faculty',
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-[#002147] text-white hover:bg-[#0A3266] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-[#FF7F32]" />
                                  <span>View In-App</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {accompanyingLinks.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Reference Links & Guidelines ({accompanyingLinks.length})
                          </span>
                          <div className="space-y-2">
                            {accompanyingLinks.map((link, idx) => (
                              <div
                                key={link.id || idx}
                                className="p-3.5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                                    <LinkIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                      {link.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate block">
                                      {link.url}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const isVid = link.url.includes('youtube') || link.url.includes('youtu.be');
                                    setReadingMaterial({
                                      id: link.id || `link_${idx}`,
                                      title: link.title,
                                      course: course.title,
                                      type: isVid ? 'video' : 'document',
                                      fileSize: 'Clinical Resource',
                                      link: link.url,
                                      uploader: course.instructor || 'StudiRad Faculty',
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-[#002147] dark:text-[#38BDF8]" />
                                  <span>Open In-App</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#002147] dark:text-[#38BDF8] uppercase tracking-wider block mb-1">
                      {course.institution}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Instructor: <span className="font-semibold text-slate-800 dark:text-slate-200">{course.instructor}</span> ({course.instructorRole})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Modality</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase">{course.modality || 'General'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Certification</span>
                      <span className="font-bold text-slate-900 dark:text-white">Verified Certificate</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Syllabus & Overview</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {course.overview}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation Bar */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold disabled:opacity-40 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                Lesson {currentLessonIndex + 1} of {allLessons.length}
              </span>

              <button
                type="button"
                onClick={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isCurrentCompleted && hasNextLesson
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-[#002147] dark:bg-[#1B447A] text-white hover:opacity-95'
                } disabled:opacity-40`}
              >
                <span>Next Lesson</span>
                {!isCurrentCompleted && hasNextLesson ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {readingMaterial && (
        <MaterialReaderModal
          material={readingMaterial}
          onClose={() => setReadingMaterial(null)}
        />
      )}
    </div>
  );
};
