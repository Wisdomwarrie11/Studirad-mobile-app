import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { scrollToTopInstant } from '../../utils/scrollTop';
import {
  FILL_BLANK_ITEMS,
  WORD_SCRAMBLE_ITEMS,
  MEMORY_MATCH_DECKS,
  TRUE_FALSE_ITEMS,
  GameLevel,
  GameMode,
  generateConfusingLetterBank,
  seededShuffle,
} from '../../data/radiographicGameData';
import {
  loadUserGameProgress,
  saveUserGameProgress,
  subscribePlayerScores,
  UserGameProgress,
  PlayerScoreRecord,
  GameAttemptRecord,
} from '../../services/firebaseDataService';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Lightbulb,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  Layers,
  Puzzle,
  HelpCircle,
  Grid2x2Check,
  Delete,
  Check,
  Play,
  Users,
  Target,
  Medal,
  UserCheck,
} from 'lucide-react';

interface RadiographyMarbleGameProps {
  onNavigateTab?: (tab: 'home' | 'learn' | 'search' | 'profile') => void;
}

const LEVELS: { id: GameLevel; label: string; activeClass: string }[] = [
  {
    id: 'easy',
    label: 'Easy',
    activeClass: 'bg-emerald-500 text-white border-b-4 border-emerald-700 shadow-md',
  },
  {
    id: 'medium',
    label: 'Medium',
    activeClass: 'bg-amber-500 text-white border-b-4 border-amber-700 shadow-md',
  },
  {
    id: 'difficult',
    label: 'Difficult',
    activeClass: 'bg-rose-500 text-white border-b-4 border-rose-700 shadow-md',
  },
];

const GAME_CATALOG: {
  id: GameMode;
  title: string;
  tagline: string;
  countLabel: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
  badgeBg: string;
}[] = [
  {
    id: 'fill_blank',
    title: 'Fill in the Blanks',
    tagline: 'Complete missing terms',
    countLabel: '75 Qs',
    icon: Puzzle,
    gradient: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-500/12 text-blue-600 dark:text-blue-300 border-blue-500/25',
  },
  {
    id: 'word_scramble',
    title: 'Word Scramble',
    tagline: 'Unscramble terms',
    countLabel: '45 Qs',
    icon: Shuffle,
    gradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-500/12 text-amber-600 dark:text-amber-300 border-amber-500/25',
  },
  {
    id: 'memory_match',
    title: 'Memory Match',
    tagline: 'Match card pairs',
    countLabel: '9 Decks',
    icon: Layers,
    gradient: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
  },
  {
    id: 'true_false',
    title: 'True or False',
    tagline: 'Fast clinical facts',
    countLabel: '45 Qs',
    icon: Grid2x2Check,
    gradient: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-500/12 text-rose-600 dark:text-rose-300 border-rose-500/25',
  },
];

// Vibrant high-contrast arcade palette for blank spaces & tiles
const TILE_COLORS = [
  {
    solid: 'bg-blue-500 hover:bg-blue-600 border-blue-700 text-white shadow-blue-500/25',
    slotEmpty: 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-400/70 dark:border-blue-400/60 text-blue-500 dark:text-blue-300',
    slotFilled: 'bg-blue-500 border-blue-700 text-white shadow-md shadow-blue-500/30',
  },
  {
    solid: 'bg-amber-500 hover:bg-amber-600 border-amber-700 text-white shadow-amber-500/25',
    slotEmpty: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-400/70 dark:border-amber-400/60 text-amber-600 dark:text-amber-300',
    slotFilled: 'bg-amber-500 border-amber-700 text-white shadow-md shadow-amber-500/30',
  },
  {
    solid: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white shadow-emerald-500/25',
    slotEmpty: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-400/70 dark:border-emerald-400/60 text-emerald-600 dark:text-emerald-300',
    slotFilled: 'bg-emerald-500 border-emerald-700 text-white shadow-md shadow-emerald-500/30',
  },
  {
    solid: 'bg-violet-500 hover:bg-violet-600 border-violet-700 text-white shadow-violet-500/25',
    slotEmpty: 'bg-violet-500/10 dark:bg-violet-500/15 border-violet-400/70 dark:border-violet-400/60 text-violet-600 dark:text-violet-300',
    slotFilled: 'bg-violet-500 border-violet-700 text-white shadow-md shadow-violet-500/30',
  },
  {
    solid: 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white shadow-rose-500/25',
    slotEmpty: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-400/70 dark:border-rose-400/60 text-rose-600 dark:text-rose-300',
    slotFilled: 'bg-rose-500 border-rose-700 text-white shadow-md shadow-rose-500/30',
  },
  {
    solid: 'bg-cyan-500 hover:bg-cyan-600 border-cyan-700 text-white shadow-cyan-500/25',
    slotEmpty: 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-400/70 dark:border-cyan-400/60 text-cyan-600 dark:text-cyan-300',
    slotFilled: 'bg-cyan-500 border-cyan-700 text-white shadow-md shadow-cyan-500/30',
  },
];

