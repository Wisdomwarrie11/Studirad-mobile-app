import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/Wordmark';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import radiographyImg from '../../assets/images/onboarding_radiography_1792606674447.jpg';
import classesImg from '../../assets/images/onboarding_classes_1792606674536.jpg';
import careersImg from '../../assets/images/onboarding_careers_1792606674049.jpg';

interface OnboardingSlide {
  id: number;
  title: string;
  image: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 0,
    title: 'Learn radiography skills from anywhere',
    image: radiographyImg,
  },
  {
    id: 1,
    title: 'Attend expert-led classes and improve your knowledge',
    image: classesImg,
  },
  {
    id: 2,
    title: 'Discover jobs, internships, scholarships and locum opportunities',
    image: careersImg,
  },
];

export const OnboardingScreen: React.FC = () => {
  const { setScreen, currentUser } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // If user already has an account / is logged in, immediately take them straight to home page
  useEffect(() => {
    if (currentUser) {
      setScreen('app');
    }
  }, [currentUser, setScreen]);

  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeIndex < SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
    if (isRightSwipe && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      setScreen('auth');
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setScreen('auth');
  };

  const currentSlide = SLIDES[activeIndex];

  return (
    <div 
      className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between py-6 px-4 sm:px-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1 justify-between">
        {/* Top Header Bar */}
        <header className="w-full pb-3 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
          <Wordmark size="sm" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleSkip}
              className="text-sm font-semibold text-slate-500 hover:text-[var(--text-primary)] px-3 py-1.5 rounded-xl hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            >
              Skip
            </button>
          </div>
        </header>

        {/* Slide Content: Normal photography images & ONLY the header */}
        <main className="my-auto py-6 flex flex-col gap-6">
          {/* Normal photography image */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden shadow-md border border-[var(--border-subtle)] bg-slate-900">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Minimal text: ONLY the header, NO other text */}
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
              {currentSlide.title}
            </h1>
          </div>
        </main>

        {/* Bottom Navigation & Controls */}
        <footer className="w-full pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-4 shrink-0">
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {SLIDES.map((slide, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-8 bg-[#FF7F32]'
                        : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>

            <span className="text-xs font-semibold text-[var(--text-muted)] font-mono">
              {activeIndex + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-3">
            {activeIndex > 0 && (
              <button
                onClick={handlePrev}
                className="w-14 h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] active:scale-95 transition-all shrink-0 cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {activeIndex === SLIDES.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 h-12 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-[#FF7F32]/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 h-12 rounded-xl bg-[#002147] dark:bg-[#1B447A] hover:bg-[#001733] dark:hover:bg-[#23589E] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5 text-[#FF7F32]" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
