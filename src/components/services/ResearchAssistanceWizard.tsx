import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AcademicLevel,
  ACADEMIC_LEVEL_OPTIONS,
  buildResearchWhatsAppMessage,
  buildWhatsAppUrl,
  getCategoryDefinition,
  getPriceForSelection,
  RESEARCH_CATEGORIES,
  RESEARCH_STAGES,
  ResearchServiceCategory,
  ResearchStageOption,
  RepresentativeInfo,
} from '../../services/researchAssistanceConfig';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileEdit,
  GraduationCap,
  HelpCircle,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';

interface ResearchAssistanceWizardProps {
  onViewMyRequests: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6; // Step 6 = Confirmation screen after backend save

const CATEGORY_ICONS: Record<ResearchServiceCategory, React.ReactNode> = {
  Consulting: <Compass className="w-6 h-6" />,
  Editing: <FileEdit className="w-6 h-6" />,
  'Data Analysis': <BarChart3 className="w-6 h-6" />,
  'Data Collection': <ClipboardCheck className="w-6 h-6" />,
  Others: <HelpCircle className="w-6 h-6" />,
};

const STEP_LABELS: { step: number; label: string }[] = [
  { step: 1, label: 'Level' },
  { step: 2, label: 'Category' },
  { step: 3, label: 'Package' },
  { step: 4, label: 'Details' },
  { step: 5, label: 'Review' },
];

export const ResearchAssistanceWizard: React.FC<ResearchAssistanceWizardProps> = ({
  onViewMyRequests,
}) => {
  const { currentUser } = useAuth();
  const { submitResearchRequest } = useRequests();

  const [step, setStep] = useState<WizardStep>(1);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ResearchServiceCategory | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [othersDescription, setOthersDescription] = useState('');

  // Step 4: Details Form
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [researchTopic, setResearchTopic] = useState('');
  const [currentStage, setCurrentStage] = useState<ResearchStageOption | ''>('');
  const [customStage, setCustomStage] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');

  // Validation, submission, and confirmation states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<{
    referenceCode: string;
    assignedRep?: RepresentativeInfo;
    whatsappUrl: string;
    submittedAt: string;
  } | null>(null);

  const whatsappAutoAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const containerTopRef = useRef<HTMLDivElement | null>(null);

  // Sync user profile defaults cleanly without overwriting user edits
  useEffect(() => {
    if (currentUser?.fullName && !fullName) {
      setFullName(currentUser.fullName);
    }
    if (currentUser?.email && !email) {
      setEmail(currentUser.email);
    }
  }, [currentUser?.fullName, currentUser?.email]);

  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const scrollToWizardTop = () => {
    setErrorMessage(null);
    containerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const activeCategoryDef = useMemo(
    () => (selectedCategory ? getCategoryDefinition(selectedCategory) : null),
    [selectedCategory]
  );

  const activePriceDisplay = useMemo(() => {
    if (!selectedCategory || !academicLevel) return undefined;
    return getPriceForSelection(selectedCategory, academicLevel);
  }, [selectedCategory, academicLevel]);

  const resolvedStageText = useMemo(() => {
    if (!currentStage) return '';
    if (currentStage === 'Others') {
      return customStage.trim() ? `Others: ${customStage.trim()}` : 'Others';
    }
    return currentStage;
  }, [currentStage, customStage]);

  // Handlers
  const handleSelectAcademicLevel = (level: AcademicLevel) => {
    setAcademicLevel(level);
    setErrorMessage(null);
    setStep(2);
    scrollToWizardTop();
  };

  const handleSelectCategory = (category: ResearchServiceCategory) => {
    const def = getCategoryDefinition(category);
    setSelectedCategory(category);
    setSelectedServices(def.services.length > 0 ? [...def.services] : []);
    setErrorMessage(null);
    setStep(3);
    scrollToWizardTop();
  };

  const handleProceedFromPackage = () => {
    if (!selectedCategory) return;
    if (selectedCategory === 'Others' && !othersDescription.trim()) {
      setErrorMessage('Tell us briefly what research assistance you need before proceeding.');
      return;
    }
    setErrorMessage(null);
    setStep(4);
    scrollToWizardTop();
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const emailTrimmed = email.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!researchTopic.trim()) {
      setErrorMessage('Please enter your research topic, or write "No topic yet".');
      return;
    }
    if (!currentStage) {
      setErrorMessage('Please select your current research stage.');
      return;
    }
    if (currentStage === 'Others' && !customStage.trim()) {
      setErrorMessage('Please specify your current research stage.');
      return;
    }
    if (!targetDeadline) {
      setErrorMessage('Please choose your target deadline.');
      return;
    }

    setStep(5);
    scrollToWizardTop();
  };

