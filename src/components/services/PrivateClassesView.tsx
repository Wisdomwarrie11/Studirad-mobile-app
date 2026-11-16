import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { PrivateClass } from '../../types';
import { subscribePrivateClasses } from '../../services/firebaseDataService';
import { scrollToTopInstant } from '../../utils/scrollTop';
import {
  PrivateClassDetailPage,
  getPrivateClassFallbackImage,
} from './PrivateClassDetailPage';
import { StarRatingWidget } from '../common/StarRatingWidget';
import { GraduationCap, Search } from 'lucide-react';

interface PrivateClassesViewProps {
  onViewMyRequests: () => void;
}

export const PrivateClassesView: React.FC<PrivateClassesViewProps> = ({
  onViewMyRequests,
}) => {
  const [classes, setClasses] = useState<PrivateClass[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<PrivateClass | null>(null);

  useEffect(() => {
    const unsub = subscribePrivateClasses((list) => {
      setClasses(list.filter((item) => item.status === 'published'));
    });
    return () => unsub?.();
  }, []);

  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [selectedClass?.id]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(classes.map((c) => c.category))).filter(Boolean);
    return ['All', ...unique];
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classes.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.instructorName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.level.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [classes, selectedCategory, searchQuery]);

  // Navigate to dedicated inline page view when a class is opened
  if (selectedClass) {
    return (
      <PrivateClassDetailPage
        privateClass={selectedClass}
        onBack={() => setSelectedClass(null)}
        onViewMyRequests={onViewMyRequests}
      />
    );
  }

  return (
    <div className="space-y-5 text-left">
      {/* Section Header */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-5 sm:p-6 border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
            1-on-1 Coaching
          </span>
          <h2 className="heading-section text-[var(--text-primary)]">
            Available Private Classes
          </h2>
        </div>

        {/* Show Search & Category Filter only when real published classes exist */}
        {classes.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by class title or instructor..."
                className="w-full pl-10 pr-4 h-11 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF7F32]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      active
                        ? 'bg-[#002147] dark:bg-[#1B447A] text-white border-[#FF7F32]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Real-Data States */}
      {classes.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2.5">
          <GraduationCap className="w-11 h-11 text-[#FF7F32] mx-auto" />
          <h3 className="heading-card text-[var(--text-primary)]">
            No private class sessions right now
          </h3>
          <p className="body-secondary text-[var(--text-secondary)] max-w-sm mx-auto">
            Please check back later.
          </p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-[#FF7F32] mx-auto" />
          <h3 className="heading-card text-[var(--text-primary)]">
            No matching private classes found
          </h3>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF7F32] text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Horizontally Stacked Cards: Image, Title, Instructor & Real Ratings */
        <div className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1">
          {filteredClasses.map((item) => {
            const fallbackImg = getPrivateClassFallbackImage(item.category);
            const cardImg = item.image?.trim() || fallbackImg;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedClass(item)}
                className="group w-[260px] sm:w-[300px] shrink-0 snap-start text-left rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#FF7F32] transition-all flex flex-col overflow-hidden shadow-xs cursor-pointer"
              >
                <div className="w-full h-40 sm:h-44 bg-[#002147] overflow-hidden shrink-0">
                  <img
                    src={cardImg}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImg;
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between w-full">
                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[#FF7F32] transition-colors">
                    {item.title}
                  </h3>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[var(--text-secondary)] truncate">
                      {item.instructorName}
                    </span>
                    <StarRatingWidget itemType="private_class" itemId={item.id} compact />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
