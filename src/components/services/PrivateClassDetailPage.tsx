import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { PrivateClass } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatMoney } from '../../utils/currency';
import { formatTime12h } from '../../utils/timeFormat';
import { scrollToTopInstant } from '../../utils/scrollTop';
import { submitPrivateClassBooking } from '../../services/firebaseDataService';
import { getVideoEmbedUrl } from '../../utils/youtube';
import { StarRatingWidget } from '../common/StarRatingWidget';
import { useContentRatingSummary } from '../../hooks/useContentRatings';
import {
  Calendar,
  Clock,
  Star,
  GraduationCap,
  CheckCircle2,
  Play,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Sparkles,
  AlertCircle,
  Lock,
} from 'lucide-react';
import chestXrayImg from '../../assets/images/chest_xray_critique_1793281724281.jpg';
import abdUsImg from '../../assets/images/abd_ultrasound_found_1793281739018.jpg';
import artifactsUsImg from '../../assets/images/artifacts_ultrasound_1793281710793.jpg';
import radHeroImg from '../../assets/images/transform_radiography_1793283872039.jpg';
import classesImg from '../../assets/images/onboarding_classes_1792606674536.jpg';

interface PrivateClassDetailPageProps {
  privateClass: PrivateClass;
  onBack: () => void;
  onViewMyRequests?: () => void;
}

type PageStep = 'details' | 'video_gate' | 'summary' | 'success';

