import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Trash2, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Wordmark } from '../brand/Wordmark';
import { useAuth } from '../../context/AuthContext';

export type CompliancePageType = 'privacy' | 'terms' | 'delete-account';

interface PublicCompliancePageProps {
  page: CompliancePageType;
  onExit: () => void;
}

export const PublicCompliancePage: React.FC<PublicCompliancePageProps> = ({ page, onExit }) => {
  const { currentUser, deleteAccount, openAuthWithTab } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedDone, setDeletedDone] = useState(false);

  const navigatePage = (next: CompliancePageType) => {
    const nextPath = `/${next}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleDeleteNow = async () => {
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
    setDeletedDone(true);
    setConfirmDelete(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 hover:border-[#f59e0b] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Open StudiRad App</span>
            </button>
            <Wordmark size="sm" withSubtitle={false} />
          </div>

          <nav className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => navigatePage('privacy')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                page === 'privacy'
                  ? 'bg-[#002147] text-white'
                  : 'bg-white dark:bg-[#121824] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigatePage('terms')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                page === 'terms'
                  ? 'bg-[#002147] text-white'
                  : 'bg-white dark:bg-[#121824] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => navigatePage('delete-account')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                page === 'delete-account'
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-[#121824] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Delete Account
            </button>
          </nav>
        </header>

        {page === 'privacy' && (
          <article className="bg-white dark:bg-[#121824] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#002147]/10 dark:bg-blue-500/10 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  StudiRad Privacy Policy
                </h1>
                <p className="text-xs text-slate-500">Effective Date: November 2026 • Package: org.studirad.app</p>
              </div>
            </div>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">1. Age &amp; Eligibility</h2>
              <p>
                StudiRad is intended strictly for individuals aged 18 years and older, including radiography students, clinical interns, and qualified radiographers.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">2. Information We Collect</h2>
              <p>
                When you create an account or use StudiRad, we collect only what is needed to run the platform: your full name, email address, professional role, learning topic preferences, enrolled classes, booking/research requests, content ratings, and educational game scores.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">3. Clinical Confidentiality</h2>
              <p>
                Users and instructors must never upload identifiable patient records, names, hospital numbers, or un-anonymized DICOM metadata. All shared imaging materials must be strictly de-identified.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">4. How Data Is Stored &amp; Shared</h2>
              <p>
                Authentication and database records are encrypted in transit and stored securely via Google Firebase. Uploaded educational files are hosted via Cloudinary. StudiRad does not sell your personal information to advertisers or third-party data brokers.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">5. Account Deletion &amp; Contact</h2>
              <p>
                You may permanently delete your account at any time inside the app under <strong>Profile → Delete Account</strong> or on our{' '}
                <button
                  type="button"
                  onClick={() => navigatePage('delete-account')}
                  className="text-[#f59e0b] font-bold hover:underline cursor-pointer"
                >
                  Account Deletion page
                </button>
                . For privacy requests, contact{' '}
                <a href="mailto:support@studirad.org" className="text-[#f59e0b] font-bold hover:underline">
                  support@studirad.org
                </a>
                .
              </p>
            </section>
          </article>
        )}

        {page === 'terms' && (
          <article className="bg-white dark:bg-[#121824] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#f59e0b]/15 text-[#f59e0b] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  StudiRad Terms of Service
                </h1>
                <p className="text-xs text-slate-500">Educational &amp; Clinical Mentorship Platform (18+)</p>
              </div>
            </div>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">1. Educational Purpose Only</h2>
              <p>
                StudiRad provides clinical radiography education, exam preparation, private tutoring coordination, and academic study support. It is not a medical device and must not be used for live patient diagnosis or clinical decision-making.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">2. Non-Issuance of CPD Certificates</h2>
              <p>
                Courses, live sessions, study materials, and tutoring on StudiRad are offered for academic growth and exam readiness. <strong>StudiRad does not issue accredited CPD certificates or statutory CPD credits at this time.</strong>
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">3. Tutor &amp; User Conduct</h2>
              <p>
                Instructors and learners must provide truthful credentials, respect copyright, avoid patient-identifiable uploads, and coordinate private bookings transparently through StudiRad. Misconduct or credential falsification leads to permanent removal and legal accountability where applicable.
              </p>
            </section>

            <section className="space-y-1.5">
              <h2 className="font-bold text-slate-900 dark:text-white">4. Support</h2>
              <p>
                Academic support and legal inquiries can be directed to{' '}
                <a href="mailto:support@studirad.org" className="text-[#f59e0b] font-bold hover:underline">
                  support@studirad.org
                </a>
                .
              </p>
            </section>
          </article>
        )}

        {page === 'delete-account' && (
          <article className="bg-white dark:bg-[#121824] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  StudiRad Account &amp; Data Deletion
                </h1>
                <p className="text-xs text-slate-500">Manage permanent deletion of your StudiRad account</p>
              </div>
            </div>

            {deletedDone ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Your StudiRad account has been deleted.</p>
                  <p className="text-xs mt-1">
                    Your Firebase authentication session has been removed. Any residual email support records can also be purged by contacting support@studirad.org.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="font-bold text-slate-900 dark:text-white">How to delete your account</h2>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Open the StudiRad app and sign in to your account.</li>
                    <li>Go to <strong>Profile → Account Settings → Delete Account</strong> and confirm deletion.</li>
                    <li>
                      Or request manual deletion by emailing{' '}
                      <a href="mailto:support@studirad.org?subject=Account%20Deletion%20Request" className="text-[#f59e0b] font-bold hover:underline">
                        support@studirad.org
                      </a>{' '}
                      from your registered email address (processed within 7 days).
                    </li>
                  </ol>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Data removed upon deletion:</div>
                  <p>
                    Firebase Authentication login credentials, profile record, saved topic preferences, game scores, and session access are permanently removed. Billing or dispute records required by law (if any) are retained only for the mandatory statutory period.
                  </p>
                </div>

                {currentUser && !currentUser.isGuest ? (
                  <div className="p-4 rounded-2xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>
                        Signed in as <strong>{currentUser.email}</strong>. You can permanently delete this account right now:
                      </span>
                    </div>

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Delete My Account Now
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteNow}
                          disabled={isDeleting}
                          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        openAuthWithTab('signIn');
                        onExit();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#002147] text-white font-bold text-xs cursor-pointer"
                    >
                      Sign In to Delete Account
                    </button>
                    <a
                      href="mailto:support@studirad.org?subject=Account%20Deletion%20Request"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs inline-flex items-center gap-1.5 hover:border-[#f59e0b]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#f59e0b]" />
                      <span>Email support@studirad.org</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </article>
        )}
      </div>
    </div>
  );
};
