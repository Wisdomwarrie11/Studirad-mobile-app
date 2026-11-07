import React, { useState } from 'react';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { submitTutorialRequest } from '../../services/firebaseDataService';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

interface PrivateTutorialBookingModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PrivateTutorialBookingModal: React.FC<PrivateTutorialBookingModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, requireAuth } = useAuth();

  const availability = course?.tutorAvailability;
  const availableDays = availability?.days?.length ? availability.days : ['Monday', 'Wednesday', 'Friday'];
  const availableSlots = availability?.timeSlots?.length ? availability.timeSlots : ['10:00 - 12:00 BST', '14:00 - 16:00 BST', '18:00 - 20:00 BST'];
  const baseRate = availability?.ratePer30Min || 25;
  const currency = availability?.currency || '£';

  const [selectedDay, setSelectedDay] = useState(availableDays[0] || 'Monday');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(availableSlots[0] || '10:00 - 12:00 BST');
  const [durationMinutes, setDurationMinutes] = useState<number>(30); // 30, 45, 60
  const [specificFocusTopic, setSpecificFocusTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !course) return null;

  // Calculate rate based on duration
  // Duration: min 30 min, max 60 min
  const calculatedRate = Math.round(baseRate * (durationMinutes / 30) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      requireAuth({
        title: 'Sign In to Request Tutorial',
        message: 'Please create an account or sign in to request a private 1-on-1 mentorship session with this instructor.',
        actionText: 'Book Tutorial'
      });
      return;
    }

    if (!specificFocusTopic.trim()) {
      setErrorMessage('Please state the topic, case studies, or questions you wish to review during your tutorial.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitTutorialRequest({
        courseId: course.id,
        courseTitle: course.title,
        instructorId: course.creatorId || undefined,
        instructorName: course.instructor || 'Lead Clinical Instructor',
        studentId: currentUser.id,
        studentName: currentUser.fullName || 'Radiography Student',
        studentEmail: currentUser.email,
        selectedDay,
        selectedTimeSlot,
        durationMinutes,
        calculatedRate,
        currency,
        specificFocusTopic: specificFocusTopic.trim(),
      });

      if (res.success) {
        setIsSubmitted(true);
        onSuccess?.();
      } else {
        setErrorMessage(res.error || 'Failed to submit tutorial request. Please try again.');
      }
    } catch {
      setErrorMessage('Unable to reach the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn text-left text-slate-900 dark:text-slate-100">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121824] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#161F30]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF7F32] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Request Private Tutorial
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {course.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {isSubmitted ? (
            <div className="py-6 sm:py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Tutorial Request Received!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Your private tutorial booking for <strong>{course.title}</strong> with <strong>{course.instructor}</strong> has been logged.
                </p>

                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 text-xs text-slate-700 dark:text-slate-300 text-left space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#FF7F32]">
                    <Clock className="w-4 h-4" />
                    <span>Check Back in 24 to 48 Hours</span>
                  </div>
                  <p>
                    Please check back in <strong>24–48 hours</strong>. Once the instructor and admin confirm the schedule and meeting link, you will see it in your dashboard profile and receive confirmation at <strong>{currentUser?.email}</strong>.
                  </p>
                  <div className="pt-1 border-t border-orange-200/50 dark:border-orange-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Requested: {selectedDay} ({selectedTimeSlot})</span>
                    <span className="font-bold text-[#002147] dark:text-[#38BDF8]">{currency}{calculatedRate}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#002147] dark:bg-[#FF7F32] hover:bg-[#001733] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Instructor Info Header */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lead Instructor
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {course.instructor}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {course.instructorRole}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Base Rate</span>
                  <span className="text-xs font-bold text-[#FF7F32]">
                    {currency}{baseRate} / 30 min
                  </span>
                </div>
              </div>

              {/* 1. Select Available Day */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Instructor Available Days</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDays.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedDay === day
                          ? 'bg-[#002147] text-white border-[#002147] dark:bg-[#FF7F32] dark:border-[#FF7F32]'
                          : 'bg-slate-50 dark:bg-[#1A2234] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Select Time Slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Select Time Window</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedTimeSlot === slot
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-[#FF7F32] text-[#002147] dark:text-[#FF7F32] font-bold'
                          : 'bg-slate-50 dark:bg-[#1A2234] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Duration Selector & Dynamic Fee Calculation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Session Duration (Min 30m, Max 1hr)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Charge scales with duration</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '30 Minutes', mins: 30 },
                    { label: '45 Minutes', mins: 45 },
                    { label: '60 Minutes (1h)', mins: 60 }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.mins}
                      onClick={() => setDurationMinutes(item.mins)}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        durationMinutes === item.mins
                          ? 'bg-[#002147] text-white border-[#002147] dark:bg-[#FF7F32] dark:border-[#FF7F32]'
                          : 'bg-slate-50 dark:bg-[#1A2234] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Price Summary Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Total Estimated Tuition Fee
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {durationMinutes} min private 1-on-1 session
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-[#002147] dark:text-[#FF7F32]">
                    {currency}{calculatedRate}
                  </span>
                </div>
              </div>

              {/* Specific Focus Topic / Question */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Specific Focus Topic or Case Studies Needed</span>
                  <span className="text-[11px] text-slate-400 font-normal">Required</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={specificFocusTopic}
                  onChange={(e) => setSpecificFocusTopic(e.target.value)}
                  placeholder="e.g. Please help me review CT brain stroke protocol interpretation, posterior fossa artifacts, or exam viva questions..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32] resize-none"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] dark:bg-[#FF7F32] dark:hover:bg-[#ff8f4a] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request ({currency}{calculatedRate})</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
