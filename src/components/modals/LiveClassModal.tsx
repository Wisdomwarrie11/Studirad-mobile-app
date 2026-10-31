import React, { useState } from 'react';
import { LiveClass } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  Award, 
  Video, 
  User, 
  CheckCircle2, 
  CalendarPlus,
  Users,
  ExternalLink,
  Sparkles,
  MapPin,
  Layers,
  GraduationCap
} from 'lucide-react';
import classesImg from '../../assets/images/onboarding_classes_1792606674536.jpg';

interface LiveClassModalProps {
  liveClass: LiveClass | null;
  onClose: () => void;
}

export const LiveClassModal: React.FC<LiveClassModalProps> = ({
  liveClass,
  onClose,
}) => {
  if (!liveClass) return null;

  const [isRegistered, setIsRegistered] = useState(liveClass.isRegistered || false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const handleRegister = () => {
    setIsRegistered(true);
    const targetLink = liveClass.registrationLink || liveClass.registerLink || liveClass.meetingLink;
    if (targetLink && targetLink.startsWith('http')) {
      window.open(targetLink, '_blank');
    }
  };

  const handleAddToCalendar = () => {
    setCalendarAdded(true);
    setTimeout(() => setCalendarAdded(false), 2500);
  };

  const isCompleted = liveClass.cohortStatus === 'completed' || liveClass.status === 'completed';
  const isComingSoon = liveClass.cohortStatus === 'coming-soon' || liveClass.status === 'coming-soon';
  const classImg = liveClass.image || liveClass.thumbnail || classesImg;

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
            <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-slate-400' : 'bg-[#FF7F32] animate-pulse'}`}></span>
            <span className="text-xs sm:text-sm font-bold text-[#002147] dark:text-[#38BDF8] uppercase tracking-wider">
              {isCompleted ? 'Completed Cohort' : isComingSoon ? 'Coming Soon Cohort' : 'Live Cohort Masterclass'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">
          
          {/* Banner Image */}
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
            <img 
              src={classImg} 
              alt={liveClass.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If local image fails to load, gracefully fallback to default
                (e.target as HTMLImageElement).src = classesImg;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Category & Status Overlays */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white">
                {liveClass.category || 'Cohort'}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                isCompleted ? 'bg-slate-700' : isComingSoon ? 'bg-blue-600' : 'bg-[#FF7F32]'
              }`}>
                {isCompleted ? 'Completed Cohort' : isComingSoon ? 'Coming Soon' : 'Active Registration'}
              </span>

              {liveClass.level && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                  {liveClass.level}
                </span>
              )}
            </div>
          </div>

          {/* Cohort Title */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#002147] text-white text-xs font-bold">
                {liveClass.price || 'FREE'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                {liveClass.cpdCredits || '2.0 CPD Points'}
              </span>
              {liveClass.venue && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  <MapPin className="w-3 h-3 text-[#FF7F32]" />
                  <span>{liveClass.venue}</span>
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {liveClass.title}
            </h2>
          </div>

          {/* Scheduled Date, Time & Cohort Details Strip */}
          <div className="p-4 rounded-2xl bg-[#002147] text-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#FF7F32]">
                <Calendar className="w-4 h-4" />
                <span>{liveClass.duration || liveClass.date}</span>
              </div>
              <span className="text-xs bg-white/15 px-2.5 py-0.5 rounded-lg font-mono">
                {liveClass.time || 'Evening Cohort'}
              </span>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-slate-200">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                <span>{liveClass.duration || 'Session Cohort'}</span>
              </span>
              <span className="text-emerald-300 font-bold">
                {liveClass.price || 'FREE'}
              </span>
            </div>
          </div>

          {/* Custom Confirmation Message */}
          {(isRegistered || isCompleted) && liveClass.hasCustomRegistration && liveClass.customConfirmationMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Class Access Information</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                {liveClass.customConfirmationMessage}
              </p>
            </div>
          )}

          {/* Class Description */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cohort Overview</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {liveClass.description}
            </p>
          </div>

          {/* Features Highlights */}
          {liveClass.features && liveClass.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cohort Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {liveClass.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF7F32] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What You Will Learn */}
          {liveClass.whatYouWillLearn && liveClass.whatYouWillLearn.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">What You'll Master</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {liveClass.whatYouWillLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FF7F32] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technologies / Focus Tags */}
          {liveClass.technologies && liveClass.technologies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classroom Platforms</h4>
              <div className="flex flex-wrap gap-1.5">
                {liveClass.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleAddToCalendar}
            className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4 text-[#002147] dark:text-[#38BDF8]" />
            <span>{calendarAdded ? 'Added ✓' : 'Add to Calendar'}</span>
          </button>

          {isCompleted ? (
            <button
              onClick={() => {
                const target = liveClass.meetingLink || liveClass.registerLink || liveClass.registrationLink;
                if (target && target.startsWith('http')) {
                  window.open(target, '_blank');
                } else {
                  handleRegister();
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#FF7F32]" />
              <span>View Class Room & Materials</span>
            </button>
          ) : isRegistered ? (
            <button
              onClick={() => {
                const target = liveClass.meetingLink || liveClass.registerLink || liveClass.registrationLink;
                if (target && target.startsWith('http')) {
                  window.open(target, '_blank');
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 text-[#FF7F32]" />
              <span>Join Class Invitation</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Coming Soon</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