  const handleConfirmAndSubmit = async () => {
    if (!academicLevel || !selectedCategory) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    const servicesForRecord =
      selectedCategory === 'Others'
        ? ['Custom Research Assistance']
        : selectedCategory === 'Data Collection'
        ? ['Research Data Gathering Support']
        : selectedServices;

    const previewMessage = buildResearchWhatsAppMessage({
      fullName: fullName.trim(),
      email: email.trim(),
      academicLevel,
      researchTopic: researchTopic.trim(),
      currentStage: resolvedStageText,
      targetDeadline,
      serviceCategory: selectedCategory,
      selectedServices: servicesForRecord,
      additionalDescription: othersDescription.trim() || undefined,
      priceDisplay: activePriceDisplay,
    });

    const res = await submitResearchRequest({
      userName: fullName.trim(),
      userEmail: email.trim(),
      researchTitle: researchTopic.trim(),
      discipline: `Academic Level: ${academicLevel}`,
      assistanceType: `${selectedCategory}${servicesForRecord.length ? ` — ${servicesForRecord.join(', ')}` : ''}`,
      currentStage: resolvedStageText,
      customStage: currentStage === 'Others' ? customStage.trim() : undefined,
      supportDetails:
        selectedCategory === 'Others'
          ? othersDescription.trim()
          : servicesForRecord.join(', '),
      deadline: targetDeadline,
      academicLevel,
      serviceCategory: selectedCategory,
      selectedServices: servicesForRecord,
      priceDisplay: activePriceDisplay,
      othersDescription: othersDescription.trim() || undefined,
      whatsappMessage: previewMessage,
    });

    setIsSubmitting(false);

    if (!res.success || !res.referenceCode) {
      setErrorMessage(res.error || 'Could not save your request. Please try again.');
      return;
    }

    const assignedRep = res.assignedRepresentative;
    const finalMessage = buildResearchWhatsAppMessage({
      referenceCode: res.referenceCode,
      fullName: fullName.trim(),
      email: email.trim(),
      academicLevel,
      researchTopic: researchTopic.trim(),
      currentStage: resolvedStageText,
      targetDeadline,
      serviceCategory: selectedCategory,
      selectedServices: servicesForRecord,
      additionalDescription: othersDescription.trim() || undefined,
      priceDisplay: activePriceDisplay,
    });

    const waNumber = assignedRep?.whatsappNumber || '2349029729621';
    const waUrl = buildWhatsAppUrl(waNumber, finalMessage);

    setSubmittedRecord({
      referenceCode: res.referenceCode,
      assignedRep,
      whatsappUrl: waUrl,
      submittedAt: res.submittedAt || new Date().toISOString(),
    });
    setStep(6);
    scrollToWizardTop();

    // Launch WhatsApp via anchor element after confirmation state mounts cleanly
    setTimeout(() => {
      whatsappAutoAnchorRef.current?.click();
    }, 150);
  };

