import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  UserPlus, 
  MapPin, 
  Calendar, 
  Clock, 
  Briefcase, 
  Filter, 
  Loader2, 
  AlertCircle, 
  Power, 
  Phone, 
  Mail, 
  Edit, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Stethoscope,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { NIGERIAN_STATES, NIGERIA_STATES_LGAS } from '../../data/nigerianData';
import { 
  searchLocums, 
  getLocumProfile, 
  updateLocum, 
  toggleLocumAvailability, 
  subscribeLocumProfile,
  subscribeLocums 
} from '../../services/locumService';
import { LocumProfile, LocumLocation } from '../../types';
import { LocumResultsSkeleton } from '../common/Skeletons';

interface LocumFinderViewProps {
  onBackToJobs?: () => void;
}

export const LocumFinderView: React.FC<LocumFinderViewProps> = ({ onBackToJobs }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'find' | 'status' | 'register'>('find');

  // Search State
  const [searchState, setSearchState] = useState('');
  const [searchLga, setSearchLga] = useState('');
  const [results, setResults] = useState<LocumProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [executedSearchState, setExecutedSearchState] = useState('');

  // User's own Locum Profile (Open to Work)
  const [myProfile, setMyProfile] = useState<LocumProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Edit / Register Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [specialties, setSpecialties] = useState<string[]>(['X-ray']);
  const [minCharge, setMinCharge] = useState<string>('25000');
  const [maxHours, setMaxHours] = useState<string>('8');
  const [availabilityMode, setAvailabilityMode] = useState<'Everyday' | 'Weekdays' | 'Weekends' | 'Custom'>('Everyday');
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]);
  const [locations, setLocations] = useState<LocumLocation[]>([]);
  const [tempState, setTempState] = useState('');
  const [tempLgas, setTempLgas] = useState<string[]>([]);

  const AVAILABLE_SPECIALTIES = [
    'X-ray',
    'Ultrasound',
    'Echocardiography',
    'MRI',
    'CT'
  ];

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // LGAs based on selected state in search
  const searchLgas = searchState ? NIGERIA_STATES_LGAS[searchState] || [] : [];
  // LGAs based on temp state in location editor
  const availableLgas = tempState ? NIGERIA_STATES_LGAS[tempState] || [] : [];

  // Listen to user's locum profile in Firestore
  useEffect(() => {
    const userEmail = currentUser?.email || localStorage.getItem('studiRad_locum_email') || '';
    if (!userEmail) {
      setLoadingProfile(false);
      return;
    }

    const unsub = subscribeLocumProfile(userEmail, (prof) => {
      setMyProfile(prof);
      if (prof) {
        setFullName(prof.fullName || currentUser?.fullName || '');
        setPhone(prof.phone || '');
        setGender(prof.gender || 'Male');
        setSpecialties(prof.specialties || ['X-ray']);
        setMinCharge(String(prof.minCharge || 25000));
        setMaxHours(String(prof.maxHours || 8));
        setLocations(prof.locations || []);

        const days = prof.availability || [];
        setSelectedDays(days);
        if (days.length === 7) setAvailabilityMode('Everyday');
        else if (days.length === 5 && days.every(d => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d))) setAvailabilityMode('Weekdays');
        else if (days.length === 2 && days.every(d => ['Saturday', 'Sunday'].includes(d))) setAvailabilityMode('Weekends');
        else setAvailabilityMode('Custom');
      }
      setLoadingProfile(false);
    });

    return () => unsub?.();
  }, [currentUser?.email, currentUser?.fullName]);

  // Real-time listener for active locums
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeLocums((locums) => {
      setResults(locums);
      setLoading(false);
    }, searchState, searchLga);

    return () => unsub();
  }, [searchState, searchLga]);

  const handleSearch = async (e?: React.FormEvent, initial = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setExecutedSearchState(searchState);

    try {
      const data = await searchLocums(searchState, searchLga);
      setResults(data);
    } catch (err) {
      console.warn('Locum search error:', err);
    } finally {
      setLoading(false);
      if (!initial) setHasSearched(true);
    }
  };

  const handleToggleAvailability = async () => {
    if (!myProfile || !myProfile.email) return;
    setToggling(true);
    const newState = !myProfile.isAvailable;
    const success = await toggleLocumAvailability(myProfile.email, newState);
    if (success) {
      setMyProfile({ ...myProfile, isAvailable: newState, isOpenToWork: newState });
    }
    setToggling(false);
  };

  const formatAvailability = (days?: string[]) => {
    if (!days || days.length === 0) return 'Contact for schedule';
    if (days.length === 7) return 'Everyday';
    if (days.length === 5 && days.includes('Monday') && days.includes('Friday')) return 'Weekdays';
    if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) return 'Weekends';
    return days.map(d => d.slice(0, 3)).join(', ');
  };

  const toggleSpecialty = (spec: string) => {
    setSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleAvailabilityModeChange = (mode: 'Everyday' | 'Weekdays' | 'Weekends' | 'Custom') => {
    setAvailabilityMode(mode);
    if (mode === 'Everyday') setSelectedDays(DAYS_OF_WEEK);
    else if (mode === 'Weekdays') setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    else if (mode === 'Weekends') setSelectedDays(['Saturday', 'Sunday']);
    else if (mode === 'Custom') setSelectedDays([]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addLocation = () => {
    if (!tempState || tempLgas.length === 0) return;
    setLocations([...locations, { state: tempState, lgas: tempLgas }]);
    setTempState('');
    setTempLgas([]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    const emailToUse = currentUser?.email || myProfile?.email;
    if (!emailToUse) {
      alert('Please enter your email address to register.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<LocumProfile> = {
        fullName: fullName || currentUser?.fullName || 'Radiographer',
        email: emailToUse,
        phone,
        gender,
        specialties,
        minCharge: Number(minCharge) || 25000,
        maxHours: Number(maxHours) || 8,
        availability: selectedDays,
        locations: locations.length > 0 ? locations : [{ state: 'Lagos', lgas: ['Ikeja'] }],
        isAvailable: myProfile ? myProfile.isAvailable : true,
        isOpenToWork: myProfile ? myProfile.isOpenToWork : true,
      };

      const success = await updateLocum(payload);
      if (success) {
        setMyProfile({ ...payload } as LocumProfile);
        setIsEditing(false);
        setActiveTab('status');
      } else {
        alert('Could not save locum profile. Please check your network connection.');
      }
    } catch (err) {
      console.error('Save locum error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Banner / Title Strip */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-[#002147] to-[#0A3266] text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#FF7F32] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Locum Network
            </span>
            {myProfile && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                myProfile.isAvailable 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${myProfile.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
                {myProfile.isAvailable ? 'Open to Work' : 'Offline'}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Locum Radiographers & Shifts
          </h2>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed">
            Connect with verified radiographers across Nigeria or publish your availability to receive direct locum calls from facilities.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="p-1 rounded-2xl bg-slate-200/80 dark:bg-[#161F30] flex items-center justify-between shadow-inner">
        <button
          onClick={() => {
            setActiveTab('find');
            setIsEditing(false);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'find' && !isEditing
              ? 'bg-[#002147] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find a Locum</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('status');
            setIsEditing(false);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'status' && !isEditing
              ? 'bg-[#002147] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Power className="w-3.5 h-3.5 text-[#FF7F32]" />
          <span>My Locum Status</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('register');
            setIsEditing(true);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'register' || isEditing
              ? 'bg-[#002147] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
          <span>{myProfile ? 'Edit Profile' : 'Register Free'}</span>
        </button>
      </div>

      {/* ================= VIEW 1: FIND A LOCUM ================= */}
      {activeTab === 'find' && !isEditing && (
        <div className="space-y-4">
          {/* Location Filters Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* State Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  State Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={searchState}
                    onChange={(e) => {
                      setSearchState(e.target.value);
                      setSearchLga('');
                    }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none cursor-pointer focus:ring-1 focus:ring-[#002147]"
                  >
                    <option value="">All States (Nigeria)</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LGA Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Local Govt Area (L.G.A)
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={searchLga}
                    onChange={(e) => setSearchLga(e.target.value)}
                    disabled={!searchState}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none cursor-pointer disabled:opacity-50 focus:ring-1 focus:ring-[#002147]"
                  >
                    <option value="">All LGAs</option>
                    {searchLgas.map((lga) => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching Active Locums...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#FF7F32]" />
                  <span>Find Available Radiographers</span>
                </>
              )}
            </button>
          </div>

          {/* Results List */}
          {loading ? (
            <LocumResultsSkeleton />
          ) : results.length === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                No active locums in this location
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchState
                  ? `There are currently no radiographers registered as available in ${searchState}. Try clearing the state filter or registering to offer your services!`
                  : 'Be the first radiographer to register your locum profile and get discovered by diagnostic centres!'}
              </p>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setIsEditing(true);
                }}
                className="px-5 py-2 rounded-xl bg-[#002147] text-white text-xs font-bold"
              >
                Register as a Locum
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  {results.length} active {results.length === 1 ? 'locum' : 'locums'} found
                </span>
                {executedSearchState && (
                  <span className="font-bold text-[#002147] dark:text-[#38BDF8]">
                    Scope: {executedSearchState}
                  </span>
                )}
              </div>

              {results.map((locum) => (
                <div
                  key={locum.id || locum.email}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 hover:border-[#002147] dark:hover:border-slate-600 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#002147] to-[#0A3266] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                        {locum.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                          {locum.fullName}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {locum.specialties && locum.specialties.length > 0 ? (
                            locum.specialties.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Radiographer</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Available
                    </span>
                  </div>

                  {/* Locum Details Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rate</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₦{locum.minCharge ? locum.minCharge.toLocaleString() : 'Negotiable'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Max Hours</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {locum.maxHours || 8} hrs/shift
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Days:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatAvailability(locum.availability)}
                      </span>
                    </div>

                    {locum.locations && locum.locations.length > 0 && (
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {locum.locations.map(l => l.state).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Facilities Action Row */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                    {locum.phone ? (
                      <a
                        href={`tel:${locum.phone}`}
                        className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call Radiographer</span>
                      </a>
                    ) : (
                      <div className="py-2.5 text-center text-xs text-slate-400">Call Unavailable</div>
                    )}

                    {locum.email ? (
                      <a
                        href={`mailto:${locum.email}`}
                        className="py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#FF7F32]" />
                        <span>Send Email</span>
                      </a>
                    ) : (
                      <div className="py-2.5 text-center text-xs text-slate-400">Email Unavailable</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: MY LOCUM STATUS & DASHBOARD ================= */}
      {activeTab === 'status' && !isEditing && (
        <div className="space-y-4">
          {myProfile ? (
            <div className="space-y-4">
              {/* Big Availability Power Toggle Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300 shadow-lg ${
                    myProfile.isAvailable
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shadow-emerald-500/20 ring-4 ring-emerald-50 dark:ring-emerald-900/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-slate-300/20'
                  }`}
                >
                  <Power className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {myProfile.isAvailable ? 'You are Available' : 'You are Offline'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {myProfile.isAvailable
                      ? 'Hospitals and diagnostic facilities in your coverage areas can discover your profile and contact you.'
                      : 'Turn on availability when you want to receive locum shift opportunities.'}
                  </p>
                </div>

                <button
                  onClick={handleToggleAvailability}
                  disabled={toggling}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                    myProfile.isAvailable
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  }`}
                >
                  {toggling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : myProfile.isAvailable ? (
                    <>
                      <Power className="w-4 h-4" />
                      <span>Go Offline (Pause Shifts)</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      <span>Go Online (Open to Work)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Profile Details Snapshot Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Locum Profile Details
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Name</span>
                    <span className="font-bold text-slate-800 dark:text-white">{myProfile.fullName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                    <span className="font-bold text-slate-800 dark:text-white">{myProfile.phone || 'Not provided'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Min Charge</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₦{myProfile.minCharge?.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Max Shift Hours</span>
                    <span className="font-bold text-slate-800 dark:text-white">{myProfile.maxHours} hrs</span>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Specialties
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {myProfile.specialties && myProfile.specialties.length > 0 ? (
                      myProfile.specialties.map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF7F32] font-bold text-xs">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None selected</span>
                    )}
                  </div>
                </div>

                {/* Coverage Areas */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Coverage Areas
                  </span>
                  <div className="space-y-1.5">
                    {myProfile.locations && myProfile.locations.length > 0 ? (
                      myProfile.locations.map((loc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] text-xs">
                          <span className="font-bold text-slate-800 dark:text-white block">{loc.state}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {loc.lgas?.join(', ') || 'All LGAs'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No locations specified</span>
                    )}
                  </div>
                </div>

                {/* Available Days */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Working Days:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {formatAvailability(myProfile.availability)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Prompt to Register as Locum
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF7F32] flex items-center justify-center mx-auto">
                <Stethoscope className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Join the Locum Network
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Boost your clinical income and practice flexibility. Register your locum profile and toggle availability when you want shift requests.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% Free for Radiographers (No commissions)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Facilities contact you directly via phone & email</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>You set your own minimum charge (₦) and LGAs</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('register');
                  setIsEditing(true);
                }}
                className="w-full py-3.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <UserPlus className="w-4 h-4 text-[#FF7F32]" />
                <span>Register as Locum (Free)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: EDIT / REGISTER PROFILE ================= */}
      {(activeTab === 'register' || isEditing) && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActiveTab(myProfile ? 'status' : 'find');
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {myProfile ? 'Edit Locum Profile' : 'Register as Locum Radiographer'}
              </h3>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#FF7F32] uppercase tracking-wider block">
              1. Personal Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe, AMRIT"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#002147]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number (for shift calls)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#002147]"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#FF7F32] uppercase tracking-wider block">
              2. Clinical Specialties
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SPECIALTIES.map((spec) => {
                const isSelected = specialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#002147] border-[#002147] text-white shadow-xs'
                        : 'bg-white dark:bg-[#161F30] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability Mode & Days */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#FF7F32] uppercase tracking-wider block">
              3. Working Days & Availability
            </span>

            <div className="flex flex-wrap gap-1.5">
              {(['Everyday', 'Weekdays', 'Weekends', 'Custom'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleAvailabilityModeChange(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    availabilityMode === mode
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {availabilityMode === 'Custom' && (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        isChecked
                          ? 'bg-[#FF7F32] text-white border-[#FF7F32]'
                          : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rates & Shift Hours */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#FF7F32] uppercase tracking-wider block">
              4. Rates & Hours
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Min Charge (₦)
                </label>
                <input
                  type="number"
                  value={minCharge}
                  onChange={(e) => setMinCharge(e.target.value)}
                  placeholder="25000"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#002147]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Hours/Shift
                </label>
                <input
                  type="number"
                  value={maxHours}
                  onChange={(e) => setMaxHours(e.target.value)}
                  placeholder="8"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#002147]"
                />
              </div>
            </div>
          </div>

          {/* Coverage Areas (States & LGAs) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-[#FF7F32] uppercase tracking-wider block">
              5. Coverage Locations (States & LGAs)
            </span>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={tempState}
                  onChange={(e) => {
                    setTempState(e.target.value);
                    setTempLgas([]);
                  }}
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !tempLgas.includes(e.target.value)) {
                      setTempLgas([...tempLgas, e.target.value]);
                    }
                  }}
                  disabled={!tempState}
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none disabled:opacity-50"
                >
                  <option value="">+ Add LGA</option>
                  {availableLgas.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {tempLgas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tempLgas.map((lga) => (
                    <span
                      key={lga}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>{lga}</span>
                      <button
                        type="button"
                        onClick={() => setTempLgas(tempLgas.filter((l) => l !== lga))}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addLocation}
                disabled={!tempState || tempLgas.length === 0}
                className="w-full py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Coverage Area</span>
              </button>
            </div>

            {/* List of Added Locations */}
            <div className="space-y-2">
              {locations.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No locations added yet.</p>
              ) : (
                locations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{loc.state}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {loc.lgas?.join(', ') || 'All LGAs'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLocation(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setActiveTab(myProfile ? 'status' : 'find');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#FF7F32]" />
              )}
              <span>{myProfile ? 'Update Profile' : 'Publish Locum Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
