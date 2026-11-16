import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, CheckSquare } from 'lucide-react';

interface PrivateClassCreatorTermsProps {
  accepted: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'default' | 'admin';
}

export const PrivateClassCreatorTerms: React.FC<PrivateClassCreatorTermsProps> = ({
  accepted,
  onChange,
  variant = 'default',
}) => {
  const [expanded, setExpanded] = useState(true);

  const isDarkPanel = variant === 'admin';

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 text-left ${
        isDarkPanel
          ? 'bg-slate-900/90 border-slate-700 text-slate-200'
          : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF7F32] shrink-0" />
          <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#FF7F32]">
            Private Class Creator Terms &amp; Legal Undertaking
          </h5>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-[11px] font-bold text-slate-400 hover:text-[#FF7F32] flex items-center gap-1 cursor-pointer"
        >
          <span>{expanded ? 'Hide Terms' : 'Read Terms'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div
          className={`max-h-44 overflow-y-auto pr-2 space-y-2 text-[11px] leading-relaxed rounded-xl p-3 border ${
            isDarkPanel
              ? 'bg-slate-950 border-slate-800 text-slate-300'
              : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <p>
            <strong>1. Eligibility &amp; Qualification Attestation:</strong> You solemnly affirm that you are either a{' '}
            <strong>bona fide Radiography Undergraduate Student</strong> in good academic standing or a{' '}
            <strong>Qualified Radiographer / Imaging Specialist</strong>, and that every qualification, institutional affiliation, and experience claim you submit is true and verifiable.
          </p>
          <p>
            <strong>2. StudiRad Code of Conduct &amp; Punctuality:</strong> You agree to strictly abide by StudiRad scheduling rules (maximum 3 days/week and maximum 2 hours/session), deliver sessions honourably as described in your promise video, and respond promptly when StudiRad Admin forwards student bookings.
          </p>
          <p>
            <strong>3. Clinical Confidentiality &amp; Copyright:</strong> Any DICOM images, radiographs, or case studies shared during tutoring must be <strong>100% de-identified</strong> in strict compliance with HIPAA, GDPR, and local medical ethics laws. Do not distribute unlicensed third-party textbooks or copyrighted recordings.
          </p>
          <p>
            <strong>4. Anti-Circumvention &amp; Zero Exploitation:</strong> All student inquiries routed through StudiRad must remain governed by StudiRad booking terms. Soliciting students outside the platform to bypass StudiRad coordination, engaging in harassment, or collecting unauthorized fees is strictly prohibited.
          </p>
          <p className="flex items-start gap-1.5 text-rose-500 dark:text-rose-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>5. Legal &amp; Regulatory Consequences:</strong> Violation of these terms, falsification of radiography credentials, breach of patient privacy, or fraudulent conduct will lead to immediate permanent account suspension, forfeiture of pending payouts, reporting to relevant academic/regulatory bodies, and full legal liability under applicable civil and criminal statutes.
            </span>
          </p>
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer select-none pt-0.5">
        <div className="relative flex items-center mt-0.5">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded accent-[#FF7F32] cursor-pointer"
          />
        </div>
        <span className="text-[11px] font-semibold leading-snug">
          I have read and agree to all terms above. I confirm I am a qualified radiographer or radiography undergraduate student, accept StudiRad rules, and understand the legal consequences of any breach.
        </span>
      </label>

      {!accepted && (
        <p className="text-[10px] font-bold text-[#FF7F32] flex items-center gap-1">
          <CheckSquare className="w-3 h-3" />
          <span>Acceptance is required before creating or publishing a private class.</span>
        </p>
      )}
    </div>
  );
};