  const handleResetWizard = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedServices([]);
    setOthersDescription('');
    setResearchTopic('');
    setCurrentStage('');
    setCustomStage('');
    setTargetDeadline('');
    setSubmittedRecord(null);
    setErrorMessage(null);
    scrollToWizardTop();
  };

  return (
    <div
      ref={containerTopRef}
      className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-8 lg:p-10 border border-[var(--border-subtle)] shadow-sm space-y-6 text-left"
    >
      {/* Hidden anchor used to launch pre-filled WhatsApp chat once request is persisted */}
      {submittedRecord && (
        <a
          ref={whatsappAutoAnchorRef}
          href={submittedRecord.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden"
          aria-hidden="true"
        >
          Launch WhatsApp
        </a>
      )}

      {/* Progress Stepper (Steps 1 - 5) */}
      {step < 6 && (
        <div className="space-y-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
            {STEP_LABELS.map((item, idx) => {
              const isCompleted = step > item.step;
              const isCurrent = step === item.step;
              const isClickable = item.step < step;
              return (
                <React.Fragment key={item.step}>
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => {
                      if (isClickable) {
                        setErrorMessage(null);
                        setStep(item.step as WizardStep);
                      }
                    }}
                    className={`flex items-center gap-2 shrink-0 min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 cursor-pointer'
                        : 'text-[var(--text-muted)] cursor-default'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-[#FF7F32] text-white'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : item.step}
                    </span>
                    <span>{item.label}</span>
                  </button>
                  {idx < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-[2px] flex-1 min-w-[14px] rounded-full ${
                        step > item.step ? 'bg-emerald-500/60' : 'bg-[var(--border-subtle)]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Retained Context Strip for Steps 2–5 */}
          {step >= 2 && academicLevel && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#002147]/10 dark:bg-white/10 text-[var(--text-primary)] font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 text-[#FF7F32]" />
                  <span>Level: {academicLevel}</span>
                </span>
                {step >= 3 && selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF7F32]/15 text-[#FF7F32] font-semibold">
                    <span>Package: {selectedCategory}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                className="text-xs font-bold text-[#FF7F32] hover:underline min-h-[32px] px-2 cursor-pointer"
              >
                Change Level
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline Validation / Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 1: ACADEMIC LEVEL SELECTION                                      */}
      {/* ===================================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
              Step 1 of 5
            </span>
            <h2 className="heading-section text-[var(--text-primary)]">
              Select Your Current Academic Level
            </h2>
            <p className="body-standard text-[var(--text-secondary)]">
              Your academic level determines applicable research pricing and tailors our support package to your study requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACADEMIC_LEVEL_OPTIONS.map((opt) => {
              const isSelected = academicLevel === opt.level;
              return (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleSelectAcademicLevel(opt.level)}
                  className={`group relative text-left p-5 sm:p-6 rounded-2xl border transition-all min-h-[112px] flex items-start justify-between gap-4 cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#002147]/5 dark:bg-[#1B447A]/25 border-[#FF7F32] ring-2 ring-[#FF7F32]/25'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[#FF7F32]/70 hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#FF7F32] text-white'
                            : 'bg-[#002147]/10 dark:bg-white/10 text-[#002147] dark:text-[#FF7F32] group-hover:bg-[#FF7F32] group-hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-extrabold text-[var(--text-primary)]">
                        {opt.title}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {opt.subtitle}
                    </p>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1 transition-all ${
                      isSelected
                        ? 'bg-[#FF7F32] text-white'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] group-hover:border-[#FF7F32] group-hover:text-[#FF7F32]'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 2: SERVICE CATEGORY SELECTION                                    */}
      {/* ===================================================================== */}
      {step === 2 && academicLevel && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
              Step 2 of 5 · {academicLevel} Research Support
            </span>
            <h2 className="heading-section text-[var(--text-primary)]">
              Choose a Research Service Category
            </h2>
            <p className="body-standard text-[var(--text-secondary)]">
              Select the category that best describes the support you need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESEARCH_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`group text-left p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 min-h-[152px] cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#002147]/5 dark:bg-[#1B447A]/25 border-[#FF7F32] ring-2 ring-[#FF7F32]/25'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[#FF7F32]/70 hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#FF7F32] text-white'
                            : 'bg-[#002147]/10 dark:bg-white/10 text-[#002147] dark:text-[#FF7F32] group-hover:bg-[#FF7F32] group-hover:text-white'
                        }`}
                      >
                        {CATEGORY_ICONS[cat.id]}
                      </div>

                      <span className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[#FF7F32] group-hover:text-[#FF7F32] transition-colors shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                        {cat.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                        {cat.shortDescription}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep(1);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Academic Level</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 3: PACKAGE DETAILS, SERVICES & DYNAMIC PRICING                   */}
      {/* ===================================================================== */}
      {step === 3 && academicLevel && activeCategoryDef && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
                Step 3 of 5 · Package Overview
              </span>
              <h2 className="heading-section text-[var(--text-primary)]">
                {activeCategoryDef.title} Package
              </h2>
            </div>

            {/* Live Academic Level Switcher so prices recalculate immediately */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] self-start">
              {ACADEMIC_LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => setAcademicLevel(opt.level)}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    academicLevel === opt.level
                      ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.level}
                </button>
              ))}
            </div>
          </div>

          {/* Guide Copy */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#FF7F32] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
              "{activeCategoryDef.guideText}"
            </p>
          </div>

          {/* CATEGORY 1-3: Services Included (Read-only display) */}
          {(activeCategoryDef.id === 'Consulting' ||
            activeCategoryDef.id === 'Editing' ||
            activeCategoryDef.id === 'Data Analysis') && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Services Included in {activeCategoryDef.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCategoryDef.services.map((serviceItem) => (
                  <div
                    key={serviceItem}
                    className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center gap-3 text-[var(--text-primary)]"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#FF7F32] shrink-0" />
                    <span className="text-sm font-semibold">{serviceItem}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY 4: Data Collection Intro (NO FIXED PRICE) */}
          {activeCategoryDef.id === 'Data Collection' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-bold text-base">
                <ClipboardCheck className="w-5 h-5 text-[#FF7F32]" />
                <span>Customized Fieldwork & Data Gathering Quotation</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Whether you require clinical hospital data extraction, questionnaire distribution, or multi-centre sampling across Nigeria or abroad, our research team coordinates ethics-aligned data gathering tailored to your study protocol.
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[#FF7F32]">
                {activeCategoryDef.reassuranceNote}
              </p>
            </div>
          )}

          {/* CATEGORY 5: Others Custom Description Prompt */}
          {activeCategoryDef.id === 'Others' && (
            <div className="space-y-2.5">
              <label className="block text-sm font-bold text-[var(--text-primary)]">
                Tell us briefly what research assistance you need <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={othersDescription}
                onChange={(e) => {
                  setOthersDescription(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Describe your research request (e.g., systematic review screening, manuscript preparation, Turnitin similarity reduction, or poster design)..."
                className="w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>
          )}

          {/* Dynamic Price Card for Fixed/Range Categories ONLY (Never shown on Data Collection or Others) */}
          {activeCategoryDef.hasFixedPricing && activePriceDisplay && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#002147] dark:bg-[#0B1C36] text-white border border-[#1B447A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32] block">
                  {activeCategoryDef.priceLabel} · {academicLevel} Level
                </span>
                <p className="text-xs text-slate-300">
                  Final scope is confirmed directly with your assigned Research Representative.
                </p>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white shrink-0">
                {activePriceDisplay}
              </div>
            </div>
          )}

          {/* Action CTA & Reassurance Note */}
          <div className="pt-2 space-y-4">
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(2);
                }}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Categories</span>
              </button>

              <button
                type="button"
                onClick={handleProceedFromPackage}
                className="min-h-[48px] px-7 py-3.5 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-[#FF7F32]/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Talk to us first</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {activeCategoryDef.id !== 'Data Collection' && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] text-center sm:text-right leading-relaxed">
                {activeCategoryDef.reassuranceNote}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 4: RESEARCH REQUEST DETAILS FORM                                 */}
      {/* ===================================================================== */}
      {step === 4 && academicLevel && selectedCategory && (
        <form onSubmit={handleProceedToReview} className="space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
              Step 4 of 5 · Request Details
            </span>
            <h2 className="heading-section text-[var(--text-primary)]">
              Complete Your Research Brief
            </h2>
            <p className="body-standard text-[var(--text-secondary)]">
              Provide your contact details and project timeline so your assigned representative is prepared before your WhatsApp conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF7F32]" />
                <span>Full Name <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FF7F32]" />
                <span>Email Address <span className="text-red-500">*</span></span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>
          </div>

          {/* Research Topic */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                Research Topic <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setResearchTopic('No topic yet')}
                className="text-xs font-semibold text-[#FF7F32] hover:underline cursor-pointer"
              >
                Use &ldquo;No topic yet&rdquo;
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              If you have not chosen a topic yet, enter <strong className="text-[var(--text-primary)]">&ldquo;No topic yet&rdquo;</strong>.
            </p>
            <input
              type="text"
              required
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              placeholder='Enter your working research topic or "No topic yet"'
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Current Research Stage */}
          <div className="space-y-2.5">
            <label className="block text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              Current Research Stage <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {RESEARCH_STAGES.map((stage) => {
                const active = currentStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => {
                      setCurrentStage(stage);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#002147] dark:bg-[#1B447A] text-white border-[#FF7F32]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[#FF7F32]/60'
                    }`}
                  >
                    <span>{stage}</span>
                    {active && <Check className="w-4 h-4 text-[#FF7F32] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {currentStage === 'Others' && (
              <div className="pt-2">
                <input
                  type="text"
                  required
                  value={customStage}
                  onChange={(e) => setCustomStage(e.target.value)}
                  placeholder="Specify your current research stage"
                  className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[#FF7F32]/60 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
                />
              </div>
            )}
          </div>

          {/* Target Deadline (Date Picker) */}
          <div className="flex flex-col gap-1.5 max-w-sm">
            <label className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF7F32]" />
              <span>Target Deadline <span className="text-red-500">*</span></span>
            </label>
            <input
              type="date"
              required
              min={todayIso}
              value={targetDeadline}
              onChange={(e) => setTargetDeadline(e.target.value)}
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep(3);
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Package</span>
            </button>

            <button
              type="submit"
              className="min-h-[48px] px-7 py-3.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Review Request Summary</span>
              <ArrowRight className="w-4 h-4 text-[#FF7F32]" />
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* STEP 5: FINAL REVIEW & CONFIRMATION BEFORE BACKEND + WHATSAPP         */}
      {/* ===================================================================== */}
      {step === 5 && academicLevel && selectedCategory && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
              Step 5 of 5 · Review & Confirm
            </span>
            <h2 className="heading-section text-[var(--text-primary)]">
              Confirm Your Research Request
            </h2>
            <p className="body-standard text-[var(--text-secondary)]">
              Please review your details below. Submitting saves your request to our system and connects you directly with an available Research Representative on WhatsApp.
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Full Name</span>
                <span className="font-semibold text-[var(--text-primary)]">{fullName}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Email Address</span>
                <span className="font-semibold text-[var(--text-primary)]">{email}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Academic Level</span>
                <span className="font-bold text-[#FF7F32]">{academicLevel}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Service Category</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedCategory}</span>
              </div>
            </div>

            {selectedCategory !== 'Others' && selectedServices.length > 0 && (
              <div className="p-4 sm:p-5 text-sm space-y-1.5">
                <span className="text-xs font-bold text-[var(--text-muted)] block">
                  Selected Service(s)
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map((srv) => (
                    <span
                      key={srv}
                      className="px-3 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {othersDescription.trim() && (
              <div className="p-4 sm:p-5 text-sm space-y-1">
                <span className="text-xs font-bold text-[var(--text-muted)] block">
                  Additional Description
                </span>
                <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {othersDescription.trim()}
                </p>
              </div>
            )}

            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="sm:col-span-1">
                <span className="text-xs font-bold text-[var(--text-muted)] block">Research Topic</span>
                <span className="font-semibold text-[var(--text-primary)]">{researchTopic}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Current Stage</span>
                <span className="font-semibold text-[var(--text-primary)]">{resolvedStageText}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Target Deadline</span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">{targetDeadline}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between bg-[#002147]/5 dark:bg-[#1B447A]/20 text-sm">
              <span className="font-bold text-[var(--text-primary)]">
                {selectedCategory === 'Consulting'
                  ? 'Consultation Price'
                  : activePriceDisplay
                  ? 'Estimated Price Range'
                  : 'Quotation'}
              </span>
              <span className="font-extrabold font-mono text-base text-[#FF7F32]">
                {activePriceDisplay || 'Provided by Representative'}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setErrorMessage(null);
                setStep(4);
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Edit Details</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmAndSubmit}
              className="min-h-[48px] px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Request...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Confirm &amp; Speak on WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 6: LOGGED CONFIRMATION & WHATSAPP LAUNCHER                       */}
      {/* ===================================================================== */}
      {step === 6 && submittedRecord && (
        <div className="py-4 space-y-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              Status: New Request
            </span>
            <h2 className="heading-section text-[var(--text-primary)]">
              Request Saved &amp; Ready for WhatsApp
            </h2>
            <p className="body-standard text-[var(--text-secondary)]">
              Your research request has been recorded under reference{' '}
              <strong className="font-mono text-[var(--text-primary)]">
                {submittedRecord.referenceCode}
              </strong>{' '}
              and assigned to{' '}
              <strong className="text-[var(--text-primary)]">
                {submittedRecord.assignedRep?.label || 'Research Representative'} (
                {submittedRecord.assignedRep?.displayPhone || '09029729621'})
              </strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-left text-xs sm:text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Reference ID</span>
              <span className="font-mono font-bold text-[#FF7F32]">{submittedRecord.referenceCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Assigned Representative</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {submittedRecord.assignedRep?.label} ({submittedRecord.assignedRep?.displayPhone})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Academic Level &amp; Category</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {academicLevel} · {selectedCategory}
              </span>
            </div>
            {activePriceDisplay && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Displayed Price</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{activePriceDisplay}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={submittedRecord.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Open WhatsApp Chat with Representative</span>
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onViewMyRequests}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#FF7F32]" />
                <span>Track in My Requests</span>
              </button>

              <button
                type="button"
                onClick={handleResetWizard}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New Research Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
