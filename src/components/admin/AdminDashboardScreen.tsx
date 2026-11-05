import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Course, 
  LiveClass, 
  Opportunity, 
  ClinicalResource, 
  ClinicalModality,
  CourseMaterialLink,
  CourseQuizQuestion,
  CourseModule,
  Lesson 
} from '../../types';
import { getYouTubeEmbedUrl, extractYouTubeId, getYouTubeThumbnail, getVideoEmbedUrl, isPlayableVideoUrl } from '../../utils/youtube';
import { 
  subscribeCourses, 
  subscribeClasses, 
  subscribeOpportunities, 
  subscribeMaterials,
  pushCourseToFirestore,
  deleteCourseFromFirestore,
  pushClassToFirestore,
  deleteClassFromFirestore,
  pushOpportunityToFirestore,
  deleteOpportunityFromFirestore,
  pushMaterialToFirestore,
  pushVideoToFirestore,
  deleteMaterialFromFirestore,
  pushOfficialClassesToFirestore
} from '../../services/firebaseDataService';
import { uploadFileToFirebaseStorage } from '../../firebase';
import { Wordmark } from '../brand/Wordmark';
import { 
  BookOpen, 
  Video, 
  Briefcase, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  LogOut, 
  Search, 
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  Calendar,
  Building2,
  MapPin,
  Tag,
  Upload,
  Loader2,
  Paperclip,
  Check,
  HelpCircle,
  Link as LinkIcon,
  Play,
  Tv,
  ListPlus,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info
} from 'lucide-react';
import classesImg from '../../assets/images/onboarding_classes_1792606674536.jpg';
import radiographyImg from '../../assets/images/onboarding_radiography_1792606674447.jpg';
import careersImg from '../../assets/images/onboarding_careers_1792606674049.jpg';

type AdminTab = 'courses' | 'classes' | 'opportunities' | 'materials';

const COURSE_CATEGORIES = [
  'Anatomy',
  'Physiology',
  'Rad Tech',
  'Rad Equipment',
  'Pathology',
  'MRI',
  'CT',
  'Ultrasound',
  'Projects',
  'Professional Exams PQ',
  'Others'
];

const ROLES_OPTIONS = ['Radiographer', 'Sonographer', 'Lecturer', 'Others'];
const REQUIREMENTS_OPTIONS = [
  'Application letter', 
  'CV', 
  'Birth certificate', 
  'All Basic, Secondary and University credentials', 
  'State of Origin', 
  'Others'
];

