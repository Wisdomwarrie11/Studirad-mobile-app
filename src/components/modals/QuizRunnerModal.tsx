import React, { useState, useEffect } from 'react';
import { Quiz } from '../../types';
import { 
  X, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Award, 
  Lightbulb, 
  AlertCircle
} from 'lucide-react';

interface QuizRunnerModalProps {
  quiz: Quiz | null;
  onClose: () => void;
  onSaveScore?: (score: number, total: number) => void;
}

export const QuizRunnerModal: React.FC<QuizRunnerModalProps> = ({
  quiz,
  onClose,
  onSaveScore,
}) => {
  if (!quiz) return null;

  // Step state: 'intro' | 'active' | 'review'
  const [stage, setStage] = useState<'intro' | 'active' | 'review'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(quiz.durationMin * 60);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer countdown during active stage
  useEffect(() => {
    if (stage !== 'active') return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleSubmitQuiz = () => {
    setShowSubmitConfirm(false);
    const score = calculateScore();
    onSaveScore?.(score, quiz.questions.length);
    setStage('review');
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeftSec(quiz.durationMin * 60);
    setStage('active');
  };

  const currentQ = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 select-none">
      <div 
        className="relative w-full max-w-lg h-full max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">{quiz.title}</h2>
              <span className="text-[10px] text-slate-500">{quiz.topic}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stage === 'active' && (
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#FF7F32] bg-orange-50 px-2 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeLeftSec)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. INTRO STAGE */}
        {stage === 'intro' && (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Accredited Practice Challenge
                </span>
                <h3 className="text-lg font-bold text-[#002147] mt-1">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Test your clinical knowledge in diagnostic criteria, radiation physics, pathology localization, and imaging protocols.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Question Count:</span>
                  <span className="font-bold text-slate-800">{quiz.questionCount} Questions</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Time Limit:</span>
                  <span className="font-bold text-slate-800">{quiz.durationMin} Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-bold text-slate-800">Multiple Choice with Clinical Explanations</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStage('active')}
              className="w-full mt-6 py-3 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#002147]/20 transition-all active:scale-[0.98]"
            >
              <span>Start Timed Quiz</span>
              <ChevronRight className="w-4 h-4 text-[#FF7F32]" />
            </button>
          </div>
        )}

        {/* 2. ACTIVE QUESTION STAGE */}
        {stage === 'active' && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
            {/* Question Progress Tracker */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 text-xs">
              <span className="font-bold text-[#002147]">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span className="text-[11px] text-slate-500">
                {answeredCount} of {quiz.questions.length} answered
              </span>
            </div>

            {/* Question Card */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 no-scrollbar">
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2 pt-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#002147] text-[#002147] font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="leading-snug">{opt}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                          isSelected
                            ? 'border-[#002147] bg-[#002147] text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Navigator */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-[#002147] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span>Submit Quiz</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. REVIEW & EXPLANATIONS STAGE */}
        {stage === 'review' && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
              {/* Score Summary Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002147] to-[#0A3060] text-white text-center space-y-1 shadow-md">
                <span className="text-[10px] uppercase font-bold text-[#FF7F32] tracking-wider">
                  Quiz Completed
                </span>
                <div className="text-3xl font-black font-mono">
                  {calculateScore()} / {quiz.questions.length}
                </div>
                <p className="text-xs text-blue-100">
                  {calculateScore() >= 4
                    ? 'Outstanding! Excellent clinical radiographic mastery.'
                    : 'Good attempt. Review the rationale and clinical tips below.'}
                </p>
              </div>

              <h4 className="text-xs font-bold text-slate-900 pt-1">
                Question Review & Rationales
              </h4>

              {/* Question list review */}
              <div className="space-y-3">
                {quiz.questions.map((q, idx) => {
                  const userAns = selectedAnswers[q.id];
                  const isCorrect = userAns === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-2xs text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {q.question}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md shrink-0">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect</span>
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                        <div className="font-semibold text-slate-700">
                          Correct Answer: <span className="text-[#002147]">{q.options[q.correctIndex]}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>

                      <div className="flex items-start gap-1.5 text-[10px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/50">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Clinical Tip:</strong> {q.clinicalTip}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={handleRetry}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#FF7F32]" />
                <span>Retry Quiz</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
              >
                Return to Learning Hub
              </button>
            </div>
          </div>
        )}

        {/* SUBMISSION CONFIRMATION MODAL */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div 
              className="w-full max-w-xs bg-white rounded-2xl p-4 shadow-xl text-left space-y-3 animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Submit Quiz Answers?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have answered <strong>{answeredCount}</strong> of <strong>{quiz.questions.length}</strong> questions. Are you ready to see your score and explanations?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Review
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="px-3 py-1.5 rounded-lg bg-[#002147] text-white text-xs font-bold"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
