import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { 
  Course, 
  ClinicalModality, 
  CourseModule, 
  CourseMaterialLink, 
  CourseQuizQuestion,
  TutorialRequest,
  PrivateClass,
  PrivateClassCategory,
  PrivateClassBookingRequest
} from '../../types';
import { 
  pushCourseToFirestore, 
  subscribeCourses, 
  subscribeTutorialRequests,
  subscribePrivateClasses,
  pushPrivateClassToFirestore,
  subscribePrivateClassBookings
} from '../../services/firebaseDataService';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { formatAmountInCurrency, formatMoney, formatPriceString } from '../../utils/currency';
import { formatTime12h } from '../../utils/timeFormat';
import { 
  X, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  Edit3,
  Star,
  GraduationCap,
  Award,
  Phone,
  Video,
  Bell
} from 'lucide-react';
import { NotificationCenter } from '../drawers/NotificationCenter';
import { PrivateClassCreatorTerms } from '../common/PrivateClassCreatorTerms';
import { StarRatingWidget } from '../common/StarRatingWidget';

interface InstructorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODALITY_OPTIONS: { id: ClinicalModality; label: string }[] = [
  { id: 'xray', label: 'X-Ray & Plain Film' },
  { id: 'ct', label: 'Computed Tomography (CT)' },
  { id: 'mri', label: 'Magnetic Resonance (MRI)' },
  { id: 'ultrasound', label: 'Ultrasound & Sonography' },
  { id: 'anatomy', label: 'Radiographic Anatomy' },
  { id: 'rad_physics', label: 'Radiation Physics' },
  { id: 'hospital_practice', label: 'Hospital Practice' },
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const PRIVATE_CLASS_CATEGORIES: PrivateClassCategory[] = [
  'X-Ray & Plain Film',
  'CT Imaging',
  'MRI Physics & Protocols',
  'Ultrasound & Sonography',
  'Radiographic Anatomy',
  'Radiation Physics',
  'Exam & Board Prep',
];

export const InstructorStudioModal: React.FC<InstructorStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, unreadNotificationCount } = useAuth();
  const { currency: appCurrency, toggleCurrency } = useCurrency();
  const [showNotifModal, setShowNotifModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'courses' | 'create' | 'private_classes' | 'tutorials'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tutorialRequests, setTutorialRequests] = useState<TutorialRequest[]>([]);
  const [privateClasses, setPrivateClasses] = useState<PrivateClass[]>([]);
  const [privateBookings, setPrivateBookings] = useState<PrivateClassBookingRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Private Class Form State
  const [showPrivateClassForm, setShowPrivateClassForm] = useState(false);
  const [editingPrivateClassId, setEditingPrivateClassId] = useState<string | null>(null);
  const [pcTitle, setPcTitle] = useState('');
  const [pcImage, setPcImage] = useState('');
  const [isUploadingPcImage, setIsUploadingPcImage] = useState(false);
  const [pcCategory, setPcCategory] = useState<PrivateClassCategory>('CT Imaging');
  const [pcLevel, setPcLevel] = useState('Undergraduate / BSc');
  const [pcDays, setPcDays] = useState<string[]>(['Monday', 'Wednesday']);
  const [pcTimeSlots, setPcTimeSlots] = useState<string[]>(['5:00 PM - 7:00 PM WAT', '7:30 PM - 9:00 PM WAT']);
  const [pcNewSlot, setPcNewSlot] = useState('');
  const [pcDurationMinutes, setPcDurationMinutes] = useState<number>(60);
  const [pcOverview, setPcOverview] = useState('');
  const [pcIntroVideoUrl, setPcIntroVideoUrl] = useState('');
  const [pcAcademicExperience, setPcAcademicExperience] = useState('5+ Years Clinical & Academic Teaching');
  const [pcInstructorBio, setPcInstructorBio] = useState('');
  const [pcInstructorPhone, setPcInstructorPhone] = useState('');
  const [pcChargePerHourNGN, setPcChargePerHourNGN] = useState<number>(8000);
  const [pcChargePerHourUSD, setPcChargePerHourUSD] = useState<number>(5);
  const [pcMonthlyChargeNGN, setPcMonthlyChargeNGN] = useState<number>(45000);
  const [pcMonthlyChargeUSD, setPcMonthlyChargeUSD] = useState<number>(28);
  const [pcError, setPcError] = useState('');
  const [isSavingPc, setIsSavingPc] = useState(false);
  const [pcTermsAccepted, setPcTermsAccepted] = useState(false);

  // Course Form
  const [title, setTitle] = useState('');
  const [modality, setModality] = useState<ClinicalModality>('xray');
  const [duration, setDuration] = useState('3 Weeks · 2 hrs/week');
  const [price, setPrice] = useState('Free with Membership');
  const [isFree, setIsFree] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [overview, setOverview] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Available to tutor configuration
  const [availableToTutor, setAvailableToTutor] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [timeSlots, setTimeSlots] = useState<string[]>(['10:00 AM - 12:00 PM BST', '2:00 PM - 4:00 PM BST', '6:00 PM - 8:00 PM BST']);
  const [newTimeSlotInput, setNewTimeSlotInput] = useState('');
  const [ratePer30Min, setRatePer30Min] = useState<number>(25);
  const [currency, setCurrency] = useState('£');

  // Materials & Links
  const [materials, setMaterials] = useState<CourseMaterialLink[]>([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

  // Quiz questions
  const [quizQuestions, setQuizQuestions] = useState<CourseQuizQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctOptIdx, setCorrectOptIdx] = useState(0);

  // Subscribe to courses created by or relevant to this instructor
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeCourses((allCourses) => {
      setCourses(allCourses.filter((c) => c.creatorId === currentUser?.id || c.instructor?.toLowerCase() === currentUser?.fullName?.toLowerCase()));
    });
    return () => unsub?.();
  }, [isOpen, currentUser?.id, currentUser?.fullName]);

  // Subscribe to tutorial requests (Admin-first: only show requests shared by Admin)
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeTutorialRequests((requests) => {
      setTutorialRequests(
        requests.filter(
          (r) =>
            r.sharedWithInstructor === true &&
            (r.instructorId === currentUser?.id ||
              r.instructorName?.toLowerCase() === currentUser?.fullName?.toLowerCase())
        )
      );
    });
    return () => unsub?.();
  }, [isOpen, currentUser?.id, currentUser?.fullName]);

  // Subscribe to Instructor's Private Classes & Admin-forwarded Private Class Bookings
  useEffect(() => {
    if (!isOpen) return;
    const unsubPc = subscribePrivateClasses((list) => {
      setPrivateClasses(
        list.filter(
          (pc) =>
            pc.creatorId === currentUser?.id ||
            pc.instructorId === currentUser?.id ||
            pc.instructorName?.toLowerCase() === currentUser?.fullName?.toLowerCase()
        )
      );
    });
    const unsubBookings = subscribePrivateClassBookings((list) => {
      setPrivateBookings(
        list.filter(
          (b) =>
            b.sharedWithInstructor === true &&
            (b.instructorId === currentUser?.id ||
              b.instructorName?.toLowerCase() === currentUser?.fullName?.toLowerCase())
        )
      );
    });
    return () => {
      unsubPc?.();
      unsubBookings?.();
    };
  }, [isOpen, currentUser?.id, currentUser?.fullName]);

  if (!isOpen) return null;

  const triggerSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4500);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= 3) return prev;
      return [...prev, day];
    });
  };

  const togglePcDay = (day: string) => {
    setPcDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= 3) return prev;
      return [...prev, day];
    });
  };

  const addPcTimeSlot = () => {
    const trimmed = formatTime12h(pcNewSlot.trim());
    if (trimmed && !pcTimeSlots.includes(trimmed)) {
      setPcTimeSlots((prev) => [...prev, trimmed]);
      setPcNewSlot('');
    }
  };

  const removePcTimeSlot = (slot: string) => {
    setPcTimeSlots((prev) => prev.filter((s) => s !== slot));
  };

  const handlePcImageFileChange = async (file: File) => {
    setIsUploadingPcImage(true);
    setPcError('');
    try {
      const secureUrl = await uploadFileToCloudinary(file, 'private_classes');
      if (secureUrl) {
        setPcImage(secureUrl);
        triggerSuccess('Private class cover image uploaded successfully!');
      } else {
        setPcError('Failed to upload class cover image.');
      }
    } catch {
      setPcError('Could not upload image. Check your internet connection.');
    } finally {
      setIsUploadingPcImage(false);
    }
  };

  const resetPcForm = () => {
    setEditingPrivateClassId(null);
    setPcTitle('');
    setPcImage('');
    setPcCategory('CT Imaging');
    setPcLevel('Undergraduate / BSc');
    setPcDays(['Monday', 'Wednesday']);
    setPcTimeSlots(['5:00 PM - 7:00 PM WAT', '7:30 PM - 9:00 PM WAT']);
    setPcNewSlot('');
    setPcDurationMinutes(60);
    setPcOverview('');
    setPcIntroVideoUrl('');
    setPcAcademicExperience('5+ Years Clinical & Academic Teaching');
    setPcInstructorBio('');
    setPcInstructorPhone('');
    setPcChargePerHourNGN(8000);
    setPcChargePerHourUSD(5);
    setPcMonthlyChargeNGN(45000);
    setPcMonthlyChargeUSD(28);
    setPcTermsAccepted(false);
    setPcError('');
  };

  const startEditPrivateClass = (pc: PrivateClass) => {
    setEditingPrivateClassId(pc.id);
    setPcTitle(pc.title);
    setPcImage(pc.image || '');
    setPcCategory(pc.category);
    setPcLevel(pc.level);
    setPcDays(pc.daysAvailable.slice(0, 3));
    setPcTimeSlots((pc.timeSlots || ['5:00 PM - 7:00 PM WAT']).map((s) => formatTime12h(s)));
    setPcDurationMinutes(Math.min(120, Math.max(30, pc.durationMinutes || 60)));
    setPcOverview(pc.overview || '');
    setPcIntroVideoUrl(pc.introVideoUrl || '');
    setPcAcademicExperience(pc.academicExperience || '');
    setPcInstructorBio(pc.instructorBio || '');
    setPcInstructorPhone(pc.instructorPhone || '');
    setPcChargePerHourNGN(pc.chargePerHourNGN || 8000);
    setPcChargePerHourUSD(pc.chargePerHourUSD || 5);
    setPcMonthlyChargeNGN(pc.monthlyChargeNGN || 45000);
    setPcMonthlyChargeUSD(pc.monthlyChargeUSD || 28);
    setPcError('');
    setShowPrivateClassForm(true);
  };

  const handleSavePrivateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setPcError('');

    if (!pcTitle.trim()) {
      setPcError('Please enter a private class title.');
      return;
    }
    if (pcDays.length === 0 || pcDays.length > 3) {
      setPcError('Select between 1 and 3 available days per week.');
      return;
    }
    if (pcTimeSlots.length === 0) {
      setPcError('Add at least one available time slot.');
      return;
    }
    if (pcDurationMinutes > 120) {
      setPcError('Maximum duration per session is 2 hours (120 minutes).');
      return;
    }
    if (!pcOverview.trim()) {
      setPcError('Please enter an overview of what students will learn.');
      return;
    }
    if (!pcTermsAccepted) {
      setPcError('You must read and accept the Private Class Creator Terms & Legal Undertaking.');
      return;
    }

    setIsSavingPc(true);
    const existing = editingPrivateClassId
      ? privateClasses.find((item) => item.id === editingPrivateClassId)
      : undefined;

    const res = await pushPrivateClassToFirestore({
      id: editingPrivateClassId || undefined,
      title: pcTitle.trim(),
      image: pcImage.trim(),
      category: pcCategory,
      level: pcLevel.trim() || 'Undergraduate / BSc',
      daysAvailable: pcDays.slice(0, 3),
      timeSlots: pcTimeSlots.map((s) => formatTime12h(s)),
      durationMinutes: Math.min(120, Math.max(30, pcDurationMinutes)),
      overview: pcOverview.trim(),
      introVideoUrl: pcIntroVideoUrl.trim(),
      instructorId: currentUser?.id,
      instructorName: currentUser?.fullName || 'Clinical Instructor',
      instructorRole: currentUser?.role || 'Clinical Instructor / Tutor',
      academicExperience: pcAcademicExperience.trim() || 'Clinical & Academic Educator',
      instructorBio: pcInstructorBio.trim(),
      instructorPhone: pcInstructorPhone.trim(),
      rating: existing?.rating || 0,
      chargePerHourNGN: Number(pcChargePerHourNGN) || 8000,
      chargePerHourUSD: Number(pcChargePerHourUSD) || 5,
      monthlyChargeNGN: Number(pcMonthlyChargeNGN) || 45000,
      monthlyChargeUSD: Number(pcMonthlyChargeUSD) || 28,
      creatorId: currentUser?.id,
      creatorRole: 'instructor',
      status: existing?.status || 'pending_approval',
      createdAt: existing?.createdAt,
    });

    setIsSavingPc(false);
    if (res.success) {
      triggerSuccess(
        editingPrivateClassId
          ? 'Private class schedule & details updated!'
          : 'Private class submitted for Admin review and publishing!'
      );
      setShowPrivateClassForm(false);
      resetPcForm();
    } else {
      setPcError(res.error || 'Could not save private class.');
    }
  };

  const addTimeSlot = () => {
    const formatted = formatTime12h(newTimeSlotInput.trim());
    if (formatted && !timeSlots.includes(formatted)) {
      setTimeSlots([...timeSlots, formatted]);
      setNewTimeSlotInput('');
    }
  };

  const removeTimeSlot = (slot: string) => {
    setTimeSlots(timeSlots.filter((s) => s !== slot));
  };

  // Upload image to Cloudinary
  const handleImageFileChange = async (file: File) => {
    setIsUploadingImage(true);
    setErrorMessage('');
    try {
      const secureUrl = await uploadFileToCloudinary(file, 'course_covers');
      if (secureUrl) {
        setCoverImageUrl(secureUrl);
        triggerSuccess('Course cover uploaded to Cloudinary successfully!');
      } else {
        setErrorMessage('Failed to upload image. Please try again.');
      }
    } catch {
      setErrorMessage('Image upload failed. Please verify your connection.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Upload material to Cloudinary
  const handleMaterialFileChange = async (file: File) => {
    setIsUploadingMaterial(true);
    try {
      const url = await uploadFileToCloudinary(file, 'materials');
      if (url) {
        setMaterials((prev) => [
          ...prev,
          {
            id: `mat_${Date.now()}`,
            title: materialTitle.trim() || file.name,
            url,
            type: file.type.includes('pdf') ? 'pdf' : 'doc',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          },
        ]);
        setMaterialTitle('');
        triggerSuccess('Material uploaded to Cloudinary successfully!');
      }
    } catch {
      setErrorMessage('Failed to upload material file.');
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const addManualMaterialLink = () => {
    if (!materialTitle.trim() || !materialUrl.trim()) return;
    setMaterials((prev) => [
      ...prev,
      {
        id: `mat_${Date.now()}`,
        title: materialTitle.trim(),
        url: materialUrl.trim(),
        type: 'link',
      },
    ]);
    setMaterialTitle('');
    setMaterialUrl('');
  };

  const addQuizQuestion = () => {
    if (!newQuestion.trim() || !opt1.trim() || !opt2.trim()) {
      setErrorMessage('Please provide a question and at least two answer options.');
      return;
    }
    const options = [opt1.trim(), opt2.trim(), opt3.trim() || 'Not Applicable', opt4.trim() || 'None of the Above'];
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        question: newQuestion.trim(),
        options,
        correctAnswerIndex: correctOptIdx,
      },
    ]);
    setNewQuestion('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setCorrectOptIdx(0);
  };

  // Handle Course Creation
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter a course title.');
      return;
    }

    if (!overview.trim()) {
      setErrorMessage('Please enter a course overview describing the learning outcomes.');
      return;
    }

    setIsSubmitting(true);

    try {
      const courseId = `course_${Date.now()}`;
      const ytThumb = videoUrl ? getYouTubeThumbnail(videoUrl) : null;
      const finalImage = coverImageUrl || ytThumb || '/artifacts.jpeg';

      const initialModule: CourseModule = {
        id: `mod_${courseId}_1`,
        title: 'Core Clinical Foundations & Case Reviews',
        lessons: [
          {
            id: `les_${courseId}_1`,
            title: title.trim(),
            duration: '30 min',
            completed: false,
            type: 'video',
            videoUrl: videoUrl.trim(),
            summary: overview.trim(),
            materials,
            quiz: quizQuestions,
          },
        ],
      };

      const newCourse: Partial<Course> = {
        id: courseId,
        title: title.trim(),
        instructor: currentUser?.fullName || 'Lead Clinical Instructor',
        instructorRole: currentUser?.role || 'Clinical Instructor / Tutor',
        institution: currentUser?.institution || 'StudiRad Clinical Academy',
        modality,
        duration,
        cpdCredits: '',
        price: isFree ? 'Free with Membership' : price,
        isFree,
        videoUrl: videoUrl.trim(),
        overview: overview.trim(),
        image: finalImage,
        learningOutcomes: [
          'Master clinical radiologic pathology and protocol indications',
          'Evaluate real patient diagnostic imaging cases with precision',
          'Complete end-of-module knowledge quiz'
        ],
        modules: [initialModule],
        materials,
        quiz: quizQuestions,
        status: 'pending_approval', // Sent for Admin Approval! Admin publishes to userside.
        creatorId: currentUser?.id,
        creatorName: currentUser?.fullName,
        creatorRole: 'instructor',
        tutorAvailability: {
          enabled: availableToTutor,
          days: selectedDays,
          timeSlots: timeSlots,
          minDurationMinutes: 30,
          maxDurationMinutes: 60,
          ratePer30Min,
          currency,
        },
      };

      const res = await pushCourseToFirestore(newCourse);
      if (res.success) {
        triggerSuccess('Course submitted for approval! The admin team will review and publish your course to students shortly.');
        setActiveTab('courses');
        // Reset form
        setTitle('');
        setVideoUrl('');
        setOverview('');
        setCoverImageUrl('');
        setMaterials([]);
        setQuizQuestions([]);
      } else {
        setErrorMessage(res.error || 'Failed to submit course. Please try again.');
      }
    } catch {
      setErrorMessage('Could not save course. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn text-left text-slate-900 dark:text-slate-100">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-[#121824] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#161F30]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF7F32] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Instructor Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  Verified Tutor
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage courses, private classes &amp; bookings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNotifModal(true)}
              className="relative w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF7F32] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleCurrency}
              className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1 cursor-pointer"
              title="Switch display currency"
            >
              <span className="text-[#FF7F32] font-mono">{appCurrency === 'NGN' ? '₦' : '$'}</span>
              <span>{appCurrency}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="px-5 sm:px-7 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-[#121824] shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-[#002147] text-white dark:bg-[#FF7F32]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Courses ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-[#002147] text-white dark:bg-[#FF7F32]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Course</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('private_classes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'private_classes'
                ? 'bg-[#002147] text-white dark:bg-[#FF7F32]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Private Classes ({privateClasses.length})</span>
            {privateBookings.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {privateBookings.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutorials')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tutorials'
                ? 'bg-[#002147] text-white dark:bg-[#FF7F32]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Course Tutorial Requests ({tutorialRequests.length})</span>
          </button>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 px-5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: MY COURSES */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Uploaded Courses & Approval Status
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Once submitted, courses are reviewed by admin and published to learners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-2 rounded-xl bg-[#002147] dark:bg-[#FF7F32] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Course</span>
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No courses uploaded yet
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Click "Create New Course" above to draft your first module, configure your private tutoring rates, and submit for admin review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((course) => {
                    const isPublished = course.status === 'published';
                    return (
                      <div
                        key={course.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                isPublished
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              }`}>
                                {isPublished ? 'Live & Published' : 'Pending Admin Approval'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {course.modality || 'General'}
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {course.title}
                            </h5>
                          </div>
                        </div>

                        {course.tutorAvailability?.enabled && (
                          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span className="font-semibold">Available for Tutoring:</span>
                            <span className="font-bold text-[#FF7F32]">
                              {formatAmountInCurrency(course.tutorAvailability.ratePer30Min || 25, course.tutorAvailability.currency || '£', appCurrency)} / 30m
                            </span>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>{course.modules?.length || 1} Modules</span>
                          <span>{course.isFree ? 'Free' : formatPriceString(course.price, appCurrency) || 'Free'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE COURSE */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCourse} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Basic Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
                  1. Course Overview & Video
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Masterclass in Contrast Media Reactions & Protocol Optimization"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Modality / Discipline
                    </label>
                    <select
                      value={modality}
                      onChange={(e) => setModality(e.target.value as ClinicalModality)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      {MODALITY_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Estimated Duration
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 2 Weeks · 1.5 hrs/week"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Lecture Video Link (YouTube or Google Drive)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/.../view"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Course Cover Image (Cloudinary or paste) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Course Cover Image (Cloudinary Storage)</span>
                    {isUploadingImage && <span className="text-[10px] text-[#FF7F32] font-semibold">Uploading...</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="Image URL or upload from device below"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageFileChange(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Course Summary & Clinical Learning Goals
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    placeholder="Provide a detailed summary of what radiography students will learn in this course..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Available to Tutor Section (User Requirement 2) */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF7F32]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#002147] dark:text-[#FF7F32]">
                      2. Available to Tutor (Private 1-on-1 Sessions)
                    </h4>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableToTutor}
                      onChange={(e) => setAvailableToTutor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF7F32]"></div>
                  </label>
                </div>

                {availableToTutor && (
                  <div className="space-y-3.5 pt-2 border-t border-orange-200/60 dark:border-orange-800/40">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      When enabled, learners who view this course can book bespoke 1-on-1 private tutorials with you based on your selected days, time slots, and duration.
                    </p>

                    {/* Available Days Checkboxes (max 3 days/week) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Available Days of the Week</span>
                        <span className="text-[10px] font-semibold text-[#FF7F32]">{selectedDays.length}/3 days selected (max 3)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSel = selectedDays.includes(day);
                          const isLocked = !isSel && selectedDays.length >= 3;
                          return (
                            <button
                              type="button"
                              key={day}
                              disabled={isLocked}
                              onClick={() => toggleDay(day)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                isSel
                                  ? 'bg-[#002147] text-white border-[#002147] dark:bg-[#FF7F32] dark:border-[#FF7F32] cursor-pointer'
                                  : isLocked
                                  ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                  : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Available Time of Day Windows
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {timeSlots.map((slot) => (
                          <span
                            key={slot}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121824] border border-orange-200 dark:border-orange-800/60 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                          >
                            <span>{formatTime12h(slot)}</span>
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(slot)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTimeSlotInput}
                          onChange={(e) => setNewTimeSlotInput(e.target.value)}
                          placeholder="e.g. 7:00 PM - 9:00 PM BST"
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addTimeSlot}
                          className="px-3 py-1.5 rounded-xl bg-[#002147] dark:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                        >
                          + Add Slot
                        </button>
                      </div>
                    </div>

                    {/* Duration & Charge Rate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Session Duration Limits
                        </label>
                        <div className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          Min 30 min — Max 1 hr (Supported: 30m, 45m, 60m)
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Tuition Charge per 30 Minutes
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-16 px-2 py-2 text-xs rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                          >
                            <option value="£">£ (GBP)</option>
                            <option value="$">$ (USD)</option>
                            <option value="₦">₦ (NGN)</option>
                            <option value="€">€ (EUR)</option>
                          </select>
                          <input
                            type="number"
                            min="5"
                            step="1"
                            value={ratePer30Min}
                            onChange={(e) => setRatePer30Min(Number(e.target.value))}
                            placeholder="25"
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Student charge scales dynamically (e.g. 45m = {currency}{(ratePer30Min * 1.5).toFixed(0)}, 1h = {currency}{(ratePer30Min * 2).toFixed(0)}).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Materials & Attachments (Stored on Cloudinary) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
                    3. Course Slides & Reading Materials (Cloudinary)
                  </h4>
                  <span className="text-xs text-slate-400">
                    {materials.length} attached
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Material Title (e.g. Protocol Checklist PDF)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <label className="px-3 py-2 rounded-xl bg-[#002147] hover:bg-[#001733] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload to Cloudinary</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleMaterialFileChange(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                {materials.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {materials.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="truncate pr-2 font-medium">{m.title}</span>
                        <button
                          type="button"
                          onClick={() => setMaterials(materials.filter((item) => item.id !== m.id))}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End of Module Quiz */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7F32]">
                    4. End-of-Module Quiz ({quizQuestions.length} questions)
                  </h4>
                  <span className="text-xs text-slate-400">Verifies lesson completion</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter Quiz Question..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={opt1}
                      onChange={(e) => setOpt1(e.target.value)}
                      placeholder="Option 1"
                      className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={opt2}
                      onChange={(e) => setOpt2(e.target.value)}
                      placeholder="Option 2"
                      className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={opt3}
                      onChange={(e) => setOpt3(e.target.value)}
                      placeholder="Option 3"
                      className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={opt4}
                      onChange={(e) => setOpt4(e.target.value)}
                      placeholder="Option 4"
                      className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span>Correct Answer:</span>
                      <select
                        value={correctOptIdx}
                        onChange={(e) => setCorrectOptIdx(Number(e.target.value))}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={addQuizQuestion}
                      className="px-3 py-1.5 rounded-xl bg-[#002147] dark:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>

                {quizQuestions.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {quizQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="truncate pr-2">{idx + 1}. {q.question}</span>
                        <button
                          type="button"
                          onClick={() => setQuizQuestions(quizQuestions.filter((item) => item.id !== q.id))}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#002147] hover:bg-[#001733] dark:bg-[#FF7F32] dark:hover:bg-[#ff8f4a] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Course...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Admin Approval</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MY PRIVATE CLASSES & ADMIN-FORWARDED REQUESTS */}
          {activeTab === 'private_classes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    My Private Classes & Flexible Schedule
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Publish private mentoring classes (max 3 days/week, max 2 hrs/session). Adjust days and time slots anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showPrivateClassForm) {
                      setShowPrivateClassForm(false);
                      resetPcForm();
                    } else {
                      resetPcForm();
                      setShowPrivateClassForm(true);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#002147] dark:bg-[#FF7F32] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  {showPrivateClassForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{showPrivateClassForm ? 'Close Form' : 'Create Private Class'}</span>
                </button>
              </div>

              {/* Create / Edit Private Class Form */}
              {showPrivateClassForm && (
                <form
                  onSubmit={handleSavePrivateClass}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/70 pb-2.5">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#FF7F32]">
                      {editingPrivateClassId ? 'Edit Private Class Schedule & Details' : 'New Private Class Setup'}
                    </h5>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Max 3 days/week · Max 2 hours/session
                    </span>
                  </div>

                  {pcError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-semibold">
                      {pcError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Title</label>
                      <input
                        type="text"
                        required
                        value={pcTitle}
                        onChange={(e) => setPcTitle(e.target.value)}
                        placeholder="e.g. CT Head Stroke & Trauma Protocol Coaching"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Class Cover Image (Optional URL or Upload)</span>
                        {isUploadingPcImage && <span className="text-[10px] text-[#FF7F32] font-semibold">Uploading...</span>}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pcImage}
                          onChange={(e) => setPcImage(e.target.value)}
                          placeholder="Paste image URL or upload cover image"
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        />
                        <label className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handlePcImageFileChange(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                      <select
                        value={pcCategory}
                        onChange={(e) => setPcCategory(e.target.value as PrivateClassCategory)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      >
                        {PRIVATE_CLASS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Level</label>
                      <input
                        type="text"
                        value={pcLevel}
                        onChange={(e) => setPcLevel(e.target.value)}
                        placeholder="e.g. Undergraduate / Intern / MSc"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Duration per Session (Max 2 Hours)
                      </label>
                      <select
                        value={pcDurationMinutes}
                        onChange={(e) => setPcDurationMinutes(Math.min(120, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes (1 Hour)</option>
                        <option value={90}>90 minutes (1.5 Hours)</option>
                        <option value={120}>120 minutes (2 Hours Max)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Instructor WhatsApp Number (for Admin Alerts)
                      </label>
                      <input
                        type="tel"
                        value={pcInstructorPhone}
                        onChange={(e) => setPcInstructorPhone(e.target.value)}
                        placeholder="e.g. 2349029729621"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Max 3 Days/Week Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Available Days (Pick up to 3 days/week)</span>
                      <span className="text-[11px] font-bold text-[#FF7F32]">{pcDays.length}/3 selected</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSel = pcDays.includes(day);
                        const isLocked = !isSel && pcDays.length >= 3;
                        return (
                          <button
                            type="button"
                            key={day}
                            disabled={isLocked}
                            onClick={() => togglePcDay(day)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              isSel
                                ? 'bg-[#002147] text-white border-[#002147] dark:bg-[#FF7F32] dark:border-[#FF7F32] cursor-pointer'
                                : isLocked
                                ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Adjustable Time Slots */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Available Time Windows (Adjustable anytime)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {pcTimeSlots.map((slot) => (
                        <span
                          key={slot}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <span>{formatTime12h(slot)}</span>
                          <button
                            type="button"
                            onClick={() => removePcTimeSlot(slot)}
                            className="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pcNewSlot}
                        onChange={(e) => setPcNewSlot(e.target.value)}
                        placeholder="e.g. 8:00 PM - 9:30 PM WAT"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={addPcTimeSlot}
                        className="px-3 py-1.5 rounded-xl bg-[#002147] dark:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                      >
                        + Add Window
                      </button>
                    </div>
                  </div>

                  {/* Rates in Both NGN & USD */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hourly Rate (₦ NGN)</label>
                      <input
                        type="number"
                        min={500}
                        value={pcChargePerHourNGN}
                        onChange={(e) => setPcChargePerHourNGN(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hourly Rate ($ USD)</label>
                      <input
                        type="number"
                        min={1}
                        step="0.5"
                        value={pcChargePerHourUSD}
                        onChange={(e) => setPcChargePerHourUSD(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Monthly Sub (₦ NGN)</label>
                      <input
                        type="number"
                        min={1000}
                        value={pcMonthlyChargeNGN}
                        onChange={(e) => setPcMonthlyChargeNGN(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Monthly Sub ($ USD)</label>
                      <input
                        type="number"
                        min={5}
                        step="1"
                        value={pcMonthlyChargeUSD}
                        onChange={(e) => setPcMonthlyChargeUSD(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  {/* Experience, Bio & Promise Video */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic & Clinical Experience</label>
                      <input
                        type="text"
                        value={pcAcademicExperience}
                        onChange={(e) => setPcAcademicExperience(e.target.value)}
                        placeholder="e.g. 8 Years CT & University Lecturing"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Instructor Promise Video URL (Shown before payment)
                      </label>
                      <input
                        type="url"
                        value={pcIntroVideoUrl}
                        onChange={(e) => setPcIntroVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or Google Drive"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Instructor Details (In relation to this class)
                      </label>
                      <input
                        type="text"
                        value={pcInstructorBio}
                        onChange={(e) => setPcInstructorBio(e.target.value)}
                        placeholder="Describe your hands-on background and student outcomes for this specific topic..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Overview</label>
                      <textarea
                        rows={3}
                        required
                        value={pcOverview}
                        onChange={(e) => setPcOverview(e.target.value)}
                        placeholder="What specific clinical skills, cases, or exam drills are covered?"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-800 resize-none"
                      />
                    </div>
                  </div>

                  {/* Required Legal Undertaking & Creator Terms */}
                  <PrivateClassCreatorTerms
                    accepted={pcTermsAccepted}
                    onChange={setPcTermsAccepted}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrivateClassForm(false);
                        resetPcForm();
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPc || !pcTermsAccepted}
                      className="px-5 py-2 rounded-xl bg-[#002147] dark:bg-[#FF7F32] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSavingPc ? 'Saving...' : editingPrivateClassId ? 'Save Schedule Updates' : 'Submit Private Class'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Instructor Private Classes */}
              {privateClasses.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                  <GraduationCap className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    No private classes listed yet
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create a private class above so students can book weekly or monthly mentorship with you.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {privateClasses.map((pc) => (
                    <div
                      key={pc.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            pc.status === 'published'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          }`}>
                            {pc.status === 'published' ? 'Live to Students' : 'Pending Admin Approval'}
                          </span>
                          <StarRatingWidget itemType="private_class" itemId={pc.id} compact />
                        </div>

                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">
                          {pc.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {pc.category} · {pc.level} · {pc.durationMinutes} min/session
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {pc.daysAvailable.map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-[10px] font-semibold"
                            >
                              {d}
                            </span>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span>
                            <strong className="text-[#FF7F32]">
                              {formatMoney(pc.chargePerHourNGN, appCurrency, pc.chargePerHourUSD)}
                            </strong>
                            <span className="text-[10px] text-slate-400"> /hr</span>
                          </span>
                          <span>
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {formatMoney(pc.monthlyChargeNGN, appCurrency, pc.monthlyChargeUSD)}
                            </strong>
                            <span className="text-[10px] text-slate-400"> /mo</span>
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {pc.timeSlots.map((s) => formatTime12h(s)).join(' · ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditPrivateClass(pc)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 hover:border-[#FF7F32] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#FF7F32]" />
                          <span>Adjust Schedule</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin-Forwarded Private Class Bookings */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Assigned Student Bookings ({privateBookings.length})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All student bookings go to Admin first and appear here once Admin notifies you.
                  </p>
                </div>

                {privateBookings.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    No student private class bookings have been forwarded to you by Admin yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {privateBookings.map((bk) => (
                      <div
                        key={bk.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#FF7F32]">
                              {bk.referenceCode}
                            </span>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {bk.studentName}
                            </h5>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {bk.studentEmail} {bk.studentRole ? `· ${bk.studentRole}` : ''}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                            {bk.status}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="truncate pr-2">{bk.classTitle}</span>
                            <span className="text-[#FF7F32] shrink-0">
                              {formatMoney(bk.amountNGN, appCurrency, bk.amountUSD)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                            <span>Plan: {bk.planType === 'monthly' ? 'Monthly Subscription' : `${bk.selectedDays.length} day(s)/wk`}</span>
                            <span>Days: {bk.selectedDays.join(', ')}</span>
                            <span>Slot: {formatTime12h(bk.selectedTimeSlot)}</span>
                            <span>Starts: {bk.startDate}</span>
                          </div>
                          {bk.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <strong>Notes:</strong> {bk.notes}
                            </p>
                          )}
                          {bk.meetingLink && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 pt-1">
                              <strong>Meeting Room:</strong> {bk.meetingLink}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COURSE TUTORIAL REQUESTS (ADMIN-FORWARDED ONLY) */}
          {activeTab === 'tutorials' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Course Tutorial Inquiries (Forwarded by Admin)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student requests go to Admin first and appear here once Admin reviews and notifies you.
                </p>
              </div>

              {tutorialRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                  <Calendar className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No forwarded tutorial requests yet
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    When Admin assigns a student tutorial request to your profile, its schedule and details will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tutorialRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {req.studentName}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {req.studentEmail}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{req.courseTitle}</span>
                          <span className="text-[#FF7F32]">
                            {formatAmountInCurrency(req.calculatedRate, req.currency, appCurrency)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>Day: {req.selectedDay}</span>
                          <span>Slot: {formatTime12h(req.selectedTimeSlot)}</span>
                          <span>Duration: {req.durationMinutes} mins</span>
                        </div>
                        {req.specificFocusTopic && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <strong>Focus:</strong> {req.specificFocusTopic}
                          </p>
                        )}
                        {req.meetingLink && (
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 pt-1">
                            <strong>Meeting Room:</strong> {req.meetingLink}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NotificationCenter
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
      />
    </div>
  );
};