function addDaysIso(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekdayName(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getPrivateClassFallbackImage(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('ultrasound') || cat.includes('sono')) return abdUsImg;
  if (cat.includes('mri') || cat.includes('ct')) return radHeroImg;
  if (cat.includes('x-ray') || cat.includes('plain') || cat.includes('anatomy')) return chestXrayImg;
  if (cat.includes('physics')) return artifactsUsImg;
  return classesImg;
}

export const PrivateClassDetailPage: React.FC<PrivateClassDetailPageProps> = ({
  privateClass,
  onBack,
  onViewMyRequests,
}) => {
  const { currentUser, requireAuth } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const ratingSummary = useContentRatingSummary('private_class', privateClass.id);

  const minStartDate = useMemo(() => addDaysIso(2), []);

  const [step, setStep] = useState<PageStep>('details');
  const [planType, setPlanType] = useState<'per_day' | 'monthly' | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video gate state
  const [videoWatchSeconds, setVideoWatchSeconds] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRefCode, setSubmittedRefCode] = useState<string>('');

  // Reset cleanly whenever class changes
  useEffect(() => {
    setStep('details');
    setPlanType(null);
    setSelectedDays([]);
    setSelectedTimeSlot('');
    setStartDate('');
    setNotes('');
    setErrorMessage(null);
    setVideoWatchSeconds(0);
    setVideoCompleted(false);
    setSubmittedRefCode('');
    scrollToTopInstant();
  }, [privateClass.id]);

  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [privateClass.id, step]);

  // Watch timer when user is on the mandatory promise video gate
  useEffect(() => {
    if (step !== 'video_gate' || videoCompleted) return;
    const timer = window.setInterval(() => {
      setVideoWatchSeconds((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setVideoCompleted(true);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, videoCompleted]);

  const availableDays = (privateClass.daysAvailable || []).slice(0, 3);
  const effectiveAvailableDays = availableDays.length > 0 ? availableDays : ['Monday'];

  const availableSlots = (
    privateClass.timeSlots?.length ? privateClass.timeSlots : ['5:00 PM - 7:00 PM WAT']
  ).map((s) => formatTime12h(s));

  const durationMinutes = Math.min(120, Math.max(30, privateClass.durationMinutes || 60));
  const durationHours = durationMinutes / 60;

  const perSessionNGN = Math.round((privateClass.chargePerHourNGN || 0) * durationHours);
  const perSessionUSD = Math.round((privateClass.chargePerHourUSD || 0) * durationHours * 100) / 100;

  const dayCount = Math.max(1, selectedDays.length);
  const perDayWeeklyNGN = perSessionNGN * dayCount;
  const perDayWeeklyUSD = Math.round(perSessionUSD * dayCount * 100) / 100;

  const unsubsidizedMonthNGN = perSessionNGN * Math.max(1, effectiveAvailableDays.length) * 4;
  const monthlyNGN = privateClass.monthlyChargeNGN || Math.round(unsubsidizedMonthNGN * 0.75);
  const monthlyUSD = privateClass.monthlyChargeUSD || Math.round((monthlyNGN / 1600) * 100) / 100;

  const calculatedAmountNGN = planType === 'monthly' ? monthlyNGN : perDayWeeklyNGN;
  const calculatedAmountUSD = planType === 'monthly' ? monthlyUSD : perDayWeeklyUSD;

  const allowedStartDays = useMemo(
    () =>
      planType === 'per_day' && selectedDays.length > 0
        ? selectedDays
        : effectiveAvailableDays,
    [planType, selectedDays, effectiveAvailableDays]
  );

  const pickedWeekday = useMemo(() => getWeekdayName(startDate), [startDate]);
  const startDateMatchesDay = Boolean(
    startDate &&
      startDate >= minStartDate &&
      pickedWeekday &&
      allowedStartDays.includes(pickedWeekday)
  );

  // Reveal tuition ONLY after the learner has completed their selections
  const isSelectionComplete = Boolean(
    planType &&
      (planType === 'monthly' || selectedDays.length > 0) &&
      selectedTimeSlot &&
      startDateMatchesDay
  );

  const fallbackImg = getPrivateClassFallbackImage(privateClass.category);
  const heroImg = privateClass.image?.trim() || fallbackImg;
  const embedUrl = getVideoEmbedUrl(privateClass.introVideoUrl, true);
  const isDirectVideoFile = Boolean(
    privateClass.introVideoUrl &&
      /\.(mp4|webm|ogg)(\?.*)?$/i.test(privateClass.introVideoUrl.trim())
  );

  const toggleDay = (day: string) => {
    setErrorMessage(null);
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleProceedToVideoGate = () => {
    setErrorMessage(null);

    if (!currentUser || currentUser.isGuest) {
      requireAuth({
        title: 'Sign In to Continue',
        message:
          'Please sign in or create a free StudiRad account first so we can verify your profile and coordinate your private class.',
        actionText: 'Sign In to Continue',
      });
      return;
    }

    if (!planType) {
      setErrorMessage('Please choose either Pick Preferred Days or Monthly Subscription first.');
      return;
    }

    if (planType === 'per_day' && selectedDays.length === 0) {
      setErrorMessage('Please select at least 1 available day for your private sessions.');
      return;
    }

    if (!selectedTimeSlot) {
      setErrorMessage('Please choose your preferred 12-hour time window.');
      return;
    }

    if (!startDate || startDate < minStartDate) {
      setErrorMessage(
        `Please pick a start date at least 2 days from today (${minStartDate} or later) so we can notify the instructor.`
      );
      return;
    }

    if (!pickedWeekday || !allowedStartDays.includes(pickedWeekday)) {
      setErrorMessage(
        `${startDate} falls on a ${pickedWeekday || 'different day'}. Your start date must match the tutor's selected day(s): ${allowedStartDays.join(', ')}.`
      );
      return;
    }

    setStep('video_gate');
  };

  const handleFinalSubmit = async () => {
    if (!currentUser || currentUser.isGuest || !planType) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    const effectiveDays =
      planType === 'monthly'
        ? effectiveAvailableDays
        : selectedDays;

    const res = await submitPrivateClassBooking({
      classId: privateClass.id,
      classTitle: privateClass.title,
      classCategory: privateClass.category,
      classLevel: privateClass.level,
      instructorId: privateClass.instructorId || '',
      instructorName: privateClass.instructorName,
      instructorPhone: privateClass.instructorPhone || '',
      studentId: currentUser.id,
      studentName: currentUser.fullName || 'StudiRad Learner',
      studentEmail: currentUser.email || '',
      studentRole: currentUser.role || 'Learner',
      planType,
      selectedDays: effectiveDays,
      selectedTimeSlot: formatTime12h(selectedTimeSlot),
      startDate,
      durationMinutes,
      amountNGN: calculatedAmountNGN,
      amountUSD: calculatedAmountUSD,
      displayCurrency: currency,
      notes: notes.trim() || '',
      videoWatched: true,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Could not submit your request. Please try again.');
      return;
    }

    setSubmittedRefCode(res.referenceCode);
    setStep('success');
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Page Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={step === 'video_gate' ? () => setStep('details') : step === 'summary' ? () => setStep('details') : onBack}
          className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-primary)] hover:border-[#f59e0b] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#f59e0b]" />
          <span>
            {step === 'details' || step === 'success'
              ? 'Back to Private Classes'
              : 'Back to Schedule'}
          </span>
        </button>

        <div className="text-xs font-bold text-[#f59e0b] tracking-wide uppercase">
          {privateClass.category} · {privateClass.level}
        </div>
      </div>

      {/* Main Page Container */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-xs">
        {/* Hero Image Header on Details Step */}
        {step === 'details' && (
          <div className="relative w-full h-52 sm:h-64 bg-[#002147] overflow-hidden">
            <img
              src={heroImg}
              alt={privateClass.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImg;
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-7">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold mb-1.5">
                <Star className={`w-4 h-4 ${ratingSummary.count > 0 ? 'fill-amber-400' : 'text-slate-300'}`} />
                <span>
                  {ratingSummary.count > 0
                    ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} ${ratingSummary.count === 1 ? 'review' : 'reviews'})`
                    : 'No ratings yet'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                {privateClass.title}
              </h1>
            </div>
          </div>
        )}

        {/* Sub-page Header for subsequent steps */}
        {step !== 'details' && (
          <div className="px-5 sm:px-7 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b] block mb-1">
              {privateClass.title}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
              {step === 'video_gate'
                ? 'Watch Instructor Class Promise'
                : step === 'summary'
                ? 'Confirm Account & Request Details'
                : 'Private Class Request Submitted'}
            </h2>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-7 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: CLASS OVERVIEW, INSTRUCTOR DETAILS & CUSTOM SELECTIONS     */}
          {/* ================================================================= */}
          {step === 'details' && (
            <>
              {/* Instructor Details & Academic Experience */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
                      Class Instructor
                    </span>
                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                      {privateClass.instructorName}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {privateClass.instructorRole} · {privateClass.academicExperience}
                    </p>
                  </div>

                  <StarRatingWidget itemType="private_class" itemId={privateClass.id} compact />
                </div>

                {privateClass.instructorBio && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                    {privateClass.instructorBio}
                  </p>
                )}

                <StarRatingWidget itemType="private_class" itemId={privateClass.id} interactive />
              </div>

              {/* Class Overview & Session Metadata (No Prices Here) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Class Overview</h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {privateClass.overview}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <span className="text-[11px] text-[var(--text-muted)] block">Duration per Session</span>
                    <span className="font-bold text-[var(--text-primary)] text-sm">
                      {durationMinutes} minutes
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <span className="text-[11px] text-[var(--text-muted)] block">Weekly Instructor Days</span>
                    <span className="font-bold text-[var(--text-primary)] text-sm">
                      {effectiveAvailableDays.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Mode Selection (No prices shown before selection is complete!) */}
              <div className="space-y-2.5">
                <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)] block">
                  1. Choose Your Enrollment Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanType('per_day');
                      setErrorMessage(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      planType === 'per_day'
                        ? 'bg-[#002147]/10 dark:bg-[#1B447A]/30 border-[#f59e0b] ring-2 ring-[#f59e0b]/20'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[#f59e0b]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[var(--text-primary)]">
                        Pick Preferred Days
                      </span>
                      {planType === 'per_day' && <CheckCircle2 className="w-4 h-4 text-[#f59e0b] shrink-0" />}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Select 1 to {effectiveAvailableDays.length} weekly day(s) suited to your timetable.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanType('monthly');
                      setErrorMessage(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      planType === 'monthly'
                        ? 'bg-[#002147]/10 dark:bg-[#1B447A]/30 border-[#f59e0b] ring-2 ring-[#f59e0b]/20'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[#f59e0b]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[var(--text-primary)]">
                        Monthly Subscription
                      </span>
                      {planType === 'monthly' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#f59e0b] shrink-0" />
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-500">Subsidized Plan</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Covers all {effectiveAvailableDays.length} weekly instructor slots at a discounted flat monthly rate.
                    </p>
                  </button>
                </div>
              </div>

              {/* Conditional Day Picker when per_day is selected */}
              {planType === 'per_day' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#f59e0b]" />
                      <span>2. Select Preferred Day(s) ({selectedDays.length} selected)</span>
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Up to {effectiveAvailableDays.length} days/week
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {effectiveAvailableDays.map((day) => {
                      const active = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            active
                              ? 'bg-[#002147] dark:bg-[#1B447A] text-white border-[#f59e0b]'
                              : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#f59e0b]/60'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${active ? 'text-[#f59e0b]' : 'text-[var(--text-muted)]'}`}
                          />
                          <span>{day}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {planType === 'monthly' && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    Monthly subscription covers weekly sessions on{' '}
                    <strong>{effectiveAvailableDays.join(', ')}</strong> at a subsidized rate.
                  </span>
                </div>
              )}

              {/* Time Window (12-Hour Format) & 2-Day Lead Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>Preferred Time Window (12-hr)</span>
                  </label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => {
                      setSelectedTimeSlot(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 h-11 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  >
                    <option value="">Select a time window...</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>Preferred Start Date</span>
                  </label>
                  <input
                    type="date"
                    min={minStartDate}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 h-11 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  />
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Earliest: <strong className="text-[var(--text-primary)]">{minStartDate}</strong> (2+ days notice) · Matches:{' '}
                    <strong className="text-[#f59e0b]">{allowedStartDays.join(', ')}</strong>
                  </p>
                  {startDate && startDate >= minStartDate && !startDateMatchesDay && (
                    <p className="text-[11px] font-bold text-rose-500">
                      {startDate} is a {pickedWeekday}. Pick a date falling on {allowedStartDays.join(', ')}.
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  Learning Focus / Questions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share specific topics, exam dates, or case areas you want prioritized..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] resize-none"
                />
              </div>

              {/* Tuition Breakdown — Strictly Hidden Until Selections Are Complete */}
              {isSelectionComplete ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#002147] dark:bg-[#0B1C36] text-white border border-[#1B447A] space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
                      Calculated Tuition Summary
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/10">
                      {(['NGN', 'USD'] as const).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrency(curr)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-colors cursor-pointer ${
                            currency === curr
                              ? 'bg-[#f59e0b] text-white'
                              : 'text-slate-200 hover:text-white'
                          }`}
                        >
                          {curr === 'NGN' ? '₦ NGN' : '$ USD'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {planType === 'monthly'
                          ? 'Monthly Subscription Total'
                          : `Weekly Total (${selectedDays.length} ${
                              selectedDays.length === 1 ? 'Day' : 'Days'
                            } × ${durationMinutes}m)`}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Time: {formatTime12h(selectedTimeSlot)} · Starts {startDate}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                        {formatMoney(calculatedAmountNGN, currency, calculatedAmountUSD)}
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        ≈{' '}
                        {formatMoney(
                          calculatedAmountNGN,
                          currency === 'NGN' ? 'USD' : 'NGN',
                          calculatedAmountUSD
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  Complete your enrollment option, day(s), time window, and start date above to reveal your personalized class fee before proceeding.
                </div>
              )}

              {/* Primary Page CTA */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Back to Classes
                </button>

                <button
                  type="button"
                  onClick={handleProceedToVideoGate}
                  className="w-full sm:w-auto min-h-[44px] px-8 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Watch this first</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* STEP 2: MANDATORY INSTRUCTOR PROMISE VIDEO GATE                   */}
          {/* ================================================================= */}
          {step === 'video_gate' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-start gap-3">
                <Play className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    Watch Before Submitting Request
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Please watch what <strong>{privateClass.instructorName}</strong> promises for this private class before confirming your account details and submitting.
                  </p>
                </div>
              </div>

              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-lg relative">
                {isDirectVideoFile ? (
                  <video
                    src={privateClass.introVideoUrl}
                    controls
                    autoPlay
                    onEnded={() => setVideoCompleted(true)}
                    className="w-full h-full object-contain"
                  />
                ) : embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={`${privateClass.instructorName} Promise Video`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                    <GraduationCap className="w-10 h-10 text-[#f59e0b]" />
                    <h4 className="text-sm font-bold">{privateClass.instructorName}’s Class Commitment</h4>
                    <p className="text-xs text-slate-300 max-w-md">
                      {privateClass.instructorBio || privateClass.overview}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs">
                {videoCompleted ? (
                  <span className="flex items-center gap-2 font-bold text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Promise video verified — you may now review your account &amp; submit.</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                    <Lock className="w-4 h-4 text-[#f59e0b]" />
                    <span>
                      Watching instructor commitment... unlocks in{' '}
                      <strong className="font-mono text-[#f59e0b]">
                        {Math.max(0, 5 - videoWatchSeconds)}s
                      </strong>
                    </span>
                  </span>
                )}
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Schedule</span>
                </button>
                <button
                  type="button"
                  disabled={!videoCompleted}
                  onClick={() => setStep('summary')}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Continue to Final Review</span>
                  <ArrowRight className="w-4 h-4 text-[#f59e0b]" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: FINAL ACCOUNT + REQUEST REVIEW BEFORE SUBMISSION          */}
          {/* ================================================================= */}
          {step === 'summary' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b] block">
                  Your Account Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#f59e0b] shrink-0" />
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">Full Name</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {currentUser?.fullName || 'Learner'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#f59e0b] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-[var(--text-muted)] block">Email Address</span>
                      <span className="font-bold text-[var(--text-primary)] truncate block">
                        {currentUser?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden text-xs sm:text-sm">
                <div className="p-4 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block">Selected Class</span>
                  <div className="font-extrabold text-[var(--text-primary)]">{privateClass.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    Instructor: {privateClass.instructorName} ({privateClass.academicExperience})
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Plan Type</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {planType === 'monthly' ? 'Monthly Subscription' : 'Picked Days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Start Date</span>
                    <span className="font-bold font-mono text-[var(--text-primary)]">{startDate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Days</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {(planType === 'monthly' ? effectiveAvailableDays : selectedDays).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Time &amp; Duration</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatTime12h(selectedTimeSlot)} ({durationMinutes}m)
                    </span>
                  </div>
                </div>

                {notes.trim() && (
                  <div className="p-4">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-0.5">Notes</span>
                    <p className="text-xs text-[var(--text-secondary)]">{notes.trim()}</p>
                  </div>
                )}

                <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-[#002147]/10 dark:bg-[#1B447A]/25">
                  <div className="space-y-1">
                    <span className="font-bold text-[var(--text-primary)] block">Agreed Rate</span>
                    <div className="flex items-center gap-1">
                      {(['NGN', 'USD'] as const).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrency(curr)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer ${
                            currency === curr
                              ? 'bg-[#f59e0b] text-white'
                              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold font-mono text-base text-[#f59e0b] block">
                      {formatMoney(calculatedAmountNGN, currency, calculatedAmountUSD)}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      ≈{' '}
                      {formatMoney(
                        calculatedAmountNGN,
                        currency === 'NGN' ? 'USD' : 'NGN',
                        calculatedAmountUSD
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                <span>
                  Once submitted, our admin team will notify your instructor and get back to you within <strong>24–48 hours</strong> with payment and classroom confirmation.
                </span>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep('details')}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Selection</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Final Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: CONFIRMATION SCREEN (24-48 HOURS PROMISE)                 */}
          {/* ================================================================= */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-bold font-mono">
                  Reference: {submittedRefCode}
                </span>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                  We Will Get Back to You in 24–48 Hours
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Your private class request for <strong>{privateClass.title}</strong> has been sent to the StudiRad Admin team. We will notify <strong>{privateClass.instructorName}</strong> and follow up with you at <strong>{currentUser?.email}</strong> within 24–48 hours.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {onViewMyRequests && (
                  <button
                    type="button"
                    onClick={() => {
                      onBack();
                      onViewMyRequests();
                    }}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-sm cursor-pointer"
                  >
                    Track in My Requests
                  </button>
                )}
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] text-white font-bold text-sm cursor-pointer"
                >
                  Back to Private Classes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
