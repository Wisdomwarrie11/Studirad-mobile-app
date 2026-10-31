import React, { useState } from 'react';
import { ResearchService } from '../../types';
import { 
  X, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Send,
  ShieldCheck
} from 'lucide-react';

interface ResearchRequestModalProps {
  service: ResearchService | null;
  onClose: () => void;
  onSubmitRequest: (requestData: {
    serviceTitle: string;
    topic: string;
    deadline: string;
    notes: string;
  }) => void;
}

export const ResearchRequestModal: React.FC<ResearchRequestModalProps> = ({
  service,
  onClose,
  onSubmitRequest,
}) => {
  if (!service) return null;

  const [topic, setTopic] = useState('');
  const [deadline, setDeadline] = useState('2 Weeks');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    onSubmitRequest({
      serviceTitle: service.title,
      topic,
      deadline,
      notes,
    });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 select-none">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div 
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden text-left animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#002147]">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span>Research & Dissertation Desk</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Request Received!
            </h3>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              Your research assistance inquiry for <strong>{service.title}</strong> has been logged. An academic advisor will reach out within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {/* Service Title & Scope */}
            <div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                {service.category}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                {service.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Clear Pricing & Turnaround */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Standard Advisory Fee</span>
                <span className="font-bold text-[#002147] font-mono text-sm">{service.price}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Target Turnaround</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{service.turnaround}</span>
                </span>
              </div>
            </div>

            {/* Deliverables */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Scope of Deliverables:</span>
              <ul className="space-y-1 text-xs text-slate-600">
                {service.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Project / Dissertation Topic *</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Quantitative evaluation of pediatric CT dose modulation"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002147]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Submission Deadline</label>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002147]"
                >
                  <option value="Urgent (3 Days)">Urgent (Within 3 Days)</option>
                  <option value="1 Week">1 Week</option>
                  <option value="2 Weeks">2 Weeks</option>
                  <option value="1 Month+">1 Month or more</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Specific Requirements or Research Questions</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail your university requirements, sample size, or software (e.g. SPSS, R, PRISMA flow diagram)..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002147]"
                ></textarea>
              </div>
            </div>

            {/* Footer submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#002147]/20 active:scale-[0.98] transition-all"
              >
                <Send className="w-3.5 h-3.5 text-[#FF7F32]" />
                <span>Submit Research Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
