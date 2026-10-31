import React, { useState } from 'react';
import { Tutor } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle2, 
  UserCheck, 
  Award,
  Video
} from 'lucide-react';

interface TutorBookingModalProps {
  tutor: Tutor | null;
  onClose: () => void;
  onConfirmBooking: (bookingDetails: {
    tutorName: string;
    tutorRole: string;
    topic: string;
    date: string;
    timeSlot: string;
  }) => void;
}

export const TutorBookingModal: React.FC<TutorBookingModalProps> = ({
  tutor,
  onClose,
  onConfirmBooking,
}) => {
  if (!tutor) return null;

  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedSlot, setSelectedSlot] = useState('17:00 - 17:45 BST');
  const [topic, setTopic] = useState('Trauma Radiography & C-Spine Case Review');
  const [confirmed, setConfirmed] = useState(false);

  const availableSlots = [
    '16:00 - 16:45 BST',
    '17:00 - 17:45 BST',
    '18:30 - 19:15 BST',
    '20:00 - 20:45 BST',
  ];

  const handleBook = () => {
    onConfirmBooking({
      tutorName: tutor.name,
      tutorRole: tutor.role,
      topic,
      date: selectedDate,
      timeSlot: selectedSlot,
    });
    setConfirmed(true);
    setTimeout(() => {
      onClose();
    }, 1800);
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
            <UserCheck className="w-4 h-4 text-[#FF7F32]" />
            <span>Book 1-on-1 Clinical Mentorship</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {confirmed ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Booking Confirmed!
            </h3>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              Your session with <strong>{tutor.name}</strong> on <strong>{selectedDate} ({selectedSlot})</strong> is confirmed. A calendar invite and secure meeting link have been added to your profile.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {/* Tutor Profile Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <img
                src={tutor.avatar}
                alt={tutor.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {tutor.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{tutor.rating}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {tutor.role}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {tutor.hospital}
                </span>
              </div>
            </div>

            {/* Rate & Duration */}
            <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/60 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Tuition Rate:</span>
              <span className="font-bold text-[#FF7F32] font-mono text-sm">{tutor.hourlyRate}</span>
            </div>

            {/* Session Topic Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Focus Subject or Case Review Goal</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Chest X-Ray pneumothorax critique, MRI sequences"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Date</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['Tomorrow', 'In 2 Days', 'This Saturday'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                      selectedDate === d
                        ? 'bg-[#002147] text-white border-[#002147] shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Available Time Slot</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                      selectedSlot === slot
                        ? 'bg-blue-50 border-[#002147] text-[#002147]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!confirmed && (
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block">Session Duration</span>
              <span className="text-xs font-bold text-slate-700">45 Minutes Live 1-on-1</span>
            </div>

            <button
              onClick={handleBook}
              className="py-2.5 px-5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#002147]/20 active:scale-[0.98] transition-all"
            >
              <Video className="w-3.5 h-3.5 text-[#FF7F32]" />
              <span>Confirm & Book Session</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
