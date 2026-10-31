import React from 'react';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { enrollUserInCourse } from '../../services/firebaseDataService';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { 
  X, 
  Star, 
  Clock, 
  Award, 
  CheckCircle2, 
  Play, 
  BookOpen, 
  Tv
} from 'lucide-react';

interface CourseDetailsModalProps {
  course: Course | null;
  onClose: () => void;
  onOpenPlayer: (course: Course) => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  onClose,
  onOpenPlayer,
}) => {
  const { currentUser } = useAuth();
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 dark:text-slate-100 select-none">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl z-10 overflow-hidden text-left animate-slideUp border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#121824]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7F32]"></span>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recorded Video Course
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">
          {/* Hero Thumbnail */}
          <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-slate-900 shadow-sm group">
            <img
              src={(course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null) || course.image || '/artifacts.jpeg'}
              alt={course.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/artifacts.jpeg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#FF7F32] text-white text-xs font-bold">
                  {course.isFree ? 'Free Access' : course.price}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-white text-xs font-semibold">
                  {course.cpdCredits}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {course.title}
              </h2>
            </div>
          </div>

          {/* Instructor & Institution */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Lead Clinical Instructor
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#002147] dark:text-white mt-0.5">
                {course.instructor}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {course.instructorRole}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{course.rating}</span>
              </span>
              <span className="text-xs text-slate-400">
                ({course.reviewsCount} reviews)
              </span>
            </div>
          </div>

          {/* Key Facts Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 shadow-xs">
              <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">{course.duration}</span>
              <span className="text-xs text-slate-400">Paced</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 shadow-xs">
              <BookOpen className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">{course.modules.length} Modules</span>
              <span className="text-xs text-slate-400">Recorded</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 shadow-xs">
              <Award className="w-4 h-4 text-[#FF7F32] mx-auto mb-1" />
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">{course.cpdCredits}</span>
              <span className="text-xs text-slate-400">Accredited</span>
            </div>
          </div>

          {/* Overview */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Course Overview</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.overview}
            </p>
          </div>

          {/* Learning Outcomes */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">What You Will Learn</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {course.learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF7F32] shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Curriculum Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recorded Modules Breakdown</h4>
            <div className="space-y-2">
              {course.modules.map((mod) => (
                <div key={mod.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161F30]">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#002147] dark:text-white">
                    <span>{mod.title}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {mod.lessons.length} lessons
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
                    {mod.lessons.map((les) => (
                      <li key={les.id} className="flex items-center justify-between py-1">
                        <span className="truncate pr-2">• {les.title}</span>
                        <span className="text-slate-400 shrink-0 font-mono text-xs">
                          {les.duration}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Tuition</span>
            <span className="text-base font-bold text-[#002147] dark:text-white">
              {course.isFree ? 'Free Access' : course.price}
            </span>
          </div>

          <button
            onClick={() => {
              if (currentUser?.id) {
                enrollUserInCourse(currentUser.id, course).catch(() => {});
              }
              onClose();
              onOpenPlayer(course);
            }}
            className="py-3 px-5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-sm flex items-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Watch Recorded Lessons</span>
          </button>
        </div>
      </div>
    </div>
  );
};