export const AdminDashboardScreen: React.FC = () => {
  const { setScreen, signOut, adminSignOut, currentUser } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Real-time collections
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [materials, setMaterials] = useState<ClinicalResource[]>([]);

  // Subscriptions to live projects (studirad-platform-new and studirad-admin-portal)
  useEffect(() => {
    setIsSyncing(true);
    const unsubCourses = subscribeCourses((list) => {
      setCourses(list);
      setIsSyncing(false);
    });
    const unsubClasses = subscribeClasses((list) => {
      setClasses(list);
    });
    const unsubOpps = subscribeOpportunities((list) => {
      setOpportunities(list);
    });
    const unsubMats = subscribeMaterials((list) => {
      setMaterials(list);
    });

    return () => {
      unsubCourses();
      unsubClasses();
      unsubOpps();
      unsubMats();
    };
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4500);
  };

  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Deletion confirm state
  const [itemToDelete, setItemToDelete] = useState<{ type: AdminTab; id: string | number; title: string; sourceColl?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ----------------------------------------------------
  // Form states: Course (Comprehensive Builder)
  // ----------------------------------------------------
  type CourseModalTab = 'basics' | 'curriculum' | 'materials' | 'quiz';
  const [courseModalTab, setCourseModalTab] = useState<CourseModalTab>('basics');

  const [courseForm, setCourseForm] = useState<{
    id: string;
    title: string;
    instructor: string;
    instructorRole: string;
    institution: string;
    modality: ClinicalModality;
    duration: string;
    cpdCredits: string;
    price: string;
    isFree: boolean;
    videoUrl: string;
    overview: string;
    modules: CourseModule[];
    materials: CourseMaterialLink[];
    links: CourseMaterialLink[];
    quiz: CourseQuizQuestion[];
  }>({
    id: '',
    title: '',
    instructor: currentUser?.fullName || 'Dr. Marcus Thorne',
    instructorRole: 'Lead Clinical Specialist',
    institution: 'StudiRad Clinical Academy',
    modality: 'xray' as ClinicalModality,
    duration: '3 Weeks · 2 hrs/week',
    cpdCredits: '2.0 CPD Points',
    price: 'Free with Membership',
    isFree: true,
    videoUrl: '',
    overview: '',
    modules: [],
    materials: [],
    links: [],
    quiz: [],
  });

  // Builder draft states
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [activeSectionIdForLesson, setActiveSectionIdForLesson] = useState<string | null>(null);
  const [newLessonDraft, setNewLessonDraft] = useState({
    title: '',
    duration: '20 min',
    videoUrl: '',
    summary: '',
  });

  const [newMaterialDraft, setNewMaterialDraft] = useState<{
    title: string;
    url: string;
    type: 'pdf' | 'doc' | 'link' | 'video';
  }>({
    title: '',
    url: '',
    type: 'pdf',
  });

  const [newLinkDraft, setNewLinkDraft] = useState({
    title: '',
    url: '',
  });

  const [newQuizDraft, setNewQuizDraft] = useState<{
    question: string;
    options: [string, string, string, string];
    correctAnswerIndex: number;
    explanation: string;
  }>({
    question: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
  });

  // ----------------------------------------------------
  // Form states: Class
  // ----------------------------------------------------
  const [classForm, setClassForm] = useState({
    id: '',
    title: '',
    instructor: currentUser?.fullName || 'Dr. David Chen',
    instructorRole: 'Consultant Clinical Educator',
    modality: 'xray' as ClinicalModality,
    date: 'Thursday, Nov 12',
    time: '18:00 BST',
    duration: '50 minutes',
    meetingLink: 'https://meet.studirad.org/room/masterclass',
    cpdCredits: '1.5 CPD Hours',
    description: '',
  });

  // ----------------------------------------------------
  // Form states: Opportunity (Matched with AdminPostOpportunity web app)
  // ----------------------------------------------------
  const [oppForm, setOppForm] = useState({
    id: '' as string | number,
    selectedRole: ROLES_OPTIONS[0],
    customRole: '',
    organisation: 'Guy’s & St Thomas’ NHS Foundation Trust',
    location: 'London, UK',
    type: 'job' as 'job' | 'internship' | 'scholarship' | string,
    rate: '£38.50 - £45.00 / hour',
    specialty: 'Diagnostic CT / Plain Film',
    modality: 'xray' as ClinicalModality,
    deadline: '2026-11-30',
    experienceLevel: 'Band 6 / 2+ Years Clinical',
    urgent: true,
    description: '',
    link: 'https://hospital.com/careers',
    contactInfo: 'hr@hospital.com',
    requirements: ['Application letter', 'CV'] as string[],
    selectedReq: REQUIREMENTS_OPTIONS[0],
    customReq: '',
  });

  // ----------------------------------------------------
  // Form states: Material (Matched with AdminMaterialsPage web app)
  // ----------------------------------------------------
  const [materialForm, setMaterialForm] = useState({
    id: '',
    submissionType: 'file' as 'file' | 'link' | 'video',
    course: 'Anatomy',
    title: '',
    uploader: currentUser?.fullName || 'Wisdom Warrie',
    link: '',
    description: '',
    selectedFile: null as File | null,
    isUploading: false,
  });

  const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` 
      : null;
  };

  // ----------------------------------------------------
  // Handlers: Save Course
  // ----------------------------------------------------
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim() || !courseForm.instructor.trim()) return;

    const courseId = courseForm.id || `course_${Date.now()}`;

    // Ensure modules are formatted properly
    const finalModules: CourseModule[] = courseForm.modules && courseForm.modules.length > 0
      ? courseForm.modules
      : [
          {
            id: `mod_${courseId}_1`,
            title: 'Section 1: Clinical Masterclass & Core Foundations',
            lessons: [
              {
                id: `les_${courseId}_1`,
                title: courseForm.title,
                duration: courseForm.duration || '25 min',
                completed: false,
                type: 'video',
                videoUrl: courseForm.videoUrl.trim(),
                summary: courseForm.overview,
              }
            ]
          }
        ];

    const newCourse: Partial<Course> = {
      id: courseId,
      title: courseForm.title.trim(),
      instructor: courseForm.instructor.trim(),
      instructorRole: courseForm.instructorRole.trim(),
      institution: courseForm.institution.trim() || 'StudiRad Clinical Academy',
      modality: courseForm.modality,
      duration: courseForm.duration,
      cpdCredits: courseForm.cpdCredits,
      price: courseForm.isFree ? 'Free with Membership' : (courseForm.price || '£49.99'),
      isFree: courseForm.isFree,
      videoUrl: courseForm.videoUrl.trim(),
      overview: courseForm.overview.trim() || 'Comprehensive clinical masterclass with high-yield case studies.',
      image: courseForm.modality === 'ct' ? classesImg : courseForm.modality === 'ultrasound' ? careersImg : radiographyImg,
      modules: finalModules,
      materials: courseForm.materials || [],
      links: courseForm.links || [],
      quiz: courseForm.quiz || [],
    };

    const res = await pushCourseToFirestore(newCourse);
    if (res.success) {
      setIsCourseModalOpen(false);
      triggerSuccess(`Course "${newCourse.title}" successfully synced to live web app & mobile with in-app video!`);
    }
  };

  // ----------------------------------------------------
  // Handlers: Save Class
  // ----------------------------------------------------
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.title.trim() || !classForm.instructor.trim()) return;

    const classId = classForm.id || `live_${Date.now()}`;
    const mappedCategory = classForm.modality === 'ct' ? 'CT' : classForm.modality === 'mri' ? 'MRI' : classForm.modality === 'ultrasound' ? 'Ultrasound' : 'X-ray';
    const newClass: Partial<LiveClass> = {
      id: classId,
      title: classForm.title.trim(),
      instructor: classForm.instructor.trim(),
      instructorRole: classForm.instructorRole.trim(),
      category: mappedCategory,
      modality: classForm.modality,
      date: classForm.date,
      time: classForm.time,
      duration: classForm.duration,
      meetingLink: classForm.meetingLink || 'https://meet.studirad.org/room/masterclass',
      registerLink: classForm.meetingLink || 'https://meet.studirad.org/room/masterclass',
      cpdCredits: classForm.cpdCredits,
      description: classForm.description.trim() || 'Live interactive cohort session with real clinical case clearing.',
      isLiveNow: false,
      isRegistered: false,
      status: 'published',
      cohortStatus: 'upcoming',
      price: 'Free',
      image: classForm.modality === 'ct' ? classesImg : classForm.modality === 'ultrasound' ? careersImg : radiographyImg,
      thumbnail: classForm.modality === 'ct' ? classesImg : classForm.modality === 'ultrasound' ? careersImg : radiographyImg,
    };

    const res = await pushClassToFirestore(newClass);
    if (res.success) {
      setIsClassModalOpen(false);
      triggerSuccess(`Live cohort class "${newClass.title}" scheduled and live!`);
    }
  };

  // ----------------------------------------------------
  // Handlers: Save Opportunity (Synchronizes with web app AdminPostOpportunity)
  // ----------------------------------------------------
  const handleSaveOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleTitle = oppForm.selectedRole === 'Others' ? oppForm.customRole.trim() : oppForm.selectedRole;
    if (!roleTitle || !oppForm.organisation.trim()) return;

    const oppId = oppForm.id || `opp_${Date.now()}`;
    const newOpp: Partial<Opportunity> = {
      id: oppId,
      title: roleTitle,
      organisation: oppForm.organisation.trim(),
      location: oppForm.location.trim(),
      type: oppForm.type,
      rate: oppForm.rate.trim(),
      specialty: oppForm.specialty.trim() || roleTitle,
      modality: oppForm.modality,
      deadline: oppForm.deadline,
      experienceLevel: oppForm.experienceLevel,
      urgent: oppForm.urgent,
      description: oppForm.description.trim() || 'Exciting radiography opportunity within an NHS teaching hospital.',
      howToApply: oppForm.link || oppForm.contactInfo || 'Apply directly through the StudiRad portal.',
      link: oppForm.link,
      contactInfo: oppForm.contactInfo,
      requirements: oppForm.requirements,
      opportunityType: oppForm.type as any,
    };

    const res = await pushOpportunityToFirestore(newOpp);
    if (res.success) {
      setIsOppModalOpen(false);
      triggerSuccess(`Opportunity "${roleTitle}" synchronized to web app & mobile!`);
    }
  };

  const addRequirement = () => {
    let reqToAdd = oppForm.selectedReq;
    if (oppForm.selectedReq === 'Others') {
      if (!oppForm.customReq.trim()) return;
      reqToAdd = oppForm.customReq.trim();
    }
    if (!oppForm.requirements.includes(reqToAdd)) {
      setOppForm((prev) => ({
        ...prev,
        requirements: [...prev.requirements, reqToAdd],
        customReq: '',
        selectedReq: REQUIREMENTS_OPTIONS[0],
      }));
    }
  };

  const removeRequirement = (index: number) => {
    setOppForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  // ----------------------------------------------------
  // Handlers: Save Material or Video (Synchronizes with AdminMaterialsPage)
  // ----------------------------------------------------
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.course || !materialForm.uploader) return;

    setMaterialForm((prev) => ({ ...prev, isUploading: true }));

    try {
      if (materialForm.submissionType === 'video') {
        if (!materialForm.title || !materialForm.link) {
          setMaterialForm((prev) => ({ ...prev, isUploading: false }));
          return;
        }

        const thumb = getYoutubeThumbnail(materialForm.link);
        const res = await pushVideoToFirestore({
          course: materialForm.course,
          title: materialForm.title.trim(),
          uploader: materialForm.uploader.trim(),
          link: materialForm.link.trim(),
          thumbnailUrl: thumb || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
        });

        if (res.success) {
          setIsMaterialModalOpen(false);
          triggerSuccess(`Video "${materialForm.title}" published live!`);
        }
      } else {
        // File or Link
        let resourceUrl = materialForm.link;

        if (materialForm.submissionType === 'file' && materialForm.selectedFile) {
          // Upload directly to Firebase Storage
          resourceUrl = await uploadFileToFirebaseStorage(materialForm.selectedFile, 'materials');
        }

        if (!resourceUrl) {
          resourceUrl = 'https://studirad.org/materials/protocol.pdf';
        }

        const matTitle = materialForm.title.trim() || materialForm.selectedFile?.name || `${materialForm.course} Protocol`;
        const res = await pushMaterialToFirestore({
          id: materialForm.id || `mat_${Date.now()}`,
          title: matTitle,
          category: materialForm.course,
          format: materialForm.submissionType === 'file' ? 'PDF' : 'Guideline',
          size: materialForm.selectedFile ? `${(materialForm.selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
          downloadUrl: resourceUrl,
          course: materialForm.course,
          uploader: materialForm.uploader,
          description: materialForm.description.trim() || `Clinical protocol for ${materialForm.course}`,
        });

        if (res.success) {
          setIsMaterialModalOpen(false);
          triggerSuccess(`Clinical material "${matTitle}" published and synced!`);
        }
      }
    } catch (err) {
      console.error('Error saving material:', err);
    } finally {
      setMaterialForm((prev) => ({ ...prev, isUploading: false }));
    }
  };

  // ----------------------------------------------------
  // Confirm Delete
  // ----------------------------------------------------
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    if (itemToDelete.type === 'courses') {
      const courseId = String(itemToDelete.id);
      setCourses((prev) => prev.filter((c) => String(c.id) !== courseId));
      await deleteCourseFromFirestore(courseId);
      triggerSuccess('Course deleted from live database.');
    } else if (itemToDelete.type === 'classes') {
      const classId = String(itemToDelete.id);
      setClasses((prev) => prev.filter((cls) => String(cls.id) !== classId));
      await deleteClassFromFirestore(classId);
      triggerSuccess('Class removed from live database.');
    } else if (itemToDelete.type === 'opportunities') {
      setOpportunities((prev) => prev.filter((o) => o.id !== itemToDelete.id));
      await deleteOpportunityFromFirestore(itemToDelete.id, itemToDelete.sourceColl);
      triggerSuccess('Opportunity removed from live database.');
    } else if (itemToDelete.type === 'materials') {
      const matId = String(itemToDelete.id);
      setMaterials((prev) => prev.filter((m) => String(m.id) !== matId));
      await deleteMaterialFromFirestore(matId);
      triggerSuccess('Material removed from live database.');
    }

    setIsDeleting(false);
    setItemToDelete(null);
  };

  // ----------------------------------------------------
  // Filtered lists
  // ----------------------------------------------------
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    return courses.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.modality?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    return classes.filter((cls) =>
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.instructor && cls.instructor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cls.modality?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classes, searchQuery]);

  const filteredOpportunities = useMemo(() => {
    if (!searchQuery.trim()) return opportunities;
    return opportunities.filter((opp) =>
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organisation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [opportunities, searchQuery]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    return materials.filter((m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.format.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-[#FF7F32] selection:text-white">
      {/* Top Navbar */}
      <header className="w-full bg-[#121824] border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark size="sm" theme="dark" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Firebase Sync Active: studirad-platform-new</span>
            <span className="sm:hidden">Live Sync</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch to learner view */}
          <button
            onClick={() => setScreen('app')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            title="Preview app as a learner"
          >
            <Eye className="w-4 h-4 text-[#FF7F32]" />
            <span className="hidden sm:inline">Learner App</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              adminSignOut();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-xs font-semibold text-red-300 transition-colors cursor-pointer"
            title="Sign out of Admin Portal"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between animate-fadeIn sticky top-14 z-20 shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div 
            onClick={() => setActiveTab('courses')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'courses' 
                ? 'bg-slate-800/90 border-[#FF7F32] shadow-lg shadow-[#FF7F32]/10' 
                : 'bg-[#121824] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Courses & Masterclasses</span>
              <BookOpen className="w-4 h-4 text-[#FF7F32]" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{courses.length}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Live in Learn & Home</span>
          </div>

          <div 
            onClick={() => setActiveTab('classes')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'classes' 
                ? 'bg-slate-800/90 border-[#FF7F32] shadow-lg shadow-[#FF7F32]/10' 
                : 'bg-[#121824] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Live Cohort Classes</span>
              <Video className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{classes.length}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Scheduled on calendar</span>
          </div>

          <div 
            onClick={() => setActiveTab('opportunities')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'opportunities' 
                ? 'bg-slate-800/90 border-[#FF7F32] shadow-lg shadow-[#FF7F32]/10' 
                : 'bg-[#121824] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Opportunities (Jobs & Locums)</span>
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{opportunities.length}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Synced with admin-portal</span>
          </div>

          <div 
            onClick={() => setActiveTab('materials')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'materials' 
                ? 'bg-slate-800/90 border-[#FF7F32] shadow-lg shadow-[#FF7F32]/10' 
                : 'bg-[#121824] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Clinical Materials & Videos</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{materials.length}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Protocols, PDFs & Videos</span>
          </div>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#121824] border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'courses' ? 'bg-[#FF7F32] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'classes' ? 'bg-[#FF7F32] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Classes
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'opportunities' ? 'bg-[#FF7F32] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Opportunities
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'materials' ? 'bg-[#FF7F32] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Materials & Videos
            </button>
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-3 h-9 rounded-xl bg-[#121824] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
              />
            </div>

            {activeTab === 'courses' && (
              <button
                onClick={() => {
                  setCourseForm({
                    id: '',
                    title: '',
                    instructor: currentUser?.fullName || 'Dr. Marcus Thorne',
                    instructorRole: 'Lead Clinical Specialist',
                    institution: 'StudiRad Clinical Academy',
                    modality: 'xray',
                    duration: '4 Weeks · 2 hrs/week',
                    cpdCredits: '2.5 CPD Points',
                    price: 'Free with Membership',
                    isFree: true,
                    videoUrl: '',
                    overview: '',
                    modules: [],
                    materials: [],
                    links: [],
                    quiz: [],
                  });
                  setCourseModalTab('basics');
                  setIsCourseModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 h-10 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FF7F32]/25 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Push Course</span>
              </button>
            )}

            {activeTab === 'classes' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    const res = await pushOfficialClassesToFirestore();
                    setIsSyncing(false);
                    if (res.success) {
                      triggerSuccess(`Successfully synchronized ${res.count} official classes (Artifacts in Ultrasound, Chest Critique, Foundation Ultrasound) to StudiRad Cloud!`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border border-slate-700"
                  title="Push official completed and future cohorts to StudiRad Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#FF7F32] ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Push Official Classes</span>
                </button>

                <button
                  onClick={() => {
                    setClassForm({
                      id: '',
                      title: '',
                      instructor: currentUser?.fullName || 'Dr. David Chen',
                      instructorRole: 'Consultant Clinical Educator',
                      modality: 'xray',
                      date: 'Thursday, Nov 12',
                      time: '18:00 BST',
                      duration: '50 minutes',
                      meetingLink: 'https://meet.studirad.org/room/masterclass',
                      cpdCredits: '1.5 CPD Hours',
                      description: '',
                    });
                    setIsClassModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white text-xs font-bold shadow-md shadow-[#FF7F32]/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Class</span>
                </button>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <button
                onClick={() => {
                  setOppForm({
                    id: '',
                    selectedRole: ROLES_OPTIONS[0],
                    customRole: '',
                    organisation: 'Lagoon Hospital',
                    location: 'London, UK',
                    type: 'job',
                    rate: '£40.00 / hour',
                    specialty: 'CT & Plain Film',
                    modality: 'xray',
                    deadline: '2026-11-30',
                    experienceLevel: 'Band 6 / 2+ Years Clinical',
                    urgent: true,
                    description: '',
                    link: 'https://hospital.com/careers',
                    contactInfo: 'hr@hospital.com',
                    requirements: ['Application letter', 'CV'],
                    selectedReq: REQUIREMENTS_OPTIONS[0],
                    customReq: '',
                  });
                  setIsOppModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white text-xs font-bold shadow-md shadow-[#FF7F32]/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Post Opportunity</span>
              </button>
            )}

            {activeTab === 'materials' && (
              <button
                onClick={() => {
                  setMaterialForm({
                    id: '',
                    submissionType: 'file',
                    course: 'Anatomy',
                    title: '',
                    uploader: currentUser?.fullName || 'Wisdom Warrie',
                    link: '',
                    description: '',
                    selectedFile: null,
                    isUploading: false,
                  });
                  setIsMaterialModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white text-xs font-bold shadow-md shadow-[#FF7F32]/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Content</span>
              </button>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: COURSES LIST */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'courses' && (
          <div className="space-y-3">
            {filteredCourses.length === 0 ? (
              <div className="p-8 text-center bg-[#121824] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No courses found. Click "+ Push Course" to create your first course.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((c) => {
                  const courseThumb = (c.videoUrl ? getYouTubeThumbnail(c.videoUrl) : null) || c.image || classesImg;
                  return (
                    <div key={c.id} className="p-4 rounded-2xl bg-[#121824] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                      <div>
                        {/* 16:9 Thumbnail Preview with Video Badge */}
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 mb-3 group">
                          <img 
                            src={courseThumb} 
                            alt={c.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = classesImg; }}
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                              {c.modality || 'General'}
                            </span>
                          </div>
                          {c.videoUrl && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>YouTube Video</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-emerald-400">
                              {c.price || 'Free'}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5">
                          {c.title}
                        </h3>
                      <p className="text-xs text-slate-400 mb-2 font-medium">
                        Instructor: <span className="text-slate-200">{c.instructor}</span>
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {c.overview}
                      </p>

                      {/* Course Curriculum & Accompanying Items Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          c.videoUrl 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Tv className="w-3 h-3" />
                          <span>{c.videoUrl ? 'In-App Video' : 'No Video'}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#FF7F32]" />
                          <span>{c.modules?.length || 1} {c.modules?.length === 1 ? 'Section' : 'Sections'}</span>
                        </span>

                        {(c.materials?.length || 0) + (c.links?.length || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-900/40 text-[10px] font-semibold flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{(c.materials?.length || 0) + (c.links?.length || 0)} Materials</span>
                          </span>
                        )}

                        {(c.quiz?.length || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-900/40 text-[10px] font-semibold flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            <span>{c.quiz?.length} Quiz MCQs</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{c.cpdCredits}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCourseForm({
                              id: c.id,
                              title: c.title,
                              instructor: c.instructor,
                              instructorRole: c.instructorRole || '',
                              institution: c.institution || '',
                              modality: c.modality || 'xray',
                              duration: c.duration || '',
                              cpdCredits: c.cpdCredits || '',
                              price: c.price || 'Free with Membership',
                              isFree: !!c.isFree,
                              videoUrl: c.videoUrl || '',
                              overview: c.overview || '',
                              modules: c.modules || [],
                              materials: c.materials || [],
                              links: c.links || [],
                              quiz: c.quiz || [],
                            });
                            setCourseModalTab('basics');
                            setIsCourseModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Manage & Edit Course, Modules, Materials & Quiz"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'courses', id: c.id, title: c.title })}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: LIVE CLASSES LIST */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'classes' && (
          <div className="space-y-3">
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center bg-[#121824] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No cohort classes scheduled. Click "+ Schedule Class" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <div key={cls.id} className="p-4 rounded-2xl bg-[#121824] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          {cls.modality || 'General'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Clock className="w-3 h-3 text-[#FF7F32]" />
                          <span>{cls.duration}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5">
                        {cls.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-1.5">
                        {cls.instructor} · <span className="text-slate-500">{cls.instructorRole}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF7F32] font-semibold mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{cls.date} at {cls.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {cls.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{cls.cpdCredits}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setClassForm({
                              id: cls.id,
                              title: cls.title,
                              instructor: cls.instructor || '',
                              instructorRole: cls.instructorRole || '',
                              modality: (cls.modality as ClinicalModality) || 'xray',
                              date: cls.date || '',
                              time: cls.time || '',
                              duration: cls.duration || 'Session',
                              meetingLink: cls.meetingLink || '',
                              cpdCredits: cls.cpdCredits || '1.0 CPD Hour',
                              description: cls.description || '',
                            });
                            setIsClassModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Edit class"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'classes', id: cls.id, title: cls.title })}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: OPPORTUNITIES LIST (Live Synced with AdminPostOpportunity) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'opportunities' && (
          <div className="space-y-3">
            {filteredOpportunities.length === 0 ? (
              <div className="p-8 text-center bg-[#121824] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No opportunities in database yet. Click "+ Post Opportunity" to publish to web app and mobile.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOpportunities.map((opp) => (
                  <div key={opp.id} className="p-4 rounded-2xl bg-[#121824] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                          {opp.type}
                        </span>
                        {opp.urgent && (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold">
                            Urgent
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5">
                        {opp.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{opp.organisation}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{opp.location}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-[#FF7F32] font-mono font-bold mb-3">
                        {opp.rate}
                      </div>

                      {opp.requirements && opp.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {opp.requirements.slice(0, 3).map((req, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                              {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Deadline: {opp.deadline}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setOppForm({
                              id: opp.id,
                              selectedRole: ROLES_OPTIONS.includes(opp.title) ? opp.title : 'Others',
                              customRole: ROLES_OPTIONS.includes(opp.title) ? '' : opp.title,
                              organisation: opp.organisation,
                              location: opp.location,
                              type: opp.opportunityType || opp.type || 'job',
                              rate: opp.rate,
                              specialty: opp.specialty,
                              modality: opp.modality || 'xray',
                              deadline: opp.deadline,
                              experienceLevel: opp.experienceLevel,
                              urgent: opp.urgent,
                              description: opp.description,
                              link: opp.link || '',
                              contactInfo: opp.contactInfo || '',
                              requirements: opp.requirements || [],
                              selectedReq: REQUIREMENTS_OPTIONS[0],
                              customReq: '',
                            });
                            setIsOppModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Edit opportunity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'opportunities', id: opp.id, title: opp.title, sourceColl: opp.sourceCollection })}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="Delete opportunity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: MATERIALS LIST (Live Synced with AdminMaterialsPage) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center bg-[#121824] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No materials or videos in database yet. Click "+ Publish Content" to post.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl bg-[#121824] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          {m.format}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {m.size}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-1">
                        Course: <span className="text-slate-200 font-semibold">{m.category}</span>
                      </p>
                      {m.uploader && (
                        <p className="text-xs text-slate-500 mb-2">
                          Uploader: {m.uploader}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {m.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      {m.downloadUrl ? (
                        <a
                          href={m.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#FF7F32] hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Link</span>
                        </a>
                      ) : (
                        <span className="capitalize">{m.modality || 'General'}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setItemToDelete({ type: 'materials', id: m.id, title: m.title })}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="Delete material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: COMPREHENSIVE COURSE BUILDER MODAL */}
      {/* ---------------------------------------------------- */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#121824] border border-slate-800 rounded-3xl shadow-2xl text-left my-auto animate-scaleIn max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#121824]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF7F32]/10 flex items-center justify-center text-[#FF7F32] shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {courseForm.id ? 'Edit Clinical Course' : 'Create & Push Clinical Course'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Embed in-app YouTube video lectures, modules, handouts, and quiz
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Builder Sub-Navigation Tabs */}
            <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setCourseModalTab('basics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  courseModalTab === 'basics'
                    ? 'bg-[#FF7F32] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>1. Basics & Info</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseModalTab('curriculum')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  courseModalTab === 'curriculum'
                    ? 'bg-[#FF7F32] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>2. Video & Modules ({courseForm.modules.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseModalTab('materials')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  courseModalTab === 'materials'
                    ? 'bg-[#FF7F32] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Materials & Links ({courseForm.materials.length + courseForm.links.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseModalTab('quiz')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  courseModalTab === 'quiz'
                    ? 'bg-[#FF7F32] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>4. Course Quiz ({courseForm.quiz.length})</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="course-builder-form" onSubmit={handleSaveCourse} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs no-scrollbar">
              
              {/* TAB 1: BASICS & INFO */}
              {courseModalTab === 'basics' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="e.g. Chest Radiography Mastery: Silhouette Signs & Pathology"
                      className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Modality *</label>
                      <select
                        value={courseForm.modality}
                        onChange={(e) => setCourseForm({ ...courseForm, modality: e.target.value as ClinicalModality })}
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      >
                        <option value="xray">X-ray / Image Critique</option>
                        <option value="ct">Computed Tomography (CT)</option>
                        <option value="mri">Magnetic Resonance (MRI)</option>
                        <option value="ultrasound">Ultrasound & Sonography</option>
                        <option value="anatomy">Anatomy & Physiology</option>
                        <option value="hospital_practice">Clinical Hospital Governance</option>
                        <option value="rad_physics">Radiation Physics & Protection</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Duration & Schedule</label>
                      <input
                        type="text"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        placeholder="e.g. 4 Weeks · 2 hrs/week"
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Instructor Name *</label>
                      <input
                        type="text"
                        required
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                        placeholder="e.g. Dr. Marcus Thorne"
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">CPD Credits</label>
                      <input
                        type="text"
                        value={courseForm.cpdCredits}
                        onChange={(e) => setCourseForm({ ...courseForm, cpdCredits: e.target.value })}
                        placeholder="e.g. 3.0 CPD Points"
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Price Label</label>
                      <input
                        type="text"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        placeholder="Free with Membership"
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFreeCourse"
                        checked={courseForm.isFree}
                        onChange={(e) => setCourseForm({ ...courseForm, isFree: e.target.checked })}
                        className="w-4 h-4 rounded text-[#FF7F32] bg-slate-900 border-slate-700 focus:ring-0"
                      />
                      <label htmlFor="isFreeCourse" className="font-semibold text-slate-300 cursor-pointer">
                        Free for Members
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Overview & Key Learning Outcomes</label>
                    <textarea
                      rows={3}
                      value={courseForm.overview}
                      onChange={(e) => setCourseForm({ ...courseForm, overview: e.target.value })}
                      placeholder="Comprehensive overview of topics, anatomy, and clinical patterns covered..."
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CURRICULUM, YOUTUBE VIDEO & MODULES */}
              {courseModalTab === 'curriculum' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Primary Course YouTube Video Link */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-white flex items-center gap-1.5">
                        <Tv className="w-4 h-4 text-[#FF7F32]" />
                        <span>Primary Course Video (YouTube or Google Drive URL)</span>
                      </label>
                      {courseForm.videoUrl && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isPlayableVideoUrl(courseForm.videoUrl)
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {isPlayableVideoUrl(courseForm.videoUrl) ? 'Valid Video Link' : 'Invalid Link'}
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={courseForm.videoUrl}
                      onChange={(e) => setCourseForm({ ...courseForm, videoUrl: e.target.value })}
                      placeholder="Paste YouTube or Google Drive link: https://youtube.com/... or https://drive.google.com/file/d/..."
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                    />

                    {courseForm.videoUrl && isPlayableVideoUrl(courseForm.videoUrl) && (
                      <div className="pt-1">
                        <span className="text-[11px] text-slate-400 block mb-1">In-App Live Preview:</span>
                        <div className="w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                          <iframe
                            className="w-full h-full border-0"
                            src={getVideoEmbedUrl(courseForm.videoUrl) || ''}
                            title="Video Preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modules & Sections Builder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">Course Sections / Modules</h4>
                        <p className="text-[11px] text-slate-400">
                          Organize lessons into sequential clinical sections
                        </p>
                      </div>
                    </div>

                    {/* Add Section Form */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        placeholder="e.g. Module 1: Physics & Equipment Formation"
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSectionTitle.trim()) return;
                          const newMod: CourseModule = {
                            id: `mod_${Date.now()}`,
                            title: newSectionTitle.trim(),
                            lessons: [],
                          };
                          setCourseForm({
                            ...courseForm,
                            modules: [...courseForm.modules, newMod],
                          });
                          setNewSectionTitle('');
                        }}
                        className="px-3.5 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    {/* Existing Modules List */}
                    <div className="space-y-3 pt-1">
                      {courseForm.modules.map((module, mIdx) => (
                        <div
                          key={module.id || mIdx}
                          className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-[#FF7F32]" />
                              <span>{module.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({module.lessons.length} lessons)
                              </span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveSectionIdForLesson(
                                  activeSectionIdForLesson === module.id ? null : module.id
                                )}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Lesson</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setCourseForm({
                                    ...courseForm,
                                    modules: courseForm.modules.filter((m) => m.id !== module.id),
                                  });
                                }}
                                className="p-1 rounded-lg hover:bg-red-950/40 text-red-400 cursor-pointer"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons inside Module */}
                          {module.lessons.length > 0 && (
                            <div className="space-y-1.5 pl-2">
                              {module.lessons.map((les, lIdx) => (
                                <div
                                  key={les.id || lIdx}
                                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-[11px]"
                                >
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <Play className="w-3 h-3 text-[#FF7F32] shrink-0" />
                                    <span className="font-semibold text-slate-200 truncate">{les.title}</span>
                                    <span className="text-slate-500 shrink-0">({les.duration})</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedModules = courseForm.modules.map((m) => {
                                        if (m.id !== module.id) return m;
                                        return {
                                          ...m,
                                          lessons: m.lessons.filter((l) => l.id !== les.id),
                                        };
                                      });
                                      setCourseForm({ ...courseForm, modules: updatedModules });
                                    }}
                                    className="p-1 hover:text-red-400 text-slate-500 cursor-pointer"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* New Lesson Form for this Section */}
                          {activeSectionIdForLesson === module.id && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                              <span className="font-bold text-[11px] text-[#FF7F32] block">
                                Add New Lesson to {module.title}
                              </span>

                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={newLessonDraft.title}
                                  onChange={(e) => setNewLessonDraft({ ...newLessonDraft, title: e.target.value })}
                                  placeholder="Lesson Title *"
                                  className="col-span-2 h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                                />
                                <input
                                  type="text"
                                  value={newLessonDraft.duration}
                                  onChange={(e) => setNewLessonDraft({ ...newLessonDraft, duration: e.target.value })}
                                  placeholder="e.g. 25 min"
                                  className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                                />
                              </div>

                              <input
                                type="text"
                                value={newLessonDraft.videoUrl}
                                onChange={(e) => setNewLessonDraft({ ...newLessonDraft, videoUrl: e.target.value })}
                                placeholder="Specific YouTube or Google Drive video URL (optional, uses course video if empty)"
                                className="w-full h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                              />

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveSectionIdForLesson(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newLessonDraft.title.trim()) return;
                                    const createdLesson: Lesson = {
                                      id: `les_${Date.now()}`,
                                      title: newLessonDraft.title.trim(),
                                      duration: newLessonDraft.duration || '20 min',
                                      videoUrl: newLessonDraft.videoUrl.trim() || courseForm.videoUrl,
                                      completed: false,
                                      type: 'video',
                                      summary: newLessonDraft.summary,
                                    };

                                    const updatedModules = courseForm.modules.map((m) => {
                                      if (m.id !== module.id) return m;
                                      return {
                                        ...m,
                                        lessons: [...m.lessons, createdLesson],
                                      };
                                    });

                                    setCourseForm({ ...courseForm, modules: updatedModules });
                                    setNewLessonDraft({ title: '', duration: '20 min', videoUrl: '', summary: '' });
                                    setActiveSectionIdForLesson(null);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-[#FF7F32] text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Save Lesson
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACCOMPANYING MATERIALS & REFERENCE LINKS */}
              {courseModalTab === 'materials' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Add Study Material Form */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Add Accompanying Study Material / Handout</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Upload or link PDF cheat sheets, clinical protocols, and guides
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newMaterialDraft.title}
                        onChange={(e) => setNewMaterialDraft({ ...newMaterialDraft, title: e.target.value })}
                        placeholder="Material Title (e.g. Artifacts Reference Guide)"
                        className="sm:col-span-2 h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                      <select
                        value={newMaterialDraft.type}
                        onChange={(e) => setNewMaterialDraft({ ...newMaterialDraft, type: e.target.value as any })}
                        className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="doc">Word / Doc</option>
                        <option value="video">Lecture Clip</option>
                        <option value="link">Resource Link</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMaterialDraft.url}
                        onChange={(e) => setNewMaterialDraft({ ...newMaterialDraft, url: e.target.value })}
                        placeholder="Document URL (e.g. Google Drive link, PDF URL)"
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newMaterialDraft.title.trim() || !newMaterialDraft.url.trim()) return;
                          const matItem: CourseMaterialLink = {
                            id: `mat_${Date.now()}`,
                            title: newMaterialDraft.title.trim(),
                            url: newMaterialDraft.url.trim(),
                            type: newMaterialDraft.type,
                          };
                          setCourseForm({
                            ...courseForm,
                            materials: [...courseForm.materials, matItem],
                          });
                          setNewMaterialDraft({ title: '', url: '', type: 'pdf' });
                        }}
                        className="px-3.5 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Material</span>
                      </button>
                    </div>

                    {/* Materials List */}
                    {courseForm.materials.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Added Materials ({courseForm.materials.length})
                        </span>
                        {courseForm.materials.map((mat) => (
                          <div
                            key={mat.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="font-semibold text-white truncate">{mat.title}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{mat.type}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCourseForm({
                                  ...courseForm,
                                  materials: courseForm.materials.filter((m) => m.id !== mat.id),
                                });
                              }}
                              className="p-1 hover:text-red-400 text-slate-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add External Reference Links Form */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-emerald-400" />
                        <span>Add Accompanying Clinical Reference Links</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Link external guidelines (NICE, Radiopaedia, WHO, etc.)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newLinkDraft.title}
                        onChange={(e) => setNewLinkDraft({ ...newLinkDraft, title: e.target.value })}
                        placeholder="Link Label (e.g. Royal College Guidelines)"
                        className="w-1/2 h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                      <input
                        type="text"
                        value={newLinkDraft.url}
                        onChange={(e) => setNewLinkDraft({ ...newLinkDraft, url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newLinkDraft.title.trim() || !newLinkDraft.url.trim()) return;
                          const linkItem: CourseMaterialLink = {
                            id: `link_${Date.now()}`,
                            title: newLinkDraft.title.trim(),
                            url: newLinkDraft.url.trim(),
                            type: 'link',
                          };
                          setCourseForm({
                            ...courseForm,
                            links: [...courseForm.links, linkItem],
                          });
                          setNewLinkDraft({ title: '', url: '' });
                        }}
                        className="px-3.5 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    {/* Links List */}
                    {courseForm.links.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Added Reference Links ({courseForm.links.length})
                        </span>
                        {courseForm.links.map((link) => (
                          <div
                            key={link.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <LinkIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-white truncate">{link.title}</span>
                              <span className="text-[10px] text-slate-500 truncate">{link.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCourseForm({
                                  ...courseForm,
                                  links: courseForm.links.filter((l) => l.id !== link.id),
                                });
                              }}
                              className="p-1 hover:text-red-400 text-slate-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: COURSE QUIZ BUILDER */}
              {courseModalTab === 'quiz' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>Add Clinical Quiz Question (MCQ)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Create knowledge check questions to test learners on this course
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Question Prompt *
                      </label>
                      <textarea
                        rows={2}
                        value={newQuizDraft.question}
                        onChange={(e) => setNewQuizDraft({ ...newQuizDraft, question: e.target.value })}
                        placeholder="e.g. Which of the following artifact types is caused by total acoustic reflection at a soft tissue-gas interface?"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        4 Multiple Choice Options (Select radio for correct answer) *
                      </label>
                      {newQuizDraft.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={newQuizDraft.correctAnswerIndex === optIdx}
                            onChange={() => setNewQuizDraft({ ...newQuizDraft, correctAnswerIndex: optIdx })}
                            className="w-4 h-4 text-[#FF7F32] bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-slate-400 w-4">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updatedOpts = [...newQuizDraft.options] as [string, string, string, string];
                              updatedOpts[optIdx] = e.target.value;
                              setNewQuizDraft({ ...newQuizDraft, options: updatedOpts });
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Clinical Rationale / Explanation
                      </label>
                      <input
                        type="text"
                        value={newQuizDraft.explanation}
                        onChange={(e) => setNewQuizDraft({ ...newQuizDraft, explanation: e.target.value })}
                        placeholder="e.g. Reverberation occurs when acoustic impedance mismatch between soft tissue and gas creates multiple echoes..."
                        className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newQuizDraft.question.trim() || newQuizDraft.options.some((o) => !o.trim())) return;
                          const questionItem: CourseQuizQuestion = {
                            id: `quiz_q_${Date.now()}`,
                            question: newQuizDraft.question.trim(),
                            options: newQuizDraft.options.map((o) => o.trim()),
                            correctAnswerIndex: newQuizDraft.correctAnswerIndex,
                            explanation: newQuizDraft.explanation.trim(),
                          };
                          setCourseForm({
                            ...courseForm,
                            quiz: [...courseForm.quiz, questionItem],
                          });
                          setNewQuizDraft({
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswerIndex: 0,
                            explanation: '',
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Quiz Questions */}
                  {courseForm.quiz.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Added Quiz Questions ({courseForm.quiz.length})
                      </span>
                      {courseForm.quiz.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white">
                              {idx + 1}. {q.question}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCourseForm({
                                  ...courseForm,
                                  quiz: courseForm.quiz.filter((_, i) => i !== idx),
                                });
                              }}
                              className="p-1 hover:text-red-400 text-slate-500 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-emerald-400 font-semibold">
                            Correct: {String.fromCharCode(65 + q.correctAnswerIndex)}) {q.options[q.correctAnswerIndex]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </form>

            {/* Bottom Docked Action Bar */}
            <div className="px-6 py-4 border-t border-slate-800 bg-[#121824] flex items-center justify-between gap-3 shrink-0 shadow-lg">
              <button
                type="button"
                onClick={() => setIsCourseModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5">
                {courseModalTab !== 'quiz' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (courseModalTab === 'basics') setCourseModalTab('curriculum');
                      else if (courseModalTab === 'curriculum') setCourseModalTab('materials');
                      else if (courseModalTab === 'materials') setCourseModalTab('quiz');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Next Section</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  form="course-builder-form"
                  className="px-6 py-2.5 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#FF7F32]/25 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{courseForm.id ? 'Save & Push Changes' : 'Push Live to Learners'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: LIVE CLASS SCHEDULE MODAL */}
      {/* ---------------------------------------------------- */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121824] border border-slate-800 rounded-3xl p-6 shadow-2xl text-left my-8 animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {classForm.id ? 'Edit Live Class' : 'Schedule New Live Cohort Class'}
                </h3>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  placeholder="e.g. Acute Stroke CT Neuroimaging & ASPECTS Protocol"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Modality *</label>
                  <select
                    value={classForm.modality}
                    onChange={(e) => setClassForm({ ...classForm, modality: e.target.value as ClinicalModality })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  >
                    <option value="xray">X-ray / Image Interpretation</option>
                    <option value="ct">Computed Tomography (CT)</option>
                    <option value="mri">Magnetic Resonance (MRI)</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="anatomy">Anatomy</option>
                    <option value="hospital_practice">Hospital & Patient Care</option>
                    <option value="rad_physics">Radiation Physics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Instructor Name *</label>
                  <input
                    type="text"
                    required
                    value={classForm.instructor}
                    onChange={(e) => setClassForm({ ...classForm, instructor: e.target.value })}
                    placeholder="Dr. David Chen"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="text"
                    required
                    value={classForm.date}
                    onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                    placeholder="e.g. Thursday, Nov 12"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Time & Timezone *</label>
                  <input
                    type="text"
                    required
                    value={classForm.time}
                    onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                    placeholder="18:30 BST"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={classForm.duration}
                    onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                    placeholder="50 minutes"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CPD Credits</label>
                  <input
                    type="text"
                    value={classForm.cpdCredits}
                    onChange={(e) => setClassForm({ ...classForm, cpdCredits: e.target.value })}
                    placeholder="1.5 CPD Hours"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Meeting Link / Room URL *</label>
                <input
                  type="text"
                  required
                  value={classForm.meetingLink}
                  onChange={(e) => setClassForm({ ...classForm, meetingLink: e.target.value })}
                  placeholder="https://meet.studirad.org/room/..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Description</label>
                <textarea
                  rows={3}
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="Detailed breakdown of topics covered, interactive quiz format, etc."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{classForm.id ? 'Save & Push Changes' : 'Schedule & Push Live'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: OPPORTUNITY POST MODAL (Synced with AdminPostOpportunity web app) */}
      {/* ---------------------------------------------------- */}
      {isOppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121824] border border-slate-800 rounded-3xl p-6 shadow-2xl text-left my-8 animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {oppForm.id ? 'Edit Opportunity' : 'Post Clinical Opportunity'}
                </h3>
              </div>
              <button
                onClick={() => setIsOppModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOpp} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                {(['job', 'internship', 'scholarship'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOppForm({ ...oppForm, type })}
                    className={`flex-1 py-1.5 rounded-lg font-bold capitalize transition-all ${
                      oppForm.type === type ? 'bg-[#FF7F32] text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}s
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role / Title *</label>
                <div className="flex gap-2">
                  <select
                    value={oppForm.selectedRole}
                    onChange={(e) => setOppForm({ ...oppForm, selectedRole: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  >
                    {ROLES_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {oppForm.selectedRole === 'Others' && (
                    <input
                      type="text"
                      required
                      value={oppForm.customRole}
                      onChange={(e) => setOppForm({ ...oppForm, customRole: e.target.value })}
                      placeholder="Specify role..."
                      className="flex-1 h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hospital / Organisation *</label>
                  <input
                    type="text"
                    required
                    value={oppForm.organisation}
                    onChange={(e) => setOppForm({ ...oppForm, organisation: e.target.value })}
                    placeholder="e.g. Lagoon Hospital"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={oppForm.location}
                    onChange={(e) => setOppForm({ ...oppForm, location: e.target.value })}
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={oppForm.deadline}
                    onChange={(e) => setOppForm({ ...oppForm, deadline: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Salary / Pay Rate</label>
                  <input
                    type="text"
                    value={oppForm.rate}
                    onChange={(e) => setOppForm({ ...oppForm, rate: e.target.value })}
                    placeholder="e.g. £38.50 - £44.00 / hour"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              {/* Requirements selection from web app */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Requirements</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={oppForm.selectedReq}
                    onChange={(e) => setOppForm({ ...oppForm, selectedReq: e.target.value })}
                    className="flex-1 h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    {REQUIREMENTS_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {oppForm.selectedReq === 'Others' && (
                    <input
                      type="text"
                      value={oppForm.customReq}
                      onChange={(e) => setOppForm({ ...oppForm, customReq: e.target.value })}
                      placeholder="Custom requirement..."
                      className="flex-1 h-9 px-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  )}
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-3 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {oppForm.requirements.map((req, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                      <span>{req}</span>
                      <X className="w-3 h-3 text-slate-500 hover:text-red-400 cursor-pointer" onClick={() => removeRequirement(i)} />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Application Link / Email</label>
                <input
                  type="text"
                  value={oppForm.link}
                  onChange={(e) => setOppForm({ ...oppForm, link: e.target.value })}
                  placeholder="https://hospital.com/careers or hr@hospital.com"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={oppForm.description}
                  onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                  placeholder="Details about the opportunity, shifts, clinical protocols..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{oppForm.id ? 'Save & Sync Changes' : 'Post to Live Web App & Mobile'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOppModalOpen(false)}
                  className="px-4 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: MATERIAL UPLOAD MODAL (Synced with AdminMaterialsPage & Storage) */}
      {/* ---------------------------------------------------- */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121824] border border-slate-800 rounded-3xl p-6 shadow-2xl text-left my-8 animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Publish Content to Web App & Mobile
                </h3>
              </div>
              <button
                onClick={() => setIsMaterialModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3.5 text-xs">
              {/* Type Switcher: file | link | video */}
              <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                {(['file', 'link', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMaterialForm({ ...materialForm, submissionType: type })}
                    className={`flex-1 py-1.5 rounded-lg font-bold capitalize transition-all ${
                      materialForm.submissionType === type ? 'bg-[#FF7F32] text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Course Category *</label>
                  <select
                    value={materialForm.course}
                    onChange={(e) => setMaterialForm({ ...materialForm, course: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  >
                    {COURSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Author / Uploader *</label>
                  <input
                    type="text"
                    required
                    value={materialForm.uploader}
                    onChange={(e) => setMaterialForm({ ...materialForm, uploader: e.target.value })}
                    placeholder="e.g. Wisdom Warrie"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Title {materialForm.submissionType === 'file' ? '(Optional if uploading file)' : '*'}
                </label>
                <input
                  type="text"
                  required={materialForm.submissionType !== 'file'}
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="e.g. Upper Limb Positioning Protocol"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              {/* File upload from device to Firebase Storage */}
              {materialForm.submissionType === 'file' ? (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select File (PDF, DOCX, PPT)</label>
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-[#FF7F32] bg-slate-900/60 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-300">
                      {materialForm.selectedFile ? materialForm.selectedFile.name : 'Click to choose file from device'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {materialForm.selectedFile 
                        ? `${(materialForm.selectedFile.size / (1024 * 1024)).toFixed(2)} MB` 
                        : 'PDF, DOCX, PPT, Images (Up to 50MB)'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMaterialForm({
                            ...materialForm,
                            selectedFile: e.target.files[0],
                            title: materialForm.title || e.target.files[0].name.replace(/\.[^/.]+$/, "")
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {materialForm.submissionType === 'video' ? 'YouTube / Video URL *' : 'Document Link / Download URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    value={materialForm.link}
                    onChange={(e) => setMaterialForm({ ...materialForm, link: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                  />
                  {materialForm.submissionType === 'video' && materialForm.link && getYoutubeThumbnail(materialForm.link) && (
                    <div className="mt-2 flex items-center gap-2 p-1.5 bg-slate-900 rounded-lg border border-slate-700">
                      <img src={getYoutubeThumbnail(materialForm.link)!} alt="Thumbnail preview" className="h-10 rounded" />
                      <span className="text-[11px] text-emerald-400 font-bold">YouTube video detected</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  placeholder="Outline clinical utility or instructions..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7F32]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={materialForm.isUploading}
                  className="flex-1 h-11 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {materialForm.isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Firebase Storage...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Publish to Web App & Mobile</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  disabled={materialForm.isUploading}
                  className="px-4 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#121824] border border-red-900/60 rounded-3xl p-5 shadow-2xl text-left animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-red-950/60 text-red-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              Delete from Database?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Are you sure you want to remove <span className="text-white font-semibold">"{itemToDelete.title}"</span>? This will immediately remove it from both the live web app and mobile app.
            </p>

            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
