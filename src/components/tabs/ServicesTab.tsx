import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests, UserRequest } from '../../context/RequestContext';
import { ResearchAssistanceWizard } from '../services/ResearchAssistanceWizard';
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Trash2,
  Eye,
  LogIn,
} from 'lucide-react';

interface ServicesTabProps {
  onBookTutor?: (tutor: any) => void;
  onRequestResearch?: (service: any) => void;
  activeBookings?: any[];
}

export const ServicesTab: React.FC<ServicesTabProps> = () => {
  const { currentUser, requireAuth } = useAuth();
  const { requests, cancelRequest } = useRequests();

  const [activeFormTab, setActiveFormTab] = useState<'private_class' | 'research' | 'my_requests'>('research');
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<UserRequest | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New Request':
        return 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40';
      case 'Scheduled':
        return 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40';
      case 'Under Review':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40';
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/40';
      case 'Completed':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/40';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30';
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 sm:space-y-8 py-6 sm:py-8 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto text-left pb-44 sm:pb-48">
      {/* Title & Introduction */}
      <div className="space-y-2">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FF7F32]">
          Academic &amp; Research Center
        </span>
        <h1 className="heading-display text-[var(--text-primary)]">
          Submit &amp; Track Requests
        </h1>
        <p className="body-large text-[var(--text-secondary)] max-w-3xl">
          Tailored academic research assistance across BSc, PGD, MSc, and PhD levels, plus 1-on-1 private tutoring and submission tracking.
        </p>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="w-full bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-subtle)] flex items-center overflow-x-auto no-scrollbar gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveFormTab('research')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 cursor-pointer ${
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
          onClick={() => setActiveFormTab('private_class')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 cursor-pointer ${
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
          onClick={() => setActiveFormTab('my_requests')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center gap-2 cursor-pointer ${
            activeFormTab === 'my_requests'
              ? 'bg-[#FF7F32] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>My Requests ({requests.length})</span>
        </button>
      </div>

      {/* 1. GUIDED RESEARCH ASSISTANCE JOURNEY */}
      {activeFormTab === 'research' && (
        <ResearchAssistanceWizard
          onViewMyRequests={() => setActiveFormTab('my_requests')}
        />
      )}

      {/* 2. PRIVATE CLASSES (COMING SOON) */}
      {activeFormTab === 'private_class' && (
        <div className="bg-[var(--bg-surface)] rounded-3xl p-8 sm:p-12 border border-[var(--border-subtle)] text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-[#FF7F32]/10 border border-[#FF7F32]/20 flex items-center justify-center mx-auto text-[#FF7F32]">
            <GraduationCap className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF7F32]/15 text-[#FF7F32]">
              Coming Soon
            </span>
            <h2 className="heading-section text-[var(--text-primary)]">
              1-on-1 &amp; Small Group Private Classes
            </h2>
            <p className="body-standard text-[var(--text-secondary)]">
              We are finalizing our cohort of accredited senior radiography educators for specialized 1-on-1 tutoring and board exam preparations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2 text-left">
            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)] block">Personalized Tutoring</span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Focus on difficult modalities: MRI physics, CT pathology, or ultrasound.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)] block">Exam Preparation</span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Targeted coaching for university vivas and professional licensing exams.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)] block">PACS Image Critique</span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Hands-on case reviews with clinical specialists.</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveFormTab('research')}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-sm transition-all cursor-pointer"
            >
              Explore Research Assistance →
            </button>
          </div>
        </div>
      )}

      {/* 3. MY SUBMITTED REQUESTS (REVIEW & TRACKING DASHBOARD) */}
      {activeFormTab === 'my_requests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="heading-section text-[var(--text-primary)]">
                Submitted Requests Tracking
              </h2>
            </div>
            {!currentUser && (
              <button
                type="button"
                onClick={() =>
                  requireAuth({
                    title: 'Sync Requests Across Devices',
                    message: 'Sign in to link and view your research assistance history across all devices.',
                    actionText: 'Sign In',
                  })
                }
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#002147] dark:bg-[#1B447A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#FF7F32]" />
                <span>Sign In to Cloud Sync</span>
              </button>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="heading-card text-[var(--text-primary)]">
                No Requests Submitted Yet
              </h3>
              <p className="body-standard text-[var(--text-secondary)] max-w-sm mx-auto">
                Start a guided Research Assistance request to track status updates and assigned representatives here.
              </p>
              <button
                type="button"
                onClick={() => setActiveFormTab('research')}
                className="mt-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-sm cursor-pointer"
              >
                Start Research Request
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF7F32]">
                        {req.referenceCode}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">·</span>
                      <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">
                        {req.category === 'private_class'
                          ? 'Private Tutoring'
                          : req.category === 'research'
                          ? `${req.academicLevel ? `${req.academicLevel} · ` : ''}${req.serviceCategory || 'Research Desk'}`
                          : 'Clinical Service'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {new Date(req.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <h3 className="heading-card text-[var(--text-primary)]">
                      {req.category === 'private_class'
                        ? req.subjectTopic
                        : req.category === 'research'
                        ? req.researchTitle
                        : req.serviceType}
                    </h3>
                    <p className="body-secondary text-[var(--text-secondary)] line-clamp-2">
                      {req.category === 'private_class'
                        ? req.learningObjectives
                        : req.category === 'research'
                        ? req.supportDetails
                        : req.description}
                    </p>

                    {req.category === 'research' && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-[var(--text-secondary)]">
                        {req.priceDisplay && (
                          <span>
                            Price: <strong className="font-mono text-[#FF7F32]">{req.priceDisplay}</strong>
                          </span>
                        )}
                        {req.assignedRepPhone && (
                          <span>
                            Assigned Rep: <strong className="text-[var(--text-primary)]">{req.assignedRepLabel || 'Rep'} ({req.assignedRepPhone})</strong>
                          </span>
                        )}
                        {req.deadline && (
                          <span>
                            Deadline: <strong className="font-mono text-[var(--text-primary)]">{req.deadline}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Note from coordinator */}
                  {req.statusNotes && (
                    <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#FF7F32] shrink-0 mt-0.5" />
                      <span><strong>Update:</strong> {req.statusNotes}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailRequest(req)}
                      className="min-h-[36px] font-bold text-[#FF7F32] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Submission Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelRequest(req.id)}
                      className="min-h-[36px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR SUBMITTED REQUEST */}
      {selectedDetailRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setSelectedDetailRequest(null)}
        >
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
                className="w-9 h-9 rounded-full bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold text-[var(--text-muted)] block">Applicant</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedDetailRequest.userName} ({selectedDetailRequest.userEmail})
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--text-muted)] block">Submitted</span>
                  <span className="font-mono text-xs text-[var(--text-primary)]">
                    {new Date(selectedDetailRequest.submittedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold text-[var(--text-muted)] block">Current Status</span>
                  <span className="font-bold text-[#FF7F32]">{selectedDetailRequest.status}</span>
                </div>
                {selectedDetailRequest.category === 'research' && selectedDetailRequest.academicLevel && (
                  <div>
                    <span className="text-xs font-bold text-[var(--text-muted)] block">Academic Level</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedDetailRequest.academicLevel}</span>
                  </div>
                )}
              </div>

              {selectedDetailRequest.category === 'research' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">Service Category</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {selectedDetailRequest.serviceCategory || selectedDetailRequest.assistanceType}
                      </span>
                    </div>
                    {selectedDetailRequest.priceDisplay && (
                      <div>
                        <span className="text-xs font-bold text-[var(--text-muted)] block">Displayed Price</span>
                        <span className="font-mono font-bold text-[#FF7F32]">{selectedDetailRequest.priceDisplay}</span>
                      </div>
                    )}
                  </div>

                  {selectedDetailRequest.assignedRepPhone && (
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">Assigned Representative</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {selectedDetailRequest.assignedRepLabel || 'Representative'} ({selectedDetailRequest.assignedRepPhone})
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">Research Topic</span>
                      <span className="text-[var(--text-primary)]">{selectedDetailRequest.researchTitle}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">Current Stage</span>
                      <span className="text-[var(--text-primary)]">{selectedDetailRequest.currentStage}</span>
                    </div>
                  </div>

                  {selectedDetailRequest.deadline && (
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">Target Deadline</span>
                      <span className="font-mono text-[var(--text-primary)]">{selectedDetailRequest.deadline}</span>
                    </div>
                  )}

                  {selectedDetailRequest.selectedServices && selectedDetailRequest.selectedServices.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block mb-1">Selected Services</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDetailRequest.selectedServices.map((srv) => (
                          <span
                            key={srv}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)]"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedDetailRequest.statusNotes && (
                <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-primary)] block mb-1">Coordinator Update:</span>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedDetailRequest.statusNotes}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block">Detailed Requirements / Description</span>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mt-1 p-3 rounded-xl bg-[var(--bg-canvas)] whitespace-pre-wrap">
                  {selectedDetailRequest.category === 'private_class'
                    ? selectedDetailRequest.learningObjectives
                    : selectedDetailRequest.category === 'research'
                    ? selectedDetailRequest.othersDescription || selectedDetailRequest.supportDetails
                    : selectedDetailRequest.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDetailRequest(null)}
              className="w-full min-h-[44px] h-11 bg-[#002147] dark:bg-[#1B447A] text-white font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