// Lightweight Web Audio FX engine
function useGameAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback(
    (freq: number, duration = 0.08, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) => {
      if (muted || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!ctxRef.current) ctxRef.current = new AudioCtx();
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch {}
    },
    [muted]
  );

  return useMemo(
    () => ({
      tap: () => playTone(520, 0.055, 'triangle', 0.07),
      remove: () => playTone(360, 0.055, 'sine', 0.05),
      flip: () => playTone(440, 0.06, 'sine', 0.06),
      success: () => {
        playTone(523.25, 0.09, 'triangle', 0.09, 0);
        playTone(659.25, 0.1, 'triangle', 0.09, 0.07);
        playTone(783.99, 0.14, 'triangle', 0.1, 0.14);
      },
      error: () => {
        playTone(240, 0.12, 'sawtooth', 0.06, 0);
        playTone(190, 0.15, 'sawtooth', 0.06, 0.09);
      },
      victory: () => {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) =>
          playTone(f, 0.15, 'triangle', 0.09, idx * 0.08)
        );
      },
    }),
    [playTone]
  );
}

interface PlacedSlot {
  letter: string;
  bankIdx: number | null;
  colorIdx: number;
}

interface MemoryCardNode {
  uid: string;
  pairId: string;
  side: 'left' | 'right';
  text: string;
  colorIdx: number;
}

