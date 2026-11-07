import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitTutorApplication } from '../../services/firebaseDataService';
import { 
  X, 
  GraduationCap, 
  CheckCircle2, 
  User, 
  Mail, 
  Briefcase, 
  Award, 
  FileText, 
  Sparkles,
  Phone
} from 'lucide-react';

interface TutorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EXPERTISE_OPTIONS = [
  'General X-Ray & Plain Film',
  'Computed Tomography (CT)',
  'Magnetic Resonance Imaging (MRI)',
  'Ultrasound & Sonography',
  'Interventional Radiography',
  'Radiation Protection & Physics',
  'Sectional Radiographic Anatomy',
  'Academic Research & Biostatistics',
  'Nuclear Medicine / PET-CT'
];

export const TutorApplicationModal: React.FC<TutorApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [academicBackground, setAcademicBackground] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('3-5 years');
  const [summary, setSummary] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const toggleExpertise = (item: string) => {
    setSelectedExpertise((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Please provide your full name and email address.');
      return;
    }

    if (!academicBackground.trim()) {
      setErrorMessage('Please state your academic background (e.g. BSc Radiography, MSc Medical Imaging).');
      return;
    }

    if (selectedExpertise.length === 0) {
      setErrorMessage('Please select at least one area of clinical expertise.');
      return;
    }

    if (!bio.trim() || bio.trim().length < 20) {
      setErrorMessage('Please provide a short professional bio (minimum 20 characters).');
      return;
    }

    if (!summary.trim() || summary.trim().length < 20) {
      setErrorMessage('Please write a brief summary about yourself and your teaching goals.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitTutorApplication({
        userId: currentUser?.id || `user_${Date.now()}`,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        academicBackground: academicBackground.trim(),
        areaOfExpertise: selectedExpertise,
        experienceYears,
        summary: summary.trim(),
      });

      if (res.success) {
        setIsSubmitted(true);
        onSuccess?.();
      } else {
        setErrorMessage(res.error || 'Something went wrong while submitting. Please try again.');
      }
    } catch {
      setErrorMessage('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#121824] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto text-left overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#161F30]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7F32] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Be a Tutor / Instructor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Join our teaching faculty to mentor radiographers and create specialized courses
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

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">
          {isSubmitted ? (
            <div className="py-8 sm:py-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Application Submitted!
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Thank you for applying to join the StudiRad Instructor Team!
                </p>
                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#FF7F32]">
                    <Sparkles className="w-4 h-4" />
                    <span>Next Steps</span>
                  </div>
                  <p>
                    Please wait and check your email inbox (<strong>{email}</strong>) within <strong>24 to 72 hours</strong> to receive feedback from our academic & clinical verification team.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Once approved, your account will gain instructor privileges to build approved courses and offer private tutorial sessions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-6 py-2.5 rounded-xl bg-[#002147] dark:bg-[#FF7F32] hover:bg-[#001733] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Notice Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#002147] dark:text-[#38BDF8] shrink-0 mt-0.5" />
                <p>
                  StudiRad instructors build accredited video courses and mentor radiography students. After submitting your details, our clinical team will review your application within <strong>24–72 hours</strong>.
                </p>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Chioma Okonkwo"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. instructor@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              {/* Phone & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone / WhatsApp (Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Years of Clinical Experience</span>
                  </label>
                  <select
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32] cursor-pointer"
                  >
                    <option value="1-2 years">1 - 2 years</option>
                    <option value="3-5 years">3 - 5 years</option>
                    <option value="6-10 years">6 - 10 years</option>
                    <option value="10+ years">10+ years (Senior / Lead)</option>
                  </select>
                </div>
              </div>

              {/* Academic Background */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>Academic Background & Qualifications</span>
                </label>
                <input
                  type="text"
                  required
                  value={academicBackground}
                  onChange={(e) => setAcademicBackground(e.target.value)}
                  placeholder="e.g. BSc (Hons) Radiography, MSc Computed Tomography, PgCert Teaching"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32]"
                />
              </div>

              {/* Area of Expertise */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Areas of Clinical Expertise (Select all that apply)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {selectedExpertise.length} selected
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPERTISE_OPTIONS.map((item) => {
                    const isChecked = selectedExpertise.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleExpertise(item)}
                        className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-[#002147] dark:text-[#FF7F32]'
                            : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{item}</span>
                        <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${
                          isChecked ? 'bg-[#FF7F32] border-[#FF7F32] text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Professional Bio */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Professional Bio</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your current clinical posting, specialty experience, and areas you love teaching..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32] resize-none"
                />
              </div>

              {/* Summary About Himself / Herself */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Summary About Yourself</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of your approach to teaching, mentoring, and medical education..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002147] dark:focus:ring-[#FF7F32] resize-none"
                />
              </div>

              {/* Submit Buttons */}
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
                      <span>Submit Application</span>
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
