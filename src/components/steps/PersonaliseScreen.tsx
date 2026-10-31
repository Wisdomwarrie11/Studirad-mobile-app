import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wordmark } from '../brand/Wordmark';
import { 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  Layers, 
  Waves, 
  HeartHandshake, 
  BookMarked,
  ArrowRight
} from 'lucide-react';
import { LearningTopic } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

const CLINICAL_TOPICS: LearningTopic[] = [
  {
    id: 'general_radiography',
    title: 'General Radiography',
    category: 'Foundational Imaging',
    description: 'Skeletal positioning, chest X-rays, trauma protocols, pediatric views, and grid physics.',
    iconName: 'general',
    moduleCount: 42,
  },
  {
    id: 'ct_mri',
    title: 'CT & MRI',
    category: 'Cross-Sectional',
    description: 'Computed tomography reconstruction, MRI sequence physics, contrast safety, and neuro/cardiac imaging.',
    iconName: 'cross_sectional',
    moduleCount: 38,
  },
  {
    id: 'ultrasound',
    title: 'Ultrasound',
    category: 'Sonography',
    description: 'Abdominal, vascular Doppler, musculoskeletal scanning, and point-of-care emergency ultrasound.',
    iconName: 'ultrasound',
    moduleCount: 29,
  },
  {
    id: 'mammography',
    title: 'Mammography',
    category: 'Specialist Screening',
    description: 'Breast anatomy, compression technique, 3D tomosynthesis, biopsy assistance, and quality audit.',
    iconName: 'mammography',
    moduleCount: 24,
  },
  {
    id: 'radiation_protection',
    title: 'Radiation Protection',
    category: 'Safety & Regulations',
    description: 'ALARA / ALARP principles, diagnostic reference levels, dosimetry calculations, and IRR/IRMER compliance.',
    iconName: 'safety',
    moduleCount: 31,
  },
  {
    id: 'research_cpd',
    title: 'Research & Professional Development',
    category: 'Academic & Career',
    description: 'Dissertation support, clinical audit, journal appraisal, CPD portfolio, and locum interview prep.',
    iconName: 'research',
    moduleCount: 26,
  },
];

export const PersonaliseScreen: React.FC = () => {
  const { currentUser, saveSelectedTopics } = useAuth();
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() => {
    return currentUser?.selectedTopics?.length
      ? currentUser.selectedTopics
      : ['general_radiography', 'radiation_protection'];
  });

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTopicIds.length === CLINICAL_TOPICS.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(CLINICAL_TOPICS.map((t) => t.id));
    }
  };

  const handleSave = () => {
    saveSelectedTopics(selectedTopicIds);
  };

  const handleSkip = () => {
    saveSelectedTopics(selectedTopicIds);
  };

  const getTopicIcon = (iconName: string, isSelected: boolean) => {
    const iconColor = isSelected ? 'text-[#FF7F32]' : 'text-slate-400';
    switch (iconName) {
      case 'general':
        return <Layers className={`w-5 h-5 ${iconColor}`} />;
      case 'cross_sectional':
        return <Activity className={`w-5 h-5 ${iconColor}`} />;
      case 'ultrasound':
        return <Waves className={`w-5 h-5 ${iconColor}`} />;
      case 'mammography':
        return <HeartHandshake className={`w-5 h-5 ${iconColor}`} />;
      case 'safety':
        return <ShieldAlert className={`w-5 h-5 ${iconColor}`} />;
      case 'research':
        return <BookMarked className={`w-5 h-5 ${iconColor}`} />;
      default:
        return <Sparkles className={`w-5 h-5 ${iconColor}`} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between py-6 px-4 sm:px-6 md:px-8 select-none">
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 justify-between">
        {/* Top Header */}
        <header className="w-full pb-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
          <Wordmark size="sm" withIcon={true} />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleSkip}
              className="text-sm font-semibold text-slate-400 hover:text-[var(--text-primary)] px-4 py-2 rounded-xl hover:bg-[var(--bg-surface-elevated)] transition-colors min-h-[44px] flex items-center"
            >
              Skip for Now
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="py-6 sm:py-8 flex-1 flex flex-col">
          <div className="text-left mb-6">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FF7F32] mb-1.5 block">
              Tailor Your Experience
            </span>
            <h1 className="heading-section text-[var(--text-primary)] mb-2">
              Personalise Your Learning
            </h1>
            <p className="body-standard text-[var(--text-secondary)]">
              Choose the clinical imaging disciplines you want prioritized on your dashboard, live masterclass notifications, and career boards. You can change these anytime in your profile.
            </p>

            {/* Select All Toggle */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--text-secondary)]">
                {selectedTopicIds.length} of {CLINICAL_TOPICS.length} topics selected
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#FF7F32] hover:underline font-bold text-sm"
              >
                {selectedTopicIds.length === CLINICAL_TOPICS.length ? 'Deselect All' : 'Select All Topics'}
              </button>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-4">
            {CLINICAL_TOPICS.map((topic) => {
              const isSelected = selectedTopicIds.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between relative min-h-[140px] ${
                    isSelected
                      ? 'bg-[var(--bg-surface-elevated)] border-[#FF7F32] shadow-sm ring-1 ring-[#FF7F32]/50'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      {getTopicIcon(topic.iconName, isSelected)}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#FF7F32] border-[#FF7F32] text-white'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h2 className="heading-card text-[var(--text-primary)] mb-0.5">
                      {topic.title}
                    </h2>
                    <span className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                      {topic.category} · {topic.moduleCount} Modules
                    </span>
                    <p className="body-secondary text-[var(--text-secondary)] line-clamp-2">
                      {topic.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        {/* Footer Actions */}
        <footer className="w-full pt-4 border-t border-[var(--border-subtle)] flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 h-12 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm hover:bg-[var(--bg-surface-elevated)] transition-colors min-h-[48px]"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-xl bg-[#FF7F32] hover:bg-[#E86B20] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#FF7F32]/20 active:scale-[0.98] transition-all min-h-[48px]"
          >
            <span>Save Preferences & Start Learning</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </footer>
      </div>
    </div>
  );
};