export const RadiographyMarbleGame: React.FC<RadiographyMarbleGameProps> = ({
  onNavigateTab,
}) => {
  const { currentUser, openAuthWithTab } = useAuth();
  const userId = currentUser?.id || 'guest';
  const isSignedInAccount = Boolean(currentUser && !currentUser.isGuest);

  const [muted, setMuted] = useState(false);
  const sfx = useGameAudio(muted);

  // Selected game: null shows the Games List Hub; clicking a game opens only that game
  const [selectedGame, setSelectedGame] = useState<GameMode | null>(null);

  // Real live leaderboard records from Firestore
  const [leaderboard, setLeaderboard] = useState<PlayerScoreRecord[]>([]);

  const [progress, setProgress] = useState<UserGameProgress>({
    activeMode: 'fill_blank',
    currentLevel: 'easy',
    levelIndices: { easy: 0, medium: 0, difficult: 0 },
    scrambleIndices: { easy: 0, medium: 0, difficult: 0 },
    trueFalseIndices: { easy: 0, medium: 0, difficult: 0 },
    memoryCompletedDecks: [],
    solvedQuestionIds: [],
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    marblesCount: 0,
    modeScores: { fill_blank: 0, word_scramble: 0, memory_match: 0, true_false: 0 },
    modeSolved: { fill_blank: 0, word_scramble: 0, memory_match: 0, true_false: 0 },
    gamesPlayed: 0,
    correctAnswers: 0,
    attemptsCount: 0,
    recentActivity: [],
    lastPlayedAt: new Date().toISOString(),
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const currentLevel: GameLevel = progress.currentLevel || 'easy';

  // Load saved progress on mount or user switch
  useEffect(() => {
    let active = true;
    loadUserGameProgress(userId).then((loaded) => {
      if (active) {
        setProgress(loaded);
        setIsLoaded(true);
        if (isSignedInAccount && (loaded.totalScore > 0 || loaded.solvedQuestionIds.length > 0)) {
          saveUserGameProgress(userId, loaded, {
            fullName: currentUser?.fullName,
            role: currentUser?.role,
          });
        }
      }
    });
    return () => {
      active = false;
    };
  }, [userId, isSignedInAccount, currentUser?.fullName, currentUser?.role]);

  // Subscribe to real Firestore player scores for live scoreboard
  useEffect(() => {
    const unsub = subscribePlayerScores((players) => {
      setLeaderboard(players);
    });
    return () => unsub?.();
  }, []);

  const persistProgress = useCallback(
    (next: UserGameProgress) => {
      const updated = { ...next, lastPlayedAt: new Date().toISOString() };
      setProgress(updated);
      saveUserGameProgress(userId, updated, {
        fullName: currentUser?.fullName,
        role: currentUser?.role,
      });
    },
    [userId, currentUser?.fullName, currentUser?.role]
  );

  // Record a completed/attempted challenge and push stats to profile + leaderboard
  const recordOutcome = useCallback(
    (
      mode: GameMode,
      challengeId: string,
      category: string,
      points: number,
      isCorrect: boolean,
      markDeckCompleted?: string
    ) => {
      const prevModeScores = progress.modeScores || {
        fill_blank: 0,
        word_scramble: 0,
        memory_match: 0,
        true_false: 0,
      };
      const prevModeSolved = progress.modeSolved || {
        fill_blank: 0,
        word_scramble: 0,
        memory_match: 0,
        true_false: 0,
      };

      const isAlreadySolved = markDeckCompleted
        ? (progress.memoryCompletedDecks || []).includes(markDeckCompleted)
        : progress.solvedQuestionIds.includes(challengeId);

      const streakBonus = isCorrect && !isAlreadySolved ? Math.min(progress.streak, 5) * 15 : 0;
      const earned = isCorrect ? (isAlreadySolved ? (markDeckCompleted ? 40 : 0) : points + streakBonus) : 0;
      const nextStreak = isCorrect ? progress.streak + 1 : 0;

      const activityEntry: GameAttemptRecord = {
        id: `${challengeId}_${Date.now()}`,
        mode,
        category,
        points: earned,
        correct: isCorrect,
        timestamp: new Date().toISOString(),
      };

      persistProgress({
        ...progress,
        activeMode: mode,
        solvedQuestionIds:
          isCorrect && !markDeckCompleted && !isAlreadySolved
            ? [...progress.solvedQuestionIds, challengeId]
            : progress.solvedQuestionIds,
        memoryCompletedDecks:
          isCorrect && markDeckCompleted && !isAlreadySolved
            ? [...(progress.memoryCompletedDecks || []), markDeckCompleted]
            : progress.memoryCompletedDecks || [],
        totalScore: progress.totalScore + earned,
        streak: nextStreak,
        bestStreak: Math.max(progress.bestStreak, nextStreak),
        marblesCount: progress.marblesCount + (isCorrect && !isAlreadySolved ? 1 : 0),
        modeScores: {
          ...prevModeScores,
          [mode]: (prevModeScores[mode] || 0) + earned,
        },
        modeSolved: {
          ...prevModeSolved,
          [mode]:
            isCorrect && !isAlreadySolved
              ? (prevModeSolved[mode] || 0) + 1
              : prevModeSolved[mode] || 0,
        },
        gamesPlayed: (progress.gamesPlayed || 0) + (isCorrect ? 1 : 0),
        correctAnswers: (progress.correctAnswers || 0) + (isCorrect ? 1 : 0),
        attemptsCount: (progress.attemptsCount || 0) + 1,
        recentActivity: [activityEntry, ...(progress.recentActivity || [])].slice(0, 15),
      });
    },
    [progress, persistProgress]
  );

  // =========================================================================
  // LEVEL POOLS FOR EACH GAME
  // =========================================================================
  const fillLevelItems = useMemo(
    () => FILL_BLANK_ITEMS.filter((q) => q.level === currentLevel),
    [currentLevel]
  );
  const scrambleLevelItems = useMemo(
    () => WORD_SCRAMBLE_ITEMS.filter((q) => q.level === currentLevel),
    [currentLevel]
  );
  const tfLevelItems = useMemo(
    () => TRUE_FALSE_ITEMS.filter((q) => q.level === currentLevel),
    [currentLevel]
  );
  const memoryLevelDecks = useMemo(
    () => MEMORY_MATCH_DECKS.filter((d) => d.level === currentLevel),
    [currentLevel]
  );

  const rawFillIdx = progress.levelIndices?.[currentLevel] ?? 0;
  const fillComplete = rawFillIdx >= fillLevelItems.length;
  const currentFillItem = !fillComplete ? fillLevelItems[rawFillIdx] : null;

  const rawScrambleIdx = progress.scrambleIndices?.[currentLevel] ?? 0;
  const scrambleComplete = rawScrambleIdx >= scrambleLevelItems.length;
  const currentScrambleItem = !scrambleComplete ? scrambleLevelItems[rawScrambleIdx] : null;

  const rawTfIdx = progress.trueFalseIndices?.[currentLevel] ?? 0;
  const tfComplete = rawTfIdx >= tfLevelItems.length;
  const currentTfItem = !tfComplete ? tfLevelItems[rawTfIdx] : null;

  // Scroll cleanly to top whenever opening a game, switching tiers, or returning to Hub
  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [selectedGame, currentLevel]);

  // Active word puzzle reference when playing fill_blank or word_scramble
  const activeWordItem = useMemo(() => {
    if (selectedGame === 'fill_blank' && currentFillItem) {
      return {
        id: currentFillItem.id,
        targetWord: currentFillItem.targetWord.toUpperCase().replace(/[^A-Z]/g, ''),
        question: currentFillItem.question,
        clue: currentFillItem.clue,
        category: currentFillItem.category,
        explanation: currentFillItem.explanation,
        points: currentFillItem.points,
      };
    }
    if (selectedGame === 'word_scramble' && currentScrambleItem) {
      return {
        id: currentScrambleItem.id,
        targetWord: currentScrambleItem.word.toUpperCase().replace(/[^A-Z]/g, ''),
        question: currentScrambleItem.clue,
        clue: currentScrambleItem.clue,
        category: currentScrambleItem.category,
        explanation: currentScrambleItem.explanation,
        points: currentScrambleItem.points,
      };
    }
    return null;
  }, [selectedGame, currentFillItem, currentScrambleItem]);

  const [scrambleReshuffleCount, setScrambleReshuffleCount] = useState(0);

  const letterBank = useMemo(() => {
    if (!activeWordItem) return [];
    if (selectedGame === 'fill_blank') {
      return generateConfusingLetterBank(activeWordItem.targetWord, activeWordItem.id);
    }
    const chars = activeWordItem.targetWord.split('');
    let shuffled = seededShuffle(chars, `${activeWordItem.id}_ws_${scrambleReshuffleCount}`);
    if (shuffled.join('') === activeWordItem.targetWord && chars.length > 1) {
      shuffled = [...shuffled.slice(1), shuffled[0]];
    }
    return shuffled;
  }, [activeWordItem, selectedGame, scrambleReshuffleCount]);

  const [slots, setSlots] = useState<(PlacedSlot | null)[]>([]);
  const [showClue, setShowClue] = useState(false);
  const [wordStatus, setWordStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

  useEffect(() => {
    if (activeWordItem) {
      setSlots(new Array(activeWordItem.targetWord.length).fill(null));
      setShowClue(false);
      setWordStatus('playing');
    }
  }, [activeWordItem?.id, selectedGame, currentLevel]);

  const usedBankIndices = useMemo(() => {
    const set = new Set<number>();
    slots.forEach((s) => {
      if (s && s.bankIdx !== null) set.add(s.bankIdx);
    });
    return set;
  }, [slots]);

  const handleTilePick = useCallback(
    (letter: string, bankIdx: number) => {
      if (!activeWordItem || wordStatus === 'correct') return;
      if (usedBankIndices.has(bankIdx)) return;

      const emptyIdx = slots.findIndex((s) => s === null);
      if (emptyIdx === -1) return;

      sfx.tap();
      const next = [...slots];
      next[emptyIdx] = {
        letter,
        bankIdx,
        colorIdx: bankIdx % TILE_COLORS.length,
      };
      setSlots(next);
      if (wordStatus === 'wrong') setWordStatus('playing');
    },
    [activeWordItem, wordStatus, usedBankIndices, slots, sfx]
  );

  const handleRemoveSlot = useCallback(
    (slotIdx: number) => {
      if (wordStatus === 'correct') return;
      if (!slots[slotIdx]) return;
      sfx.remove();
      const next = [...slots];
      next[slotIdx] = null;
      setSlots(next);
      if (wordStatus === 'wrong') setWordStatus('playing');
    },
    [wordStatus, slots, sfx]
  );

  const handleBackspace = useCallback(() => {
    if (wordStatus === 'correct') return;
    const lastFilled = [...slots].reverse().findIndex((s) => s !== null);
    if (lastFilled === -1) return;
    handleRemoveSlot(slots.length - 1 - lastFilled);
  }, [wordStatus, slots, handleRemoveSlot]);

  const handleClearSlots = useCallback(() => {
    if (!activeWordItem || wordStatus === 'correct') return;
    sfx.remove();
    setSlots(new Array(activeWordItem.targetWord.length).fill(null));
    setWordStatus('playing');
  }, [activeWordItem, wordStatus, sfx]);

  const handleRevealOneLetter = useCallback(() => {
    if (!activeWordItem || wordStatus === 'correct') return;
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;

    const neededChar = activeWordItem.targetWord[emptyIdx];
    const availBankIdx = letterBank.findIndex(
      (ch, idx) => ch === neededChar && !usedBankIndices.has(idx)
    );

    sfx.tap();
    const next = [...slots];
    next[emptyIdx] = {
      letter: neededChar,
      bankIdx: availBankIdx !== -1 ? availBankIdx : null,
      colorIdx: (availBankIdx !== -1 ? availBankIdx : emptyIdx) % TILE_COLORS.length,
    };
    setSlots(next);
    setWordStatus('playing');
  }, [activeWordItem, wordStatus, slots, letterBank, usedBankIndices, sfx]);

  const handleCheckWord = useCallback(() => {
    if (!activeWordItem || wordStatus === 'correct' || !selectedGame) return;
    if (slots.some((s) => s === null)) return;

    const guess = slots.map((s) => s!.letter).join('');
    if (guess === activeWordItem.targetWord) {
      sfx.success();
      setWordStatus('correct');
      recordOutcome(
        selectedGame,
        activeWordItem.id,
        activeWordItem.category,
        activeWordItem.points,
        true
      );
    } else {
      sfx.error();
      setWordStatus('wrong');
      recordOutcome(selectedGame, activeWordItem.id, activeWordItem.category, 0, false);
    }
  }, [activeWordItem, wordStatus, selectedGame, slots, sfx, recordOutcome]);

  useEffect(() => {
    if (
      (selectedGame === 'fill_blank' || selectedGame === 'word_scramble') &&
      activeWordItem &&
      wordStatus === 'playing' &&
      slots.length === activeWordItem.targetWord.length &&
      slots.length > 0 &&
      slots.every((s) => s !== null)
    ) {
      handleCheckWord();
    }
  }, [slots, selectedGame, activeWordItem, wordStatus, handleCheckWord]);

  useEffect(() => {
    if (selectedGame !== 'fill_blank' && selectedGame !== 'word_scramble') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        const ch = e.key.toUpperCase();
        const idx = letterBank.findIndex((b, bi) => b === ch && !usedBankIndices.has(bi));
        if (idx !== -1) {
          handleTilePick(ch, idx);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedGame, letterBank, usedBankIndices, handleTilePick, handleBackspace]);

  const handleNextWordPuzzle = () => {
    sfx.tap();
    if (selectedGame === 'fill_blank') {
      persistProgress({
        ...progress,
        levelIndices: { ...progress.levelIndices, [currentLevel]: rawFillIdx + 1 },
      });
    } else if (selectedGame === 'word_scramble') {
      persistProgress({
        ...progress,
        scrambleIndices: {
          ...(progress.scrambleIndices || { easy: 0, medium: 0, difficult: 0 }),
          [currentLevel]: rawScrambleIdx + 1,
        },
      });
    }
  };

  // =========================================================================
  // MEMORY MATCH STATE
  // =========================================================================
  const [selectedDeckIdx, setSelectedDeckIdx] = useState(0);
  const activeDeck = memoryLevelDecks[selectedDeckIdx] || memoryLevelDecks[0];

  const memoryCards = useMemo<MemoryCardNode[]>(() => {
    if (!activeDeck) return [];
    const raw: MemoryCardNode[] = [];
    activeDeck.pairs.forEach((pair, idx) => {
      const colorIdx = idx % TILE_COLORS.length;
      raw.push({ uid: `${activeDeck.id}_${pair.id}_L`, pairId: pair.id, side: 'left', text: pair.left, colorIdx });
      raw.push({ uid: `${activeDeck.id}_${pair.id}_R`, pairId: pair.id, side: 'right', text: pair.right, colorIdx });
    });
    return seededShuffle(raw, `${activeDeck.id}_cards`);
  }, [activeDeck]);

  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryLocked, setMemoryLocked] = useState(false);

  const resetMemoryBoard = useCallback(() => {
    setFlippedUids([]);
    setMatchedPairIds([]);
    setMemoryMoves(0);
    setMemoryLocked(false);
  }, []);

  useEffect(() => {
    setSelectedDeckIdx(0);
  }, [currentLevel]);

  useEffect(() => {
    resetMemoryBoard();
  }, [activeDeck?.id, resetMemoryBoard]);

  const handleCardFlip = (card: MemoryCardNode) => {
    if (memoryLocked) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (flippedUids.includes(card.uid)) return;

    sfx.flip();
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setMemoryMoves((m) => m + 1);
      setMemoryLocked(true);

      const firstCard = memoryCards.find((c) => c.uid === nextFlipped[0]);
      const secondCard = card;

      if (firstCard && firstCard.pairId === secondCard.pairId && firstCard.uid !== secondCard.uid) {
        const nextMatched = [...matchedPairIds, secondCard.pairId];
        setTimeout(() => {
          sfx.success();
          setMatchedPairIds(nextMatched);
          setFlippedUids([]);
          setMemoryLocked(false);

          if (activeDeck && nextMatched.length === activeDeck.pairs.length) {
            sfx.victory();
            recordOutcome(
              'memory_match',
              activeDeck.id,
              activeDeck.category,
              activeDeck.points,
              true,
              activeDeck.id
            );
          }
        }, 300);
      } else {
        setTimeout(() => {
          sfx.error();
          setFlippedUids([]);
          setMemoryLocked(false);
        }, 800);
      }
    }
  };

  // =========================================================================
  // TRUE OR FALSE STATE
  // =========================================================================
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);

  useEffect(() => {
    setTfAnswer(null);
  }, [currentTfItem?.id, currentLevel]);

  const handleTrueFalsePick = (choice: boolean) => {
    if (!currentTfItem || tfAnswer !== null) return;
    setTfAnswer(choice);

    const isCorrect = choice === currentTfItem.isTrue;
    if (isCorrect) sfx.success();
    else sfx.error();

    recordOutcome(
      'true_false',
      currentTfItem.id,
      currentTfItem.category,
      currentTfItem.points,
      isCorrect
    );
  };

  const handleNextTrueFalse = () => {
    sfx.tap();
    persistProgress({
      ...progress,
      trueFalseIndices: {
        ...(progress.trueFalseIndices || { easy: 0, medium: 0, difficult: 0 }),
        [currentLevel]: rawTfIdx + 1,
      },
    });
  };

  const handleReplayTier = () => {
    sfx.tap();
    if (selectedGame === 'fill_blank') {
      persistProgress({ ...progress, levelIndices: { ...progress.levelIndices, [currentLevel]: 0 } });
    } else if (selectedGame === 'word_scramble') {
      persistProgress({
        ...progress,
        scrambleIndices: {
          ...(progress.scrambleIndices || { easy: 0, medium: 0, difficult: 0 }),
          [currentLevel]: 0,
        },
      });
    } else if (selectedGame === 'true_false') {
      persistProgress({
        ...progress,
        trueFalseIndices: {
          ...(progress.trueFalseIndices || { easy: 0, medium: 0, difficult: 0 }),
          [currentLevel]: 0,
        },
      });
    }
  };

  const handleJumpPuzzle = (delta: number) => {
    if (selectedGame === 'fill_blank') {
      const next = Math.max(0, Math.min(fillLevelItems.length - 1, rawFillIdx + delta));
      persistProgress({ ...progress, levelIndices: { ...progress.levelIndices, [currentLevel]: next } });
    } else if (selectedGame === 'word_scramble') {
      const next = Math.max(0, Math.min(scrambleLevelItems.length - 1, rawScrambleIdx + delta));
      persistProgress({
        ...progress,
        scrambleIndices: { ...(progress.scrambleIndices || { easy: 0, medium: 0, difficult: 0 }), [currentLevel]: next },
      });
    } else if (selectedGame === 'true_false') {
      const next = Math.max(0, Math.min(tfLevelItems.length - 1, rawTfIdx + delta));
      persistProgress({
        ...progress,
        trueFalseIndices: { ...(progress.trueFalseIndices || { easy: 0, medium: 0, difficult: 0 }), [currentLevel]: next },
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full min-h-[55vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7F32] to-amber-500 mx-auto animate-bounce" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Loading Radiography Games...
          </p>
        </div>
      </div>
    );
  }

  // Real calculated player summary stats
  const totalSolvedCount =
    progress.solvedQuestionIds.length + (progress.memoryCompletedDecks?.length || 0);
  const accuracyPct =
    progress.attemptsCount && progress.attemptsCount > 0
      ? Math.round(((progress.correctAnswers || 0) / progress.attemptsCount) * 100)
      : 0;

  // =========================================================================
  // VIEW A: GAMES HUB / SELECTION LIST (when no game is open yet)
  // =========================================================================
  if (selectedGame === null) {
    return (
      <div className="w-full space-y-5 select-none text-left">
        {/* Hub Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Games
          </h1>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="min-w-[44px] min-h-[44px] rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>

        {/* REAL PLAYER RECORDED STATS CARD */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#002147] via-[#092C5C] to-[#0E1E38] text-white border border-slate-700/70 shadow-md space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF7F32]/20 border border-[#FF7F32]/40 text-[#FF7F32] flex items-center justify-center font-black text-sm shrink-0">
                {currentUser?.fullName
                  ? currentUser.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'PL'}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  {isSignedInAccount ? currentUser?.fullName : 'Guest'}
                </h2>
                {isSignedInAccount && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Synced
                  </span>
                )}
              </div>
            </div>

            {!isSignedInAccount && (
              <button
                type="button"
                onClick={() => openAuthWithTab('signIn')}
                className="px-3.5 py-2 rounded-xl bg-[#FF7F32] hover:bg-[#E56A22] text-white text-xs font-extrabold cursor-pointer transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Score</span>
              </div>
              <div className="text-lg font-black tabular-nums mt-0.5">
                {progress.totalScore.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <Flame className="w-3.5 h-3.5 text-[#FF7F32]" />
                <span>Streak</span>
              </div>
              <div className="text-lg font-black tabular-nums mt-0.5">
                {progress.bestStreak}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Solved</span>
              </div>
              <div className="text-lg font-black tabular-nums mt-0.5">
                {totalSolvedCount}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <Target className="w-3.5 h-3.5 text-cyan-300" />
                <span>Accuracy</span>
              </div>
              <div className="text-lg font-black tabular-nums mt-0.5">
                {progress.attemptsCount ? `${accuracyPct}%` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ALL GAMES SELECTION LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {GAME_CATALOG.map((game) => {
            const Icon = game.icon;
            const modeScore = progress.modeScores?.[game.id] ?? 0;

            return (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  sfx.tap();
                  setSelectedGame(game.id);
                  persistProgress({ ...progress, activeMode: game.id });
                }}
                className="group p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#FF7F32] dark:hover:border-[#FF7F32] shadow-xs text-left flex flex-col justify-between gap-3.5 transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${game.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-[#FF7F32] transition-colors truncate">
                        {game.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {game.tagline}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-extrabold shrink-0 ${game.badgeBg}`}>
                    {game.countLabel}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold tabular-nums">
                    {modeScore} pts
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 group-hover:bg-[#FF7F32] group-hover:text-white text-xs font-extrabold transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* REAL FIRESTORE LEADERBOARD / PLAYER SCORES */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/12 text-amber-500 flex items-center justify-center">
                <Medal className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Scoreboard
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{leaderboard.length}</span>
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <Trophy className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                No scores yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 15).map((player, idx) => {
                const isSelf = isSignedInAccount && player.userId === userId;
                return (
                  <div
                    key={player.userId}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isSelf
                        ? 'bg-[#FF7F32]/10 border-[#FF7F32]/40'
                        : 'bg-slate-50 dark:bg-[#161F30] border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-white'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                            ? 'bg-orange-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {player.playerName}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FF7F32] text-white text-[9px] font-extrabold uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {player.solvedCount} solved
                        </p>
                      </div>
                    </div>

                    <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums shrink-0">
                      {player.totalScore.toLocaleString()} pts
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: ACTIVE SELECTED GAME ONLY
  // =========================================================================
  const activeMeta = GAME_CATALOG.find((m) => m.id === selectedGame) || GAME_CATALOG[0];

  const isTierCompleted =
    (selectedGame === 'fill_blank' && fillComplete) ||
    (selectedGame === 'word_scramble' && scrambleComplete) ||
    (selectedGame === 'true_false' && tfComplete);

  const deckSolved =
    selectedGame === 'memory_match' &&
    activeDeck &&
    matchedPairIds.length === activeDeck.pairs.length;

  return (
    <div className="w-full space-y-4 select-none text-left">
      {/* ACTIVE GAME TOP HUD */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setSelectedGame(null);
            }}
            className="min-h-[44px] px-3.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:border-[#FF7F32] cursor-pointer transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF7F32]" />
            <span>Games</span>
          </button>
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
            {activeMeta.title}
          </h1>
        </div>

        {/* Live Streak, Total Score & Sound Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-2xl bg-amber-500/12 border border-amber-500/30 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black tabular-nums text-amber-600 dark:text-amber-300">
              {progress.streak}
            </span>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-blue-500/12 border border-blue-500/30 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-black tabular-nums text-blue-700 dark:text-blue-300">
              {progress.totalScore}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="min-w-[44px] min-h-[44px] rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label={muted ? 'Unmute game sounds' : 'Mute game sounds'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>
      </div>

      {/* DIFFICULTY TIER SELECTOR */}
      <div className="bg-white dark:bg-[#121824] p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((lvl) => {
            const isActive = currentLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  sfx.tap();
                  persistProgress({ ...progress, currentLevel: lvl.id });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[40px] ${
                  isActive
                    ? lvl.activeClass
                    : 'bg-slate-100 dark:bg-[#182030] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LEVEL COMPLETED SUMMARY STATE */}
      {isTierCompleted && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {currentLevel.toUpperCase()} Complete
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {progress.totalScore.toLocaleString()} pts
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReplayTier}
              className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay</span>
            </button>
            {currentLevel !== 'difficult' && (
              <button
                type="button"
                onClick={() =>
                  persistProgress({
                    ...progress,
                    currentLevel: currentLevel === 'easy' ? 'medium' : 'difficult',
                  })
                }
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF7F32] to-amber-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Next Tier</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODE 1 & 2: FILL IN THE BLANKS / WORD SCRAMBLE */}
      {(selectedGame === 'fill_blank' || selectedGame === 'word_scramble') &&
        !isTierCompleted &&
        activeWordItem && (
          <div className="space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-500/12 border border-indigo-500/25 text-indigo-600 dark:text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                  {activeWordItem.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleJumpPuzzle(-1)}
                    disabled={(selectedGame === 'fill_blank' ? rawFillIdx : rawScrambleIdx) === 0}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    aria-label="Previous puzzle"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-extrabold tabular-nums text-slate-600 dark:text-slate-300 px-1.5">
                    {(selectedGame === 'fill_blank' ? rawFillIdx : rawScrambleIdx) + 1} /{' '}
                    {selectedGame === 'fill_blank' ? fillLevelItems.length : scrambleLevelItems.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleJumpPuzzle(1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
                    aria-label="Skip puzzle"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {activeWordItem.question}
              </h2>

              {selectedGame === 'fill_blank' && showClue && (
                <div className="p-3 rounded-2xl bg-amber-500/12 border border-amber-500/30 flex items-start gap-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-semibold">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{activeWordItem.clue}</span>
                </div>
              )}

              {/* COLORFUL BLANK LETTER SPACES */}
              <div className="pt-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {slots.map((placed, idx) => {
                    const colorTheme = TILE_COLORS[idx % TILE_COLORS.length];
                    const isCorrect = wordStatus === 'correct';
                    const isWrong = wordStatus === 'wrong';

                    let slotClass = colorTheme.slotEmpty;
                    if (isCorrect) {
                      slotClass =
                        'bg-emerald-500 border-emerald-700 text-white shadow-lg shadow-emerald-500/30 scale-105';
                    } else if (isWrong && placed) {
                      slotClass =
                        'bg-rose-500 border-rose-700 text-white shadow-md shadow-rose-500/30';
                    } else if (placed) {
                      slotClass = TILE_COLORS[placed.colorIdx].slotFilled;
                    }

                    const compactSize =
                      activeWordItem.targetWord.length >= 12
                        ? 'w-9 h-11 sm:w-11 sm:h-12 text-base sm:text-lg'
                        : activeWordItem.targetWord.length >= 9
                        ? 'w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl'
                        : 'w-11 h-13 sm:w-13 sm:h-14 text-xl sm:text-2xl';

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleRemoveSlot(idx)}
                        disabled={!placed || isCorrect}
                        className={`${compactSize} rounded-2xl border-2 border-b-4 font-black uppercase flex items-center justify-center transition-all duration-150 ${slotClass} ${
                          placed && !isCorrect ? 'cursor-pointer active:translate-y-0.5' : 'cursor-default'
                        }`}
                        aria-label={`Letter space ${idx + 1}`}
                      >
                        {placed ? placed.letter : ''}
                      </button>
                    );
                  })}
                </div>

                {wordStatus === 'wrong' && (
                  <p className="text-center text-xs font-extrabold text-rose-500 dark:text-rose-400 mt-3 flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Try again — tap a tile to swap</span>
                  </p>
                )}
              </div>

              {wordStatus !== 'correct' && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {selectedGame === 'fill_blank' && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.tap();
                        setShowClue((s) => !s);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{showClue ? 'Hide' : 'Hint'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRevealOneLetter}
                    className="px-3 py-2 rounded-xl bg-violet-500/12 hover:bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Letter</span>
                  </button>

                  {selectedGame === 'word_scramble' && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.tap();
                        handleClearSlots();
                        setScrambleReshuffleCount((c) => c + 1);
                      }}
                      className="px-3 py-2 rounded-xl bg-cyan-500/12 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Shuffle</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSlots}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            {wordStatus !== 'correct' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {letterBank.map((letter, idx) => {
                    const isUsed = usedBankIndices.has(idx);
                    const palette = TILE_COLORS[idx % TILE_COLORS.length];
                    return (
                      <button
                        key={`${activeWordItem.id}_${idx}_${letter}`}
                        type="button"
                        disabled={isUsed}
                        onClick={() => handleTilePick(letter, idx)}
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border-b-4 font-black text-lg sm:text-xl uppercase flex items-center justify-center transition-all duration-150 ${
                          isUsed
                            ? 'bg-slate-200 dark:bg-slate-800/60 border-slate-300 dark:border-slate-800 text-transparent scale-90 opacity-35 cursor-default'
                            : `${palette.solid} cursor-pointer active:translate-y-0.5 active:border-b-2 shadow-md`
                        }`}
                        aria-label={`Letter ${letter}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {wordStatus === 'correct' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/12 border border-emerald-500/35 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>+{activeWordItem.points} pts</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-xs font-extrabold">
                    {activeWordItem.targetWord}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {activeWordItem.explanation}
                </p>
                <button
                  type="button"
                  onClick={handleNextWordPuzzle}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-[0.99]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      {/* MODE 3: MEMORY MATCH BOARD */}
      {selectedGame === 'memory_match' && activeDeck && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {activeDeck.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {memoryMoves} moves ·{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {matchedPairIds.length}/{activeDeck.pairs.length}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  resetMemoryBoard();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {memoryLevelDecks.map((deck, dIdx) => {
                const isCurrent = dIdx === selectedDeckIdx;
                const isDone = (progress.memoryCompletedDecks || []).includes(deck.id);
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => {
                      sfx.tap();
                      setSelectedDeckIdx(dIdx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5" />}
                    <span>Deck {dIdx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {memoryCards.map((card, cIdx) => {
              const isFlipped = flippedUids.includes(card.uid);
              const isMatched = matchedPairIds.includes(card.pairId);
              const isRevealed = isFlipped || isMatched;
              const backTheme = TILE_COLORS[cIdx % TILE_COLORS.length];

              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardFlip(card)}
                  disabled={isMatched}
                  className={`min-h-[92px] sm:min-h-[104px] p-3 rounded-2xl border-2 border-b-4 flex items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                    isMatched
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-[0.98]'
                      : isRevealed
                      ? card.side === 'left'
                        ? 'bg-blue-500/15 border-blue-500 text-slate-900 dark:text-white shadow-md'
                        : 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-md'
                      : `${backTheme.solid} active:translate-y-0.5`
                  }`}
                >
                  {isRevealed ? (
                    <span className="text-xs sm:text-sm font-extrabold leading-snug">
                      {card.text}
                    </span>
                  ) : (
                    <HelpCircle className="w-6 h-6 opacity-90" />
                  )}
                </button>
              );
            })}
          </div>

          {deckSolved && (
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/12 border border-emerald-500/35 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-emerald-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    Cleared in {memoryMoves} moves (+{activeDeck.points} pts)
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetMemoryBoard}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  Replay
                </button>
                {selectedDeckIdx < memoryLevelDecks.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDeckIdx((i) => i + 1)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold cursor-pointer flex items-center gap-1"
                  >
                    <span>Next Deck</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: TRUE OR FALSE */}
      {selectedGame === 'true_false' && !isTierCompleted && currentTfItem && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-xl bg-rose-500/12 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-[11px] font-extrabold uppercase tracking-wider">
                {currentTfItem.category}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleJumpPuzzle(-1)}
                  disabled={rawTfIdx === 0}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  aria-label="Previous statement"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-extrabold tabular-nums text-slate-600 dark:text-slate-300 px-1.5">
                  {rawTfIdx + 1} / {tfLevelItems.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleJumpPuzzle(1)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  aria-label="Skip statement"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentTfItem.statement}
            </h2>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={tfAnswer !== null}
                onClick={() => handleTrueFalsePick(true)}
                className={`py-4 px-4 rounded-2xl border-b-4 font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[56px] ${
                  tfAnswer === null
                    ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white shadow-md active:translate-y-0.5'
                    : currentTfItem.isTrue
                    ? 'bg-emerald-500 border-emerald-700 text-white ring-4 ring-emerald-400/40'
                    : tfAnswer === true
                    ? 'bg-rose-500 border-rose-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>TRUE</span>
              </button>

              <button
                type="button"
                disabled={tfAnswer !== null}
                onClick={() => handleTrueFalsePick(false)}
                className={`py-4 px-4 rounded-2xl border-b-4 font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[56px] ${
                  tfAnswer === null
                    ? 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white shadow-md active:translate-y-0.5'
                    : !currentTfItem.isTrue
                    ? 'bg-emerald-500 border-emerald-700 text-white ring-4 ring-emerald-400/40'
                    : tfAnswer === false
                    ? 'bg-rose-500 border-rose-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span>FALSE</span>
              </button>
            </div>
          </div>

          {tfAnswer !== null && (
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-3 animate-fadeIn ${
                tfAnswer === currentTfItem.isTrue
                  ? 'bg-emerald-500/12 border-emerald-500/35'
                  : 'bg-rose-500/12 border-rose-500/35'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                {tfAnswer === currentTfItem.isTrue ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-300">
                      +{currentTfItem.points} pts
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span className="text-rose-700 dark:text-rose-300">
                      Answer: {currentTfItem.isTrue ? 'TRUE' : 'FALSE'}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {currentTfItem.explanation}
              </p>
              <button
                type="button"
                onClick={handleNextTrueFalse}
                className="w-full py-3 rounded-2xl bg-[#002147] hover:bg-[#0A3266] text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
