import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Course, LiveClass, Opportunity, ClinicalResource, ClinicalModality } from '../../types';

import { 
  subscribeOpportunities, 
  subscribeClasses, 
  subscribeCourses, 
  subscribeMaterials 
} from '../../services/firebaseDataService';
import { 
  Search, 
  X, 
  BookOpen, 
  Video, 
  Briefcase, 
  FileText, 
  ChevronRight, 
  Filter, 
  Layers, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface SearchTabProps {
  onSelectCourse: (course: Course) => void;
  onOpenPlayer: (course: Course) => void;
  onSelectLiveClass: (liveClass: LiveClass) => void;
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

type SearchFilterCategory = 'all' | 'courses' | 'classes' | 'jobs' | 'resources';

const MODALITY_TAGS: { id: ClinicalModality; label: string }[] = [
  { id: 'xray', label: 'X-ray' },
  { id: 'ct', label: 'CT' },
  { id: 'mri', label: 'MRI' },
  { id: 'ultrasound', label: 'Ultrasound' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'hospital_practice', label: 'Hospital practice' },
  { id: 'rad_physics', label: 'Rad physics' },
];

const SUGGESTED_QUERIES = [
  'CT Head Stroke',
  'C-Spine Open Mouth',
  'Band 6 NHS Locum',
  'Radiation Protection DRL',
  'eFAST Protocol',
  '3T MRI Safety',
  'Travel Scholarship',
];

export const SearchTab: React.FC<SearchTabProps> = ({
  onSelectCourse,
  onOpenPlayer,
  onSelectLiveClass,
  onSelectOpportunity,
}) => {
  const [liveOpps, setLiveOpps] = useState<Opportunity[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [liveCourses, setLiveCourses] = useState<Course[]>([]);
  const [liveMaterials, setLiveMaterials] = useState<ClinicalResource[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchFilterCategory>('all');
  const [selectedModality, setSelectedModality] = useState<ClinicalModality | 'all'>('all');
  const [downloadedResources, setDownloadedResources] = useState<string[]>([]);

  useEffect(() => {
    const unsubOpps = subscribeOpportunities((opps) => {
      setLiveOpps(opps || []);
    });
    const unsubCls = subscribeClasses((cls) => {
      setLiveClasses(cls || []);
    });
    const unsubCourses = subscribeCourses((courses) => {
      setLiveCourses(courses || []);
    });
    const unsubMats = subscribeMaterials((mats) => {
      setLiveMaterials(mats || []);
    });
    return () => {
      unsubOpps?.();
      unsubCls?.();
      unsubCourses?.();
      unsubMats?.();
    };
  }, []);

  const handleDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadedResources((prev) => [...prev, id]);
  };

  const cleanQuery = query.trim().toLowerCase();

  // Search Results Filtering
  const matchingCourses = useMemo(() => {
    return liveCourses.filter((c) => {
      const matchModality = selectedModality === 'all' || c.modality === selectedModality;
      const matchText = !cleanQuery || 
        c.title.toLowerCase().includes(cleanQuery) || 
        c.overview.toLowerCase().includes(cleanQuery) ||
        c.instructor.toLowerCase().includes(cleanQuery) ||
        c.category.toLowerCase().includes(cleanQuery);
      return matchModality && matchText;
    });
  }, [liveCourses, cleanQuery, selectedModality]);

  const matchingClasses = useMemo(() => {
    return liveClasses.filter((c) => {
      const matchModality = selectedModality === 'all' || c.modality === selectedModality;
      const matchText = !cleanQuery || 
        c.title.toLowerCase().includes(cleanQuery) || 
        (c.description && c.description.toLowerCase().includes(cleanQuery)) ||
        (c.instructor && c.instructor.toLowerCase().includes(cleanQuery));
      return matchModality && matchText;
    });
  }, [liveClasses, cleanQuery, selectedModality]);

  const matchingOpportunities = useMemo(() => {
    return liveOpps.filter((opp) => {
      const matchModality = selectedModality === 'all' || opp.modality === selectedModality;
      const matchText = !cleanQuery || 
        opp.title.toLowerCase().includes(cleanQuery) || 
        opp.organisation.toLowerCase().includes(cleanQuery) ||
        opp.location.toLowerCase().includes(cleanQuery) ||
        opp.specialty.toLowerCase().includes(cleanQuery) ||
        opp.description.toLowerCase().includes(cleanQuery);
      return matchModality && matchText;
    });
  }, [liveOpps, cleanQuery, selectedModality]);

  const matchingResources = useMemo(() => {
    return liveMaterials.filter((res) => {
      const matchModality = selectedModality === 'all' || res.modality === selectedModality;
      const matchText = !cleanQuery || 
        res.title.toLowerCase().includes(cleanQuery) || 
        res.category.toLowerCase().includes(cleanQuery) ||
        res.description.toLowerCase().includes(cleanQuery);
      return matchModality && matchText;
    });
  }, [liveMaterials, cleanQuery, selectedModality]);

  const totalResults = matchingCourses.length + matchingClasses.length + matchingOpportunities.length + matchingResources.length;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 flex flex-col pb-28 select-none overflow-x-hidden">
      <div className="w-full max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        
        {/* Header */}
        <header className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-2xl font-extrabold text-[#002147] dark:text-white tracking-tight">
              Clinical Search
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Find courses, live classes, NHS jobs, and clinical guides
            </p>
          </div>
        </header>

        {/* Search Input Box */}
        <div className="w-full relative">
          <div className="w-full bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center px-4 py-3 focus-within:border-[#002147] dark:focus-within:border-[#38BDF8] transition-colors">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, modality, hospital trust, or sign..."
              className="w-full text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
              autoFocus={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modality Chips Bar */}
        <div className="space-y-1.5 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Filter by Clinical Modality
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedModality('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedModality === 'all'
                  ? 'bg-[#002147] text-white shadow-xs'
                  : 'bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              All Modalities
            </button>
            {MODALITY_TAGS.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModality(mod.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedModality === mod.id
                    ? 'bg-[#002147] text-white shadow-xs'
                    : 'bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All Results (${totalResults})` },
            { id: 'courses', label: `Courses (${matchingCourses.length})` },
            { id: 'classes', label: `Live Classes (${matchingClasses.length})` },
            { id: 'jobs', label: `Opportunities (${matchingOpportunities.length})` },
            { id: 'resources', label: `Materials (${matchingResources.length})` },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id as SearchFilterCategory)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === chip.id
                  ? 'bg-[#FF7F32] text-white shadow-xs'
                  : 'bg-white/80 dark:bg-[#121824]/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Suggested Queries if empty */}
        {!cleanQuery && (
          <div className="text-left space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF7F32]" />
              <span>Suggested Radiography Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((sq) => (
                <button
                  key={sq}
                  onClick={() => setQuery(sq)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#002147] dark:hover:border-[#38BDF8] transition-colors"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Sections */}
        <div className="space-y-5 pt-2 text-left">
          
          {/* Courses Section */}
          {(selectedCategory === 'all' || selectedCategory === 'courses') && matchingCourses.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#002147] dark:text-[#38BDF8]" />
                  Courses ({matchingCourses.length})
                </span>
              </div>
              <div className="space-y-2">
                {matchingCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCourse(c)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#002147] dark:hover:border-[#38BDF8] transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 relative">
                      <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-[#FF7F32]">
                          {c.modality?.toUpperCase() || c.category}
                        </span>
                        <span className="text-[10px] text-slate-400">· {c.cpdCredits}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {c.institution} · {c.instructor}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002147] dark:group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Classes Section */}
          {(selectedCategory === 'all' || selectedCategory === 'classes') && matchingClasses.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#FF7F32]" />
                Live Classes & Masterclasses ({matchingClasses.length})
              </span>
              <div className="space-y-2">
                {matchingClasses.map((lc) => (
                  <div
                    key={lc.id}
                    onClick={() => onSelectLiveClass(lc)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#002147] dark:hover:border-[#38BDF8] transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF7F32] flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#FF7F32] uppercase">
                          {lc.modality?.toUpperCase() || 'LIVE'}
                        </span>
                        <span className="text-[10px] text-slate-400">· {lc.date}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors">
                        {lc.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {lc.instructor || 'StudiRad Faculty'}{lc.instructorRole ? ` (${lc.instructorRole.split(',')[0]})` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002147] dark:group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities Section */}
          {(selectedCategory === 'all' || selectedCategory === 'jobs') && matchingOpportunities.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-[#38BDF8]" />
                Opportunities & Vacancies ({matchingOpportunities.length})
              </span>
              <div className="space-y-2">
                {matchingOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 hover:border-[#002147] dark:hover:border-[#38BDF8] transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#002147] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                          {opp.type}
                        </span>
                        {opp.urgent && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FF7F32]/15 text-[#FF7F32] text-xs font-bold">
                            Urgent
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#002147] dark:group-hover:text-[#38BDF8] transition-colors mt-0.5">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {opp.organisation} · {opp.rate}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#002147] dark:group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Resources Section */}
          {(selectedCategory === 'all' || selectedCategory === 'resources') && matchingResources.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Clinical Materials & Protocols ({matchingResources.length})
              </span>
              <div className="space-y-2">
                {matchingResources.map((res) => {
                  const isDownloaded = downloadedResources.includes(res.id);
                  return (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">
                            {res.format}
                          </span>
                          <span className="text-[10px] text-slate-400">· {res.size}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {res.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {res.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDownload(res.id, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          isDownloaded
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-[#002147] text-white hover:bg-[#002d62]'
                        }`}
                      >
                        {isDownloaded ? 'Downloaded' : 'Download'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalResults === 0 && (
            <div className="py-12 text-center space-y-3 bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No matching radiographic records found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Try searching for a different modality (e.g., 'CT', 'X-ray', 'MRI') or keywords like 'chest', 'locum', or 'pediatric'.
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedModality('all');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#002147] text-white text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
