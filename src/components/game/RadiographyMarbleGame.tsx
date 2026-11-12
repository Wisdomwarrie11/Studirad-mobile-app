import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  GameLevel, 
  RADIOGRAPHIC_GAME_ITEMS, 
  RadiographicGameItem, 
  soundFx 
} from '../../data/radiographicGameData';
import { 
  saveUserGameProgress, 
  loadUserGameProgress, 
  UserGameProgress 
} from '../../services/firebaseDataService';
import { useAuth } from '../../context/AuthContext';
import { 
  Flame, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Shuffle, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Trophy, 
  BookOpen, 
  Video, 
  Briefcase, 
  ArrowRight,
  ShieldAlert,
  Volume2,
  VolumeX,
  Layers
} from 'lucide-react';

interface RadiographyMarbleGameProps {
  onNavigateTab?: (tab: any) => void;
  onOpenPlayer?: (course: any) => void;
}

export const RadiographyMarbleGame: React.FC<RadiographyMarbleGameProps> = ({
  onNavigateTab,
}) => {
  const { currentUser, setActiveTab, navigateToLearn } = useAuth();

  // Progress state
  const [level, setLevel] = useState<GameLevel>('easy');
  const [levelIndices, setLevelIndices] = useState<{ easy: number; medium: number; difficult: number }>({
    easy: 0,
    medium: 0,
    difficult: 0,
  });
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [marblesCount, setMarblesCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Missing word current input state
  const [enteredLetters, setEnteredLetters] = useState<string[]>([]);
  const [shuffledBank, setShuffledBank] = useState<{ id: string; letter: string; used: boolean }[]>([]);
  const [showClue, setShowClue] = useState<boolean>(false);

  // Marble Trivia state
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(false);

  // Load saved progress on boot
  useEffect(() => {
    let isMounted = true;
    loadUserGameProgress(currentUser?.id || 'guest').then((saved) => {
      if (!isMounted) return;
      setLevel(saved.currentLevel || 'easy');
      setLevelIndices(saved.levelIndices || { easy: 0, medium: 0, difficult: 0 });
      setSolvedIds(saved.solvedQuestionIds || []);
      setScore(saved.totalScore || 0);
      setStreak(saved.streak || 0);
      setBestStreak(saved.bestStreak || 0);
      setMarblesCount(saved.marblesCount || 0);
      setIsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Questions for active level
  const levelQuestions = useMemo(() => {
    return RADIOGRAPHIC_GAME_ITEMS.filter((item) => item.level === level);
  }, [level]);

  const currentIndex = levelIndices[level] || 0;
  const isLevelCompleted = currentIndex >= levelQuestions.length;
  const currentItem: RadiographicGameItem | undefined = levelQuestions[currentIndex];

  // Helper to persist state
  const persistState = useCallback(
    (
      newLevel: GameLevel,
      newIndices: typeof levelIndices,
      newSolved: string[],
      newScore: number,
      newStreak: number,
      newBestStreak: number,
      newMarbles: number
    ) => {
      const progress: UserGameProgress = {
        currentLevel: newLevel,
        levelIndices: newIndices,
        solvedQuestionIds: newSolved,
        totalScore: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        marblesCount: newMarbles,
        lastPlayedAt: new Date().toISOString(),
      };
      saveUserGameProgress(currentUser?.id || 'guest', progress);
    },
    [currentUser?.id]
  );

  // Initialize or reset puzzle letter bank whenever question changes
  useEffect(() => {
    if (!currentItem) return;
    setShowClue(false);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setIsCorrectAnswer(false);

    if (currentItem.type === 'missing_word' && currentItem.targetWord) {
      const target = currentItem.targetWord.toUpperCase();
      const targetLetters = target.split('');
      
      // Add 3-4 decoy letters to make it fun and challenging
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const decoys: string[] = [];
      while (decoys.length < 3) {
        const randLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!targetLetters.includes(randLetter) && !decoys.includes(randLetter)) {
          decoys.push(randLetter);
        }
      }

      const allLetters = [...targetLetters, ...decoys];
      // Fisher-Yates shuffle
      for (let i = allLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
      }

      setShuffledBank(allLetters.map((char, idx) => ({ id: `${char}_${idx}_${Date.now()}`, letter: char, used: false })));
      setEnteredLetters(new Array(target.length).fill(''));
    }
  }, [currentItem]);

  // Handle letter click in missing word game
  const handleBankLetterClick = (bankItemIndex: number) => {
    if (isAnswered) return;
    const item = shuffledBank[bankItemIndex];
    if (item.used) return;

    if (soundEnabled) soundFx.playMarbleTap();

    // Find first empty slot
    const firstEmptyIndex = enteredLetters.findIndex((l) => l === '');
    if (firstEmptyIndex === -1) return;

    const nextEntered = [...enteredLetters];
    nextEntered[firstEmptyIndex] = item.letter;
    setEnteredLetters(nextEntered);

    const nextBank = [...shuffledBank];
    nextBank[bankItemIndex] = { ...item, used: true };
    setShuffledBank(nextBank);

    // If all slots are filled, check answer!
    if (firstEmptyIndex === enteredLetters.length - 1 && currentItem?.targetWord) {
      const fullWord = nextEntered.join('').toUpperCase();
      if (fullWord === currentItem.targetWord.toUpperCase()) {
        handleSuccess();
      } else {
        handleFailure();
      }
    }
  };

  // Remove letter from filled slot
  const handleSlotLetterClick = (slotIndex: number) => {
    if (isAnswered) return;
    const letterToRemove = enteredLetters[slotIndex];
    if (!letterToRemove) return;

    if (soundEnabled) soundFx.playMarbleTap();

    const nextEntered = [...enteredLetters];
    nextEntered[slotIndex] = '';
    setEnteredLetters(nextEntered);

    // Re-enable in bank (first matching used letter)
    const bankIdx = shuffledBank.findIndex((b) => b.letter === letterToRemove && b.used);
    if (bankIdx !== -1) {
      const nextBank = [...shuffledBank];
      nextBank[bankIdx] = { ...nextBank[bankIdx], used: false };
      setShuffledBank(nextBank);
    }
  };

  // Shuffle bank letters
  const handleShuffleBank = () => {
    if (soundEnabled) soundFx.playMarbleTap();
    setShuffledBank((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  };

  // Clear all entered letters
  const handleClearSlots = () => {
    if (soundEnabled) soundFx.playMarbleTap();
    if (!currentItem?.targetWord) return;
    setEnteredLetters(new Array(currentItem.targetWord.length).fill(''));
    setShuffledBank((prev) => prev.map((b) => ({ ...b, used: false })));
  };

  // Handle Marble Trivia option click
  const handleTriviaOptionClick = (optIdx: number) => {
    if (isAnswered || !currentItem) return;
    setSelectedOptionIndex(optIdx);

    if (optIdx === currentItem.correctIndex) {
      handleSuccess();
    } else {
      handleFailure();
    }
  };

  const handleSuccess = () => {
    if (!currentItem) return;
    setIsAnswered(true);
    setIsCorrectAnswer(true);

    const bonusStreak = streak + 1;
    const newBest = Math.max(bestStreak, bonusStreak);
    const earnedPoints = currentItem.points * (bonusStreak >= 3 ? 2 : 1);
    const newScore = score + earnedPoints;
    const newMarbles = marblesCount + 1;
    const newSolved = solvedIds.includes(currentItem.id) ? solvedIds : [...solvedIds, currentItem.id];

    setStreak(bonusStreak);
    setBestStreak(newBest);
    setScore(newScore);
    setMarblesCount(newMarbles);
    setSolvedIds(newSolved);

    if (soundEnabled) {
      if (bonusStreak >= 3 && bonusStreak % 3 === 0) {
        soundFx.playStreakFanfare();
      } else {
        soundFx.playSuccessChime();
      }
    }

    persistState(level, levelIndices, newSolved, newScore, bonusStreak, newBest, newMarbles);
  };

  const handleFailure = () => {
    setIsAnswered(true);
    setIsCorrectAnswer(false);
    setStreak(0);
    if (soundEnabled) soundFx.playWrong();

    persistState(level, levelIndices, solvedIds, score, 0, bestStreak, marblesCount);
  };

  // Advance to next question in level
  const handleNextQuestion = () => {
    const nextIdx = currentIndex + 1;
    const newIndices = { ...levelIndices, [level]: nextIdx };
    setLevelIndices(newIndices);
    persistState(level, newIndices, solvedIds, score, streak, bestStreak, marblesCount);
  };

  // Switch difficulty level
  const handleLevelSelect = (newLevel: GameLevel) => {
    if (newLevel === level) return;
    if (soundEnabled) soundFx.playMarbleTap();
    setLevel(newLevel);
    persistState(newLevel, levelIndices, solvedIds, score, streak, bestStreak, marblesCount);
  };

  // Replay / Reset level
  const handleResetLevel = () => {
    if (soundEnabled) soundFx.playMarbleTap();
    const newIndices = { ...levelIndices, [level]: 0 };
    setLevelIndices(newIndices);
    persistState(level, newIndices, solvedIds, score, streak, bestStreak, marblesCount);
  };

  if (!isLoaded) {
    return (
      <div className="w-full min-h-[480px] flex flex-col items-center justify-center p-8 space-y-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#FF7F32] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading Radiographic Game Arena...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* 1. TOP GAME ARENA STATUS BAR */}
      <div className="w-full bg-[#002147] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-[#FF7F32]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#FF7F32]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Left: Player Title & Streak */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0 relative">
            <Trophy className="w-6 h-6 text-[#FF7F32]" />
            {streak >= 3 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-black flex items-center justify-center animate-bounce">
                ★
              </span>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                RadTrivia & Word Arena
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title={soundEnabled ? 'Mute Game Sounds' : 'Enable Game Sounds'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              </button>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Guess radiographic terms, solve missing words & master clinical trivia.
            </p>
          </div>
        </div>

        {/* Right: Gamified Stats (XP, Streak, Marbles) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Streak Flame */}
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5 shadow-2xs">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <div className="text-left leading-none">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Streak</span>
              <span className="text-xs font-black text-amber-300">{streak}x</span>
            </div>
          </div>

          {/* Marbles Collected */}
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5 shadow-2xs">
            <span className="text-sm">🔮</span>
            <div className="text-left leading-none">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Marbles</span>
              <span className="text-xs font-black text-purple-300">{marblesCount}</span>
            </div>
          </div>

          {/* Total Score / XP */}
          <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7F32] to-[#E86B20] text-white flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-4 h-4" />
            <div className="text-left leading-none">
              <span className="text-[10px] text-white/80 block font-semibold uppercase">Score</span>
              <span className="text-xs font-black text-white">{score} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DIFFICULTY LEVEL SELECTOR TABS */}
      <div className="p-1.5 bg-slate-100 dark:bg-[#161F30] rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleLevelSelect('easy')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            level === 'easy'
              ? 'bg-[#002147] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Easy · Foundations</span>
          <span className="text-[10px] font-mono opacity-80">({levelIndices.easy}/{RADIOGRAPHIC_GAME_ITEMS.filter((i) => i.level === 'easy').length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleLevelSelect('medium')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            level === 'medium'
              ? 'bg-[#002147] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Medium · CT & MRI</span>
          <span className="text-[10px] font-mono opacity-80">({levelIndices.medium}/{RADIOGRAPHIC_GAME_ITEMS.filter((i) => i.level === 'medium').length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleLevelSelect('difficult')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            level === 'difficult'
              ? 'bg-[#002147] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>Difficult · Advanced</span>
          <span className="text-[10px] font-mono opacity-80">({levelIndices.difficult}/{RADIOGRAPHIC_GAME_ITEMS.filter((i) => i.level === 'difficult').length})</span>
        </button>
      </div>

      {/* 3. MAIN GAME ARENA CARD */}
      <div className="bg-white dark:bg-[#121824] rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-left relative overflow-hidden">
        {isLevelCompleted ? (
          /* LEVEL COMPLETED SCREEN */
          <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto animate-scaleIn">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#FF7F32] uppercase tracking-wider">
                Stage Conquered!
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {level.toUpperCase()} Tier Completed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                You've solved all {levelQuestions.length} radiographic puzzles in this level. Great work reinforcing your clinical knowledge!
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetLevel}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Level</span>
              </button>

              {level !== 'difficult' && (
                <button
                  type="button"
                  onClick={() => handleLevelSelect(level === 'easy' ? 'medium' : 'difficult')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#002147] hover:bg-[#0A3266] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <span>Advance to {level === 'easy' ? 'Medium Tier' : 'Difficult Tier'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : currentItem ? (
          <>
            {/* Question Header & Category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#FF7F32]/10 text-[#FF7F32] text-[11px] font-black uppercase tracking-wider">
                  {currentItem.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Question {currentIndex + 1} of {levelQuestions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Reward: <strong className="text-emerald-500">+{currentItem.points} XP</strong>
                </span>
              </div>
            </div>

            {/* Prompt Question */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                {currentItem.question}
              </h3>
            </div>

            {/* Clue button & reveal */}
            <div className="space-y-2">
              {!showClue ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowClue(true);
                    if (soundEnabled) soundFx.playMarbleTap();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7F32] hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Reveal Radiographic Clue</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2 animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-[#FF7F32] shrink-0 mt-0.5" />
                  <span><strong>Clinical Clue:</strong> {currentItem.clue}</span>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------
                TYPE A: MISSING WORD / GUESS RADIOGRAPHIC TERM
            ---------------------------------------------------- */}
            {currentItem.type === 'missing_word' && currentItem.targetWord && (
              <div className="space-y-6 pt-2">
                {/* 1. Letter Slots (Word to Spell) */}
                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap py-2">
                    {enteredLetters.map((letter, slotIdx) => (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => handleSlotLetterClick(slotIdx)}
                        disabled={isAnswered}
                        className={`w-10 h-12 sm:w-12 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black uppercase transition-all shadow-sm ${
                          letter
                            ? 'bg-gradient-to-b from-[#002147] to-[#0A3266] text-white border-2 border-[#FF7F32] active:scale-95 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        {letter || ''}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Tap letters to fill blanks ({currentItem.targetWord.length} letters)
                  </span>
                </div>

                {/* 2. Marble Letter Bank */}
                {!isAnswered && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-[10px]">Letter Bank Orbs</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleShuffleBank}
                          className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>Shuffle</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearSlots}
                          className="hover:text-rose-500 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                      {shuffledBank.map((bankItem, bIdx) => (
                        <button
                          key={bankItem.id}
                          type="button"
                          disabled={bankItem.used}
                          onClick={() => handleBankLetterClick(bIdx)}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-base sm:text-lg font-black uppercase flex items-center justify-center transition-all ${
                            bankItem.used
                              ? 'opacity-20 scale-90 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-white dark:bg-[#1F2C42] text-[#002147] dark:text-white border border-slate-300 dark:border-slate-700 shadow-md hover:border-[#FF7F32] hover:-translate-y-0.5 active:scale-90 cursor-pointer'
                          }`}
                        >
                          {bankItem.letter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TYPE B: MARBLE TRIVIA (4 ORB SELECTION)
            ---------------------------------------------------- */}
            {currentItem.type === 'marble_trivia' && currentItem.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentItem.options.map((opt, optIdx) => {
                  const isSelected = selectedOptionIndex === optIdx;
                  const isRight = isAnswered && optIdx === currentItem.correctIndex;
                  const isWrong = isAnswered && isSelected && !isRight;

                  // Orb Colors
                  const orbColors = [
                    'from-blue-500 to-indigo-600',
                    'from-[#FF7F32] to-amber-600',
                    'from-emerald-500 to-teal-600',
                    'from-purple-500 to-pink-600',
                  ];
                  const orbBadge = ['A', 'B', 'C', 'D'][optIdx];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleTriviaOptionClick(optIdx)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isRight
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/40'
                          : isWrong
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 font-bold ring-2 ring-rose-500/40'
                          : isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-[#002147] dark:text-[#38BDF8]'
                          : 'bg-white dark:bg-[#161F30] border-slate-200 dark:border-slate-800 hover:border-[#FF7F32] text-slate-800 dark:text-slate-200 shadow-2xs'
                      }`}
                    >
                      {/* Marble Orb */}
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${orbColors[optIdx]} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                        {orbBadge}
                      </div>

                      <span className="text-xs sm:text-sm font-semibold flex-1">
                        {opt}
                      </span>

                      {isRight && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ----------------------------------------------------
                EXPLANATION & ADVANCE BUTTON
            ---------------------------------------------------- */}
            {isAnswered && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  {isCorrectAnswer ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Correct Radiographic Term! (+{currentItem.points} XP)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5" />
                      <span>
                        Not quite! Correct answer: <strong>{currentItem.type === 'missing_word' ? currentItem.targetWord : currentItem.options?.[currentItem.correctIndex || 0]}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Clinical Takeaway:</strong> {currentItem.explanation}
                </p>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-[#002147] hover:bg-[#0A3266] text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <span>Next Radiographic Puzzle</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* 4. QUICK PORTAL SHORTCUTS (Access Courses, Classes & NHS Opportunities) */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Continue Learning & Clinical Practice
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => navigateToLearn('courses')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#FF7F32] flex items-center justify-between text-left transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#FF7F32] transition-colors">
                  Course Lectures
                </span>
                <span className="text-[11px] text-slate-400">Recorded clinical modules</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => navigateToLearn('classes')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#FF7F32] flex items-center justify-between text-left transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#FF7F32] transition-colors">
                  Masterclass Cohorts
                </span>
                <span className="text-[11px] text-slate-400">Upcoming clinical classes</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#FF7F32] flex items-center justify-between text-left transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#FF7F32] transition-colors">
                  Career & Locum Board
                </span>
                <span className="text-[11px] text-slate-400">Radiography opportunities</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
