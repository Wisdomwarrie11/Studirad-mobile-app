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
  Tv,
  Layers,
  Award,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Play,
  Download,
  ExternalLink,
  Info,
  Check,
  AlertCircle
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
  const { currentUser } = useAuth();
  if (!course) return null;
  if (!currentUser) return null;

  // Auto-record active course enrollment in Firestore for this learner
  useEffect(() => {
    if (currentUser?.id && course) {
      enrollUserInCourse(currentUser.id, course).catch(() => {});
    }
  }, [currentUser?.id, course?.id]);

  // Flatten lessons across all modules; provide safe fallback if course has no modules yet
  const allLessons: Lesson[] = useMemo(() => {
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
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(
    allLessons.filter((l) => l.completed).map((l) => l.id)
  );

  // In-app interactive quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [readingMaterial, setReadingMaterial] = useState<StudyMaterial | null>(null);

  const currentLesson = allLessons[currentLessonIndex] || allLessons[0];
  const isCurrentCompleted = completedLessonIds.includes(currentLesson.id);

  // Extract active video URL (supports both YouTube and Google Drive): prefers lesson's videoUrl, then course.videoUrl
  const activeVideoUrl = currentLesson.videoUrl || course.videoUrl || '';
  const embedUrl = getVideoEmbedUrl(activeVideoUrl, false);
  const youtubeId = extractYouTubeId(activeVideoUrl);
  const driveId = extractGoogleDriveId(activeVideoUrl);

  // Aggregate all course and lesson materials & links
  const accompanyingMaterials: CourseMaterialLink[] = useMemo(() => {
    const list: CourseMaterialLink[] = [];
    if (course.materials && Array.isArray(course.materials)) {
      list.push(...course.materials);
    }
    if (currentLesson.materials && Array.isArray(currentLesson.materials)) {
      list.push(...currentLesson.materials);
    }
    return list;
  }, [course.materials, currentLesson.materials]);

  const accompanyingLinks: CourseMaterialLink[] = useMemo(() => {
    const list: CourseMaterialLink[] = [];
    if (course.links && Array.isArray(course.links)) {
      list.push(...course.links);
    }
    if (currentLesson.links && Array.isArray(currentLesson.links)) {
      list.push(...currentLesson.links);
    }
    return list;
  }, [course.links, currentLesson.links]);

  // Aggregate quiz questions from course and lesson
  const courseQuizQuestions: CourseQuizQuestion[] = useMemo(() => {
    if (currentLesson.quiz && currentLesson.quiz.length > 0) {
      return currentLesson.quiz;
    }
    if (course.quiz && course.quiz.length > 0) {
      return course.quiz;
    }
    return [];
  }, [course.quiz, currentLesson.quiz]);

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex((prev) => prev - 1);
    }
  };

  const toggleComplete = () => {
    if (isCurrentCompleted) {
      setCompletedLessonIds((prev) => prev.filter((id) => id !== currentLesson.id));
    } else {
      setCompletedLessonIds((prev) => [...prev, currentLesson.id]);
    }
  };

  const progressPercent = Math.round(
    (completedLessonIds.length / allLessons.length) * 100
  );

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs transition-opacity text-slate-900 dark:text-slate-100 select-none">
      <div 
        className="relative w-full max-w-2xl h-full max-h-[94vh] bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden text-left border border-slate-200 dark:border-slate-800 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#002147] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[11px] font-bold text-[#FF7F32] uppercase tracking-wider shrink-0">
              {course.modality || 'Course'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              {course.title}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
            aria-label="Close Course Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Video Player Container (Strict 16:9 In-App Playback) */}
        <div className="relative w-full aspect-video bg-black flex flex-col justify-between shrink-0 overflow-hidden">
          {embedUrl ? (
            <iframe
              key={embedUrl}
              className="w-full h-full border-0"
              src={embedUrl}
              title={currentLesson.title || course.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
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
        </div>

        {/* Lesson Sub-Navigation & Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-[#161F30] border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'curriculum'
                  ? 'bg-white dark:bg-[#121824] text-[#002147] dark:text-[#38BDF8] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#FF7F32]" />
              <span>Curriculum ({allLessons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-white dark:bg-[#121824] text-[#002147] dark:text-[#38BDF8] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Materials & Links ({accompanyingMaterials.length + accompanyingLinks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-white dark:bg-[#121824] text-[#002147] dark:text-[#38BDF8] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Quiz ({courseQuizQuestions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-[#121824] text-[#002147] dark:text-[#38BDF8] shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              <span>Overview</span>
            </button>
          </div>

          <button
            onClick={toggleComplete}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              isCurrentCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-[#002147] text-white hover:bg-[#0A3266]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7F32]" />
            <span className="hidden sm:inline">{isCurrentCompleted ? 'Completed' : 'Mark Done'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar text-slate-800 dark:text-slate-200">
          
          {/* TAB 1: CURRICULUM (SECTIONS / MODULES & LESSONS) */}
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

              {/* Sections / Modules Structure */}
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

                              {isDone && (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

          {/* TAB 2: ACCOMPANYING MATERIALS & REFERENCE LINKS */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Accompanying Course Materials
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supplementary reading guides, clinical checklists, and references for this course.
                </p>
              </div>

              {accompanyingMaterials.length === 0 && accompanyingLinks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No accompanying materials or links added yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Additional handouts and guidelines uploaded by the administrator will appear here.
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
                                  {mat.type || 'Clinical Guide'} {mat.size ? `· ${mat.size}` : ''}
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

          {/* TAB 3: COURSE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Clinical Knowledge Check
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test your understanding of the concepts covered in this course.
                  </p>
                </div>

                {courseQuizQuestions.length > 0 && submittedQuiz && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-bold">
                    Score: {calculateScore()} / {courseQuizQuestions.length}
                  </span>
                )}
              </div>

              {courseQuizQuestions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No quiz questions attached to this course yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    The course instructor or admin can add clinical MCQs from the Admin Dashboard.
                  </p>
                </div>
              ) : (
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
                            <span className="font-bold text-slate-900 dark:text-white">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {submittedQuiz ? (
                      <button
                        onClick={() => {
                          setSubmittedQuiz(false);
                          setSelectedAnswers({});
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Retake Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => setSubmittedQuiz(true)}
                        disabled={Object.keys(selectedAnswers).length < courseQuizQuestions.length}
                        className="px-5 py-2.5 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-[#FF7F32]/20"
                      >
                        Submit Answers
                      </button>
                    )}
                  </div>
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">CPD Recognition</span>
                  <span className="font-bold text-slate-900 dark:text-white">{course.cpdCredits || '1.0 CPD Point'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Modality</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">{course.modality || 'General'}</span>
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

          {/* Progress Indicator */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Course Completion</span>
              <span className="text-[#002147] dark:text-[#38BDF8] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#002147] to-[#FF7F32] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between shrink-0">
          <button
            onClick={handlePrevLesson}
            disabled={currentLessonIndex === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold disabled:opacity-40 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {currentLessonIndex + 1} of {allLessons.length}
          </span>

          <button
            onClick={handleNextLesson}
            disabled={currentLessonIndex === allLessons.length - 1}
            className="px-4 py-2 rounded-xl bg-[#002147] dark:bg-[#1B447A] text-white text-xs sm:text-sm font-bold disabled:opacity-40 flex items-center gap-1 hover:opacity-95 transition-opacity cursor-pointer"
          >
            <span>Next Lesson</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
