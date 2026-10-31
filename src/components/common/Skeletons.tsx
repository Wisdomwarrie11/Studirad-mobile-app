import React from 'react';

/**
 * Base low-level Skeleton block with dark/light mode responsive pulse
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/90 dark:bg-slate-800/80 rounded-xl ${className}`}
    />
  );
};

/**
 * Skeleton for the main Dashboard / HomeTab
 * Mirrors the exact layout: Greeting, Hero Banner, Quick Action Grid,
 * In-progress Card, Top Courses Carousel, Upcoming Live Classes, Clinical Opportunities
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col pb-28 select-none overflow-x-hidden animate-fadeIn">
      <div className="w-full max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        
        {/* 1. Header Greeting & Subtitle */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* 2. Hero Banner: Transform your radiography journey */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="h-44 sm:h-52 w-full bg-slate-200 dark:bg-[#121824] p-5 flex flex-col justify-end space-y-2">
            <Skeleton className="h-3 w-24 rounded-md bg-slate-300 dark:bg-slate-700/60" />
            <Skeleton className="h-7 w-3/4 max-w-sm rounded-lg bg-slate-300 dark:bg-slate-700/80" />
          </div>
        </div>

        {/* 3. Continue Learning / Registered Class In-Progress Card */}
        <div className="w-full rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-4 w-48 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
        </div>

        {/* 4. Top Courses Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col"
              >
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-3 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-7 w-20 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Upcoming Live Classes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
            <Skeleton className="h-4 w-14 rounded-md" />
          </div>

          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
              >
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-[220px] rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Clinical Opportunities Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>

          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * Skeleton for the ProfileTab
 * Mirrors the exact profile layout: Top Header, User Identity Card, Verified CPD Credits,
 * Enrolled Courses, Completed Classes History, 1-on-1 Sessions, Interests, Locum Status
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col pb-32 select-none animate-fadeIn text-left">
      <div className="w-full max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        
        {/* Top Header */}
        <div className="space-y-1">
          <Skeleton className="h-7 w-36 rounded-md" />
          <Skeleton className="h-3 w-52 rounded-md" />
        </div>

        {/* 1. User Identity Card */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>

        {/* 2. Verified CPD Credits Card */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-5 w-36 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
        </div>

        {/* 3. Enrolled Courses Card */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* 4. Completed Classes History */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-md" />
            <Skeleton className="h-4 w-44 rounded-md" />
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-52 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Scheduled 1-on-1 Sessions */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3 w-56 rounded-md" />
          </div>
        </div>

        {/* 6. Learning Interests */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-3 w-10 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>

        {/* 7. Locum & Opportunity Network Status */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-36 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>

        {/* 8. Settings & Preferences */}
        <div className="w-full bg-white dark:bg-[#121824] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * Skeleton for Administrator Portal verification & loading
 * Replaces generic loading spinners on admin dashboard check
 */
export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-slate-100 flex flex-col p-4 sm:p-6 select-none animate-fadeIn">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 rounded-lg bg-slate-800" />
            <Skeleton className="h-4 w-44 rounded-md bg-slate-800/60" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-xl bg-slate-800" />
            <Skeleton className="h-9 w-32 rounded-xl bg-slate-800" />
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[#121824] border border-slate-800 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20 rounded-md bg-slate-800" />
                <Skeleton className="w-7 h-7 rounded-lg bg-slate-800" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md bg-slate-800" />
              <Skeleton className="h-3 w-28 rounded-md bg-slate-800/60" />
            </div>
          ))}
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-hidden border-b border-slate-800 pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-xl bg-slate-800" />
          ))}
        </div>

        {/* Content Table Skeleton */}
        <div className="bg-[#121824] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-64 rounded-xl bg-slate-800" />
            <Skeleton className="h-10 w-32 rounded-xl bg-slate-800" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 w-full rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg bg-slate-800" />
                  <Skeleton className="h-4 w-48 rounded-md bg-slate-800" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20 rounded-md bg-slate-800" />
                  <Skeleton className="h-7 w-16 rounded-lg bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * Skeleton for Locum Finder results
 * Replaces generic spinner when searching locums
 */
export const LocumResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-fadeIn">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
