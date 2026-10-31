import React, { useState, useMemo, useEffect } from 'react';
import { Opportunity, ClinicalModality } from '../../types';
import { subscribeOpportunities } from '../../services/firebaseDataService';
import { LocumFinderView } from '../locum/LocumFinderView';
import { NIGERIAN_STATES } from '../../data/nigerianData';
import { 
  Search, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Briefcase, 
  Bookmark, 
  Building2, 
  X, 
  GraduationCap, 
  Building, 
  Stethoscope, 
  Users, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ExploreTabProps {
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

// 4 distinct individual sections as requested by user
type OpportunitySection = 'jobs' | 'internships' | 'scholarships' | 'locum_finder';

// Helper to calculate deadline status matching JobsPage.tsx
const getDeadlineStatus = (deadline: string | null | undefined) => {
  if (!deadline) return { label: 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  if (isNaN(deadlineDate.getTime())) return { label: 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
  if (deadlineDate < today) return { label: 'Expired', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' };
  return { label: 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
};

export const ExploreTab: React.FC<ExploreTabProps> = ({
  onSelectOpportunity,
}) => {
  // Current active individual section
  const [activeSection, setActiveSection] = useState<OpportunitySection>('jobs');

  // Real opportunities from Firestore
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [savedOppIds, setSavedOppIds] = useState<(number | string)[]>([]);

  useEffect(() => {
    const unsub = subscribeOpportunities((liveOpps) => {
      setOpportunities(liveOpps || []);
    });
    return () => {
      unsub?.();
    };
  }, []);

  const toggleSave = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedOppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Distinct filtered lists for each individual section
  const jobsList = useMemo(() => {
    return opportunities.filter((opp) => {
      const type = (opp.type || '').toLowerCase();
      const oppType = (opp.opportunityType || '').toLowerCase();
      const isJob = oppType === 'job' || type.includes('job') || type.includes('permanent') || type.includes('locum') || type.includes('full-time') || type.includes('part-time');
      const isInternOrScholar = oppType === 'internship' || oppType === 'scholarship' || type.includes('intern') || type.includes('scholar');
      return isJob && !isInternOrScholar;
    });
  }, [opportunities]);

  const internshipsList = useMemo(() => {
    return opportunities.filter((opp) => {
      const type = (opp.type || '').toLowerCase();
      const oppType = (opp.opportunityType || '').toLowerCase();
      return oppType === 'internship' || type.includes('intern') || type.includes('fellowship') || type.includes('attachment');
    });
  }, [opportunities]);

  const scholarshipsList = useMemo(() => {
    return opportunities.filter((opp) => {
      const type = (opp.type || '').toLowerCase();
      const oppType = (opp.opportunityType || '').toLowerCase();
      return oppType === 'scholarship' || type.includes('scholar') || type.includes('grant') || type.includes('bursary');
    });
  }, [opportunities]);

  // Apply search and state filter to current active section list
  const currentFilteredList = useMemo(() => {
    let baseList = jobsList;
    if (activeSection === 'internships') baseList = internshipsList;
    if (activeSection === 'scholarships') baseList = scholarshipsList;

    return baseList.filter((opp) => {
      // Nigerian state filter
      const matchesState = !filterState || opp.location.toLowerCase().includes(filterState.toLowerCase());
      // Text search
      const cleanSearch = searchQuery.trim().toLowerCase();
      const matchesSearch = !cleanSearch ||
        opp.title.toLowerCase().includes(cleanSearch) ||
        opp.organisation.toLowerCase().includes(cleanSearch) ||
        opp.location.toLowerCase().includes(cleanSearch) ||
        opp.specialty.toLowerCase().includes(cleanSearch) ||
        opp.description.toLowerCase().includes(cleanSearch);

      return matchesState && matchesSearch;
    });
  }, [activeSection, jobsList, internshipsList, scholarshipsList, filterState, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col pb-28 select-none text-left">
      <div className="w-full max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002147] dark:text-white tracking-tight">
            Opportunities
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dedicated portals for jobs, internships, scholarships, and locum radiographers
          </p>
        </header>

        {/* ================= 4 DISTINCT INDIVIDUAL SECTIONS ================= */}
        {/* Jobs | Internships | Scholarships | Locum Finder */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-[#161F30] shadow-inner">
          <button
            onClick={() => {
              setActiveSection('jobs');
              setSearchQuery('');
              setFilterState('');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'jobs'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#FF7F32]" />
            <span>Jobs</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('internships');
              setSearchQuery('');
              setFilterState('');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'internships'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-cyan-500" />
            <span>Internships</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('scholarships');
              setSearchQuery('');
              setFilterState('');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'scholarships'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-500" />
            <span>Scholarships</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('locum_finder');
              setSearchQuery('');
              setFilterState('');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'locum_finder'
                ? 'bg-[#002147] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Locum Finder</span>
          </button>
        </div>

        {/* ================= SECTION 1: JOBS ================= */}
        {activeSection === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Job Openings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified radiography vacancies from hospitals and diagnostic centers
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentFilteredList.length} {currentFilteredList.length === 1 ? 'Job' : 'Jobs'}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="w-full bg-white dark:bg-[#121824] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, hospital, or specialty..."
                className="w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Nigerian State Location Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="">All States / Locations</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              {filterState && (
                <button
                  onClick={() => setFilterState('')}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Jobs List */}
            {currentFilteredList.length === 0 ? (
              <div className="py-14 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <Briefcase className="w-7 h-7 text-[#002147] dark:text-[#38BDF8]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No job openings found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {filterState
                    ? `No jobs found in ${filterState}. Try clearing the location filter.`
                    : 'Check back soon as diagnostic centers and NHS trusts post new openings.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentFilteredList.map((job) => {
                  const isSaved = savedOppIds.includes(job.id);
                  const status = getDeadlineStatus(job.deadline);

                  return (
                    <div
                      key={job.id}
                      onClick={() => onSelectOpportunity(job)}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-[#002147] dark:hover:border-slate-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                            {job.type}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${status.color}`}>
                            {status.label}
                          </span>
                          {job.urgent && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FF7F32]/15 text-[#FF7F32] text-xs font-bold">
                              Urgent
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => toggleSave(job.id, e)}
                          aria-label={isSaved ? 'Unbookmark' : 'Bookmark'}
                          className="p-1 text-slate-400 hover:text-[#FF7F32] transition-colors"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#FF7F32] text-[#FF7F32]' : ''}`} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.organisation}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{job.location}</span>
                        </div>
                        <span className="font-bold text-[#002147] dark:text-[#38BDF8]">
                          {job.rate}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#FF7F32]" />
                          <span>{job.deadline}</span>
                        </span>
                        <span className="font-bold text-[#002147] dark:text-[#38BDF8] flex items-center gap-0.5">
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 2: INTERNSHIPS ================= */}
        {activeSection === 'internships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Clinical Internships
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Graduate radiographer internships, hospital attachments, and clinical rotations
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300">
                {currentFilteredList.length} {currentFilteredList.length === 1 ? 'Internship' : 'Internships'}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="w-full bg-white dark:bg-[#121824] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search internships by teaching hospital or department..."
                className="w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Internships List */}
            {currentFilteredList.length === 0 ? (
              <div className="py-14 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center mx-auto">
                  <Building className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No internship openings posted right now
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  New accredited internship placements and rotation positions will appear here directly from healthcare institutions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentFilteredList.map((intern) => {
                  const isSaved = savedOppIds.includes(intern.id);
                  const status = getDeadlineStatus(intern.deadline);

                  return (
                    <div
                      key={intern.id}
                      onClick={() => onSelectOpportunity(intern)}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-cyan-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 text-xs font-semibold">
                            Clinical Internship
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        <button
                          onClick={(e) => toggleSave(intern.id, e)}
                          className="p-1 text-slate-400 hover:text-cyan-600 transition-colors"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-cyan-600 text-cyan-600' : ''}`} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-cyan-600 transition-colors">
                          {intern.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{intern.organisation}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{intern.location}</span>
                        </div>
                        <span className="font-bold text-cyan-700 dark:text-cyan-400">
                          {intern.rate}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Deadline: {intern.deadline}</span>
                        </span>
                        <span className="font-bold text-cyan-600 flex items-center gap-0.5">
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 3: SCHOLARSHIPS ================= */}
        {activeSection === 'scholarships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Scholarships & Grants
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Radiography scholarships, academic travel grants, and postgraduate funding
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                {currentFilteredList.length} {currentFilteredList.length === 1 ? 'Grant' : 'Grants'}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="w-full bg-white dark:bg-[#121824] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scholarships by academic body or focus area..."
                className="w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scholarships List */}
            {currentFilteredList.length === 0 ? (
              <div className="py-14 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No scholarships listed at the moment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  New scholarship opportunities, academic fellowships, and research bursaries will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentFilteredList.map((scholar) => {
                  const isSaved = savedOppIds.includes(scholar.id);
                  const status = getDeadlineStatus(scholar.deadline);

                  return (
                    <div
                      key={scholar.id}
                      onClick={() => onSelectOpportunity(scholar)}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-amber-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                            Scholarship
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        <button
                          onClick={(e) => toggleSave(scholar.id, e)}
                          className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 transition-colors">
                          {scholar.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{scholar.organisation}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{scholar.location}</span>
                        </div>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {scholar.rate}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Closing: {scholar.deadline}</span>
                        </span>
                        <span className="font-bold text-amber-600 flex items-center gap-0.5">
                          <span>View Eligibility</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 4: LOCUM FINDER (OPEN TO WORK) ================= */}
        {activeSection === 'locum_finder' && (
          <LocumFinderView onBackToJobs={() => setActiveSection('jobs')} />
        )}

      </div>
    </div>
  );
};
