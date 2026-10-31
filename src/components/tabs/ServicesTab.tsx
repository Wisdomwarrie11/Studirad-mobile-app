import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests, UserRequest } from '../../context/RequestContext';
import { 
  FileSpreadsheet, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ClipboardList, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Trash2,
  Eye
} from 'lucide-react';

interface ServicesTabProps {
  onBookTutor?: (tutor: any) => void;
  onRequestResearch?: (service: any) => void;
  activeBookings?: any[];
}

export const ServicesTab: React.FC<ServicesTabProps> = () => {
  const { currentUser } = useAuth();
  const { 
    requests, 
    submitServiceRequest, 
    submitResearchRequest, 
    submitPrivateClassRequest, 
    cancelRequest 
  } = useRequests();

  const [activeFormTab, setActiveFormTab] = useState<'private_class' | 'research' | 'service' | 'my_requests'>('private_class');

  // Form feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<UserRequest | null>(null);

  // A. Private Class Form State
  const [pcName, setPcName] = useState(currentUser?.fullName || '');
  const [pcEmail, setPcEmail] = useState(currentUser?.email || '');
  const [pcSubject, setPcSubject] = useState('');
  const [pcKnowledgeLevel, setPcKnowledgeLevel] = useState('Qualified Radiographer');
  const [pcLearningObjectives, setPcLearningObjectives] = useState('');
  const [pcFormat, setPcFormat] = useState<'Online 1-on-1' | 'Group Tutorial' | 'Case Study Review'>('Online 1-on-1');
  const [pcSchedule, setPcSchedule] = useState('Weekday Evenings (after 18:00 BST)');
  const [pcSpecialNeeds, setPcSpecialNeeds] = useState('');

  // B. Research Assistance Form State
  const [resName, setResName] = useState(currentUser?.fullName || '');
  const [resEmail, setResEmail] = useState(currentUser?.email || '');
  const [resTitle, setResTitle] = useState('');
  const [resDiscipline, setResDiscipline] = useState('General Diagnostic Radiography');
  const [resAssistanceType, setResAssistanceType] = useState('SPSS Biostatistics & Quantitative Analysis');
  const [resCurrentStage, setResCurrentStage] = useState('Data Collection / Protocol Design');
  const [resSupportDetails, setResSupportDetails] = useState('');
  const [resDeadline, setResDeadline] = useState('Within 2 to 3 Weeks');
  const [resNotes, setResNotes] = useState('');

  // C. Clinical Services Form State
  const [srvName, setSrvName] = useState(currentUser?.fullName || '');
  const [srvEmail, setSrvEmail] = useState(currentUser?.email || '');
  const [srvCategory, setSrvCategory] = useState('Clinical Audit & DRL Dose Review');
  const [srvDescription, setSrvDescription] = useState('');
  const [srvTimeline, setSrvTimeline] = useState('Standard (within 14 days)');
  const [srvHospital, setSrvHospital] = useState('');
  const [srvNotes, setSrvNotes] = useState('');

  // Submit Handlers
  const handlePrivateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!pcSubject.trim() || !pcLearningObjectives.trim()) {
      setErrorMessage('Please fill in the required topic and learning objectives.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitPrivateClassRequest({
      userName: pcName || 'Radiographer',
      userEmail: pcEmail || 'contact@studirad.org',
      subjectTopic: pcSubject.trim(),
      currentKnowledgeLevel: pcKnowledgeLevel,
      learningObjectives: pcLearningObjectives.trim(),
      preferredFormat: pcFormat,
      preferredSchedule: pcSchedule,
      specialNeeds: pcSpecialNeeds.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.referenceCode) {
      setSuccessReference(res.referenceCode);
      setPcSubject('');
      setPcLearningObjectives('');
      setPcSpecialNeeds('');
    } else {
      setErrorMessage(res.error || 'Failed to submit request.');
    }
  };

  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!resTitle.trim() || !resSupportDetails.trim()) {
      setErrorMessage('Please fill in your research proposed title and support requirements.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitResearchRequest({
      userName: resName || 'Researcher',
      userEmail: resEmail || 'contact@studirad.org',
      researchTitle: resTitle.trim(),
      discipline: resDiscipline,
      assistanceType: resAssistanceType,
      currentStage: resCurrentStage,
      supportDetails: resSupportDetails.trim(),
      deadline: resDeadline,
      methodologyNotes: resNotes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.referenceCode) {
      setSuccessReference(res.referenceCode);
      setResTitle('');
      setResSupportDetails('');
      setResNotes('');
    } else {
      setErrorMessage(res.error || 'Failed to submit request.');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!srvDescription.trim()) {
      setErrorMessage('Please describe the service required.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitServiceRequest({
      userName: srvName || 'Clinician',
      userEmail: srvEmail || 'contact@studirad.org',
      serviceType: srvCategory,
      description: srvDescription.trim(),
      timeline: srvTimeline,
      departmentOrHospital: srvHospital.trim() || undefined,
      additionalNotes: srvNotes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.referenceCode) {
      setSuccessReference(res.referenceCode);
      setSrvDescription('');
      setSrvHospital('');
      setSrvNotes('');
    } else {
      setErrorMessage(res.error || 'Failed to submit request.');
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 sm:space-y-8 py-6 sm:py-8 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto text-left pb-44 sm:pb-48">
      {/* Title & Introduction */}
      <div className="space-y-2">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FF7F32]">
          Clinical & Academic Request Center
        </span>
        <h1 className="heading-display text-[var(--text-primary)]">
          Submit & Track Requests
        </h1>
        <p className="body-large text-[var(--text-secondary)] max-w-3xl">
          Request bespoke 1-on-1 tutoring from consultant radiographers, academic assistance for dissertation and statistics, or clinical audit review for your department.
        </p>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="w-full bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-subtle)] flex items-center overflow-x-auto no-scrollbar gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveFormTab('private_class');
            setSuccessReference(null);
            setErrorMessage(null);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 ${
            activeFormTab === 'private_class'
              ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-[#FF7F32]" />
          <span>Private Classes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveFormTab('research');
            setSuccessReference(null);
            setErrorMessage(null);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 ${
            activeFormTab === 'research'
              ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#FF7F32]" />
          <span>Research Assistance</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveFormTab('service');
            setSuccessReference(null);
            setErrorMessage(null);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 ${
            activeFormTab === 'service'
              ? 'bg-[#002147] dark:bg-[#1B447A] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#FF7F32]" />
          <span>Clinical Services</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveFormTab('my_requests');
            setSuccessReference(null);
            setErrorMessage(null);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 ${
            activeFormTab === 'my_requests'
              ? 'bg-[#FF7F32] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>My Requests ({requests.length})</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successReference && (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="heading-card text-emerald-200">
                Request Successfully Logged!
              </h3>
              <p className="body-standard text-emerald-300/90 pt-1">
                Your tracking reference is <strong className="font-mono text-white text-base">{successReference}</strong>. Our clinical coordinator will review your specifications.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveFormTab('my_requests');
              setSuccessReference(null);
            }}
            className="px-5 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shrink-0 transition-colors"
          >
            Track in My Requests →
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. PRIVATE CLASSES REQUEST FORM */}
      {activeFormTab === 'private_class' && (
        <form onSubmit={handlePrivateClassSubmit} className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-10 border border-[var(--border-subtle)] shadow-sm space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h2 className="heading-section text-[var(--text-primary)]">
              Book a Private Tutoring Class
            </h2>
            <p className="body-standard text-[var(--text-secondary)] mt-1">
              Match 1-on-1 with accredited university educators and consultant radiographers for case critiques, examination preparation, or specialized imaging modalities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={pcName}
                onChange={(e) => setPcName(e.target.value)}
                placeholder="e.g. Chukwudi Okafor, BSc Radiography"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={pcEmail}
                onChange={(e) => setPcEmail(e.target.value)}
                placeholder="c.okafor@uch-ibadan.org.ng"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Current Knowledge Level */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Current Level of Knowledge <span className="text-red-400">*</span>
              </label>
              <select
                value={pcKnowledgeLevel}
                onChange={(e) => setPcKnowledgeLevel(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="1st Year Radiography Student">1st Year Radiography Student</option>
                <option value="Final Year / Pre-Registration Student">Final Year / Pre-Registration Student</option>
                <option value="Qualified Band 5 Radiographer">Qualified Band 5 Radiographer</option>
                <option value="Senior Band 6 Radiographer (CT/MRI Specialist)">Senior Band 6 Radiographer (CT/MRI Specialist)</option>
                <option value="Advanced Clinical Practitioner / Registrar">Advanced Clinical Practitioner / Registrar</option>
              </select>
            </div>

            {/* Preferred Format */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Preferred Class Format <span className="text-red-400">*</span>
              </label>
              <select
                value={pcFormat}
                onChange={(e) => setPcFormat(e.target.value as any)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="Online 1-on-1">Online 1-on-1 (Video Call & Screen Share)</option>
                <option value="Case Study Review">Case Study Review (PACS Image Critique)</option>
                <option value="Group Tutorial">Group Tutorial (Max 4 Learners)</option>
              </select>
            </div>
          </div>

          {/* Subject or Topic */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Subject or Topic to Learn <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pcSubject}
              onChange={(e) => setPcSubject(e.target.value)}
              placeholder="e.g. Trauma Radiography: Clearing the Cervical Spine & Pelvic Ring Fractures"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Learning Objectives */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Specific Learning Objectives & Goals <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={pcLearningObjectives}
              onChange={(e) => setPcLearningObjectives(e.target.value)}
              placeholder="What specific clinical questions, imaging artifacts, or exam viva topics would you like the tutor to focus on?"
              className="w-full p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Preferred Schedule */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Preferred Schedule & Availability <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pcSchedule}
              onChange={(e) => setPcSchedule(e.target.value)}
              placeholder="e.g. Weekdays after 18:00 WAT, or Saturday mornings"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Additional Learning Needs */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Additional Notes or Special Learning Requirements (Optional)
            </label>
            <input
              type="text"
              value={pcSpecialNeeds}
              onChange={(e) => setPcSpecialNeeds(e.target.value)}
              placeholder="e.g. Preparing for Radiographers Registration Board exams, need anonymized DICOM files"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-6 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] max-w-sm">
              All requests are reviewed by our clinical academic dean.
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF7F32]/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Submit Class Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 2. RESEARCH ASSISTANCE REQUEST FORM */}
      {activeFormTab === 'research' && (
        <form onSubmit={handleResearchSubmit} className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-10 border border-[var(--border-subtle)] shadow-sm space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h2 className="heading-section text-[var(--text-primary)]">
              Research & Dissertation Support Request
            </h2>
            <p className="body-standard text-[var(--text-secondary)] mt-1">
              Receive structured guidance on undergraduate BSc dissertation design, MSc systematic reviews, SPSS/R medical statistics, and publication editing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Researcher Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                placeholder="e.g. Dr. Amina Bello, MSc"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Academic Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={resEmail}
                onChange={(e) => setResEmail(e.target.value)}
                placeholder="amina.bello@unilag.edu.ng"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Discipline */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Imaging Discipline <span className="text-red-400">*</span>
              </label>
              <select
                value={resDiscipline}
                onChange={(e) => setResDiscipline(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="General Diagnostic Radiography">General Diagnostic Radiography</option>
                <option value="Computed Tomography (CT)">Computed Tomography (CT)</option>
                <option value="Magnetic Resonance Imaging (MRI)">Magnetic Resonance Imaging (MRI)</option>
                <option value="Ultrasound & Vascular Sonography">Ultrasound & Vascular Sonography</option>
                <option value="Radiation Protection & Dosimetry">Radiation Protection & Dosimetry</option>
                <option value="Nuclear Medicine & PET-CT">Nuclear Medicine & PET-CT</option>
              </select>
            </div>

            {/* Type of Assistance */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Type of Support Required <span className="text-red-400">*</span>
              </label>
              <select
                value={resAssistanceType}
                onChange={(e) => setResAssistanceType(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="SPSS Biostatistics & Quantitative Analysis">SPSS Biostatistics & Quantitative Analysis</option>
                <option value="Methodology & Research Proposal Design">Methodology & Research Proposal Design</option>
                <option value="Literature Review & PRISMA Framework">Literature Review & PRISMA Framework</option>
                <option value="Academic Proofreading & Journal Submission">Academic Proofreading & Journal Submission</option>
                <option value="Clinical Audit Protocol Design">Clinical Audit Protocol Design</option>
              </select>
            </div>
          </div>

          {/* Research Title */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Research Topic or Working Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder="e.g. Evaluation of Noise Reduction Filters in Ultra-Low Dose Pediatric Chest CT"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Current Stage */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Current Stage of Research <span className="text-red-400">*</span>
              </label>
              <select
                value={resCurrentStage}
                onChange={(e) => setResCurrentStage(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="Idea & Research Proposal">Idea & Research Proposal</option>
                <option value="Ethics & Governance Review">Ethics & Governance Review</option>
                <option value="Data Collection / Protocol Design">Data Collection / Protocol Design</option>
                <option value="Statistical Analysis & Interpretation">Statistical Analysis & Interpretation</option>
                <option value="Draft Writing & Revision">Draft Writing & Revision</option>
              </select>
            </div>

            {/* Deadline */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Target Deadline <span className="text-red-400">*</span>
              </label>
              <select
                value={resDeadline}
                onChange={(e) => setResDeadline(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="Urgent (within 7 days)">Urgent (within 7 days)</option>
                <option value="Within 2 to 3 Weeks">Within 2 to 3 Weeks</option>
                <option value="1 Month">1 Month</option>
                <option value="More than 2 Months">More than 2 Months</option>
              </select>
            </div>
          </div>

          {/* Description of Support Needed */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Description of Specific Support Needed <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={resSupportDetails}
              onChange={(e) => setResSupportDetails(e.target.value)}
              placeholder="Detail your sample size, specific statistical tests (e.g. Cohen's kappa, ANOVA), data variables, or university rubric guidelines..."
              className="w-full p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Methodology Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Relevant Notes or Software Used (Optional)
            </label>
            <input
              type="text"
              value={resNotes}
              onChange={(e) => setResNotes(e.target.value)}
              placeholder="e.g. SPSS v29, EndNote, PRISMA 2020 flow, anonymized CSV"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-6 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] max-w-sm">
              Strict academic confidentiality and research standards enforced.
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#FF7F32]" />
                  <span>Submit Research Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 3. CLINICAL SERVICES REQUEST FORM */}
      {activeFormTab === 'service' && (
        <form onSubmit={handleServiceSubmit} className="bg-[var(--bg-surface)] rounded-3xl p-6 sm:p-10 border border-[var(--border-subtle)] shadow-sm space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h2 className="heading-section text-[var(--text-primary)]">
              Request Clinical Department Services
            </h2>
            <p className="body-standard text-[var(--text-secondary)] mt-1">
              Engage senior clinical specialists for radiology audit review, Diagnostic Reference Level (DRL) compliance, scan protocol standardization, or CPD staff workshops.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Lead Contact Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={srvName}
                onChange={(e) => setSrvName(e.target.value)}
                placeholder="e.g. Folake Adeyemi, Senior Radiographer"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Institutional Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={srvEmail}
                onChange={(e) => setSrvEmail(e.target.value)}
                placeholder="folake.adeyemi@luth.org.ng"
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            {/* Service Category */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Service Category <span className="text-red-400">*</span>
              </label>
              <select
                value={srvCategory}
                onChange={(e) => setSrvCategory(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="Clinical Audit & DRL Dose Review">Clinical Audit & DRL Dose Review</option>
                <option value="Departmental Protocol Optimization">Departmental Protocol Optimization</option>
                <option value="Radiation Protection Adviser (RPA) Advisory">Radiation Protection Adviser (RPA) Advisory</option>
                <option value="Staff CPD & Simulation Training Workshop">Staff CPD & Simulation Training Workshop</option>
                <option value="Locum Staffing & Shift Cover Consulting">Locum Staffing & Shift Cover Consulting</option>
              </select>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-1.5">
              <label className="label-ui text-[var(--text-primary)]">
                Target Timeline <span className="text-red-400">*</span>
              </label>
              <select
                value={srvTimeline}
                onChange={(e) => setSrvTimeline(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              >
                <option value="Urgent (within 48 hours)">Urgent (within 48 hours)</option>
                <option value="Standard (within 14 days)">Standard (within 14 days)</option>
                <option value="Flexible (next 30-60 days)">Flexible (next 30-60 days)</option>
              </select>
            </div>
          </div>

          {/* Department or Hospital */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Hospital, Trust, or Imaging Clinic Name
            </label>
            <input
              type="text"
              value={srvHospital}
              onChange={(e) => setSrvHospital(e.target.value)}
              placeholder="e.g. National Hospital Abuja / Lagos University Teaching Hospital"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Detailed Scope of Service Required <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={srvDescription}
              onChange={(e) => setSrvDescription(e.target.value)}
              placeholder="Describe the department requirements, imaging modality involved (e.g. Siemens Force CT, GE Signa MRI), staff headcount, and deliverables needed..."
              className="w-full p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="label-ui text-[var(--text-primary)]">
              Additional Notes or Procurement Code (Optional)
            </label>
            <input
              type="text"
              value={srvNotes}
              onChange={(e) => setSrvNotes(e.target.value)}
              placeholder="e.g. NHS Purchase order code, remote delivery preferred"
              className="w-full px-4 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-6 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)] max-w-sm">
              Our clinical governance team will contact your department.
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#FF7F32]" />
                  <span>Submit Service Inquiry</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 4. MY SUBMITTED REQUESTS (Review & Tracking Dashboard) */}
      {activeFormTab === 'my_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="heading-section text-[var(--text-primary)]">
                Submitted Requests Tracking
              </h2>
              <p className="body-secondary text-[var(--text-secondary)]">
                Real-time review status of your tutoring sessions, research support briefs, and departmental service requests.
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="heading-card text-[var(--text-primary)]">
                No Requests Submitted Yet
              </h3>
              <p className="body-standard text-[var(--text-secondary)] max-w-sm mx-auto">
                Submit a request using the Private Classes, Research Assistance, or Clinical Services forms to track your requests here.
              </p>
              <button
                type="button"
                onClick={() => setActiveFormTab('private_class')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-sm"
              >
                Submit a Class Request
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {requests.map((req) => {
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'Scheduled':
                      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40';
                    case 'Under Review':
                      return 'bg-amber-950/40 text-amber-400 border border-amber-500/40';
                    case 'In Progress':
                      return 'bg-blue-950/40 text-blue-400 border border-blue-500/40';
                    case 'Completed':
                      return 'bg-purple-950/40 text-purple-400 border border-purple-500/40';
                    default:
                      return 'bg-slate-800 text-slate-300 border border-slate-700';
                  }
                };

                return (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#FF7F32]">
                          {req.referenceCode}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">·</span>
                        <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">
                          {req.category === 'private_class' ? 'Private Tutoring' : req.category === 'research' ? 'Research Desk' : 'Clinical Service'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(req.status)}`}>
                          ● {req.status}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h3 className="heading-card text-[var(--text-primary)]">
                        {req.category === 'private_class' ? req.subjectTopic : req.category === 'research' ? req.researchTitle : req.serviceType}
                      </h3>
                      <p className="body-secondary text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {req.category === 'private_class' ? req.learningObjectives : req.category === 'research' ? req.supportDetails : req.description}
                      </p>
                    </div>

                    {/* Status Note from coordinator */}
                    {req.statusNotes && (
                      <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#FF7F32] shrink-0 mt-0.5" />
                        <span><strong>Coordinator Update:</strong> {req.statusNotes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailRequest(req)}
                        className="font-bold text-[#FF7F32] hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Submission Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelRequest(req.id)}
                        className="text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Request</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR SUBMITTED REQUEST */}
      {selectedDetailRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF7F32]">
                  {selectedDetailRequest.referenceCode}
                </span>
                <h3 className="heading-card text-[var(--text-primary)]">
                  Submission Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailRequest(null)}
                className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Applicant</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedDetailRequest.userName} ({selectedDetailRequest.userEmail})</span>
              </div>

              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Category</span>
                <span className="capitalize text-[var(--text-primary)]">{selectedDetailRequest.category.replace('_', ' ')}</span>
              </div>

              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Current Review Status</span>
                <span className="font-bold text-[#FF7F32]">{selectedDetailRequest.status}</span>
              </div>

              {selectedDetailRequest.statusNotes && (
                <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-primary)] block mb-1">Coordinator Update:</span>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedDetailRequest.statusNotes}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Detailed Requirements</span>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mt-1 p-3 rounded-xl bg-[var(--bg-canvas)] whitespace-pre-wrap">
                  {selectedDetailRequest.category === 'private_class'
                    ? selectedDetailRequest.learningObjectives
                    : selectedDetailRequest.category === 'research'
                    ? selectedDetailRequest.supportDetails
                    : selectedDetailRequest.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDetailRequest(null)}
              className="w-full h-11 bg-[#002147] dark:bg-[#1B447A] text-white font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
