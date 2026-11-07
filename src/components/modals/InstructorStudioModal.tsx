import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Course, 
  ClinicalModality, 
  CourseModule, 
  CourseMaterialLink, 
  CourseQuizQuestion,
  TutorialRequest 
} from '../../types';
import { 
  pushCourseToFirestore, 
  subscribeCourses, 
  subscribeTutorialRequests,
  updateTutorialRequestStatus
} from '../../services/firebaseDataService';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';
import { getYouTubeThumbnail, getVideoEmbedUrl } from '../../utils/youtube';
import { 
  X, 
  Plus, 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Trash2, 
  Sparkles, 
  HelpCircle, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Eye, 
  Layers,
  Link as LinkIcon,
  Play
} from 'lucide-react';

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

export const InstructorStudioModal: React.FC<InstructorStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'courses' | 'create' | 'tutorials'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tutorialRequests, setTutorialRequests] = useState<TutorialRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
  const [timeSlots, setTimeSlots] = useState<string[]>(['10:00 - 12:00 BST', '14:00 - 16:00 BST', '18:00 - 20:00 BST']);
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

  // Subscribe to tutorial requests
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeTutorialRequests((requests) => {
      setTutorialRequests(requests.filter((r) => r.instructorId === currentUser?.id || r.instructorName?.toLowerCase() === currentUser?.fullName?.toLowerCase()));
    });
    return () => unsub?.();
  }, [isOpen, currentUser?.id, currentUser?.fullName]);

  if (!isOpen) return null;

  const triggerSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4500);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addTimeSlot = () => {
    if (newTimeSlotInput.trim() && !timeSlots.includes(newTimeSlotInput.trim())) {
      setTimeSlots([...timeSlots, newTimeSlotInput.trim()]);
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
        cpdCredits: 'Course Certificate Included',
        price: isFree ? 'Free with Membership' : price,
        isFree,
        videoUrl: videoUrl.trim(),
        overview: overview.trim(),
        image: finalImage,
        learningOutcomes: [
          'Master clinical radiologic pathology and protocol indications',
          'Evaluate real patient diagnostic imaging cases with precision',
          'Pass end-of-module knowledge quiz and earn verified certificate'
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
                Upload accredited radiography courses and review 1-on-1 private tutorial bookings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-5 sm:px-7 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-[#121824] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
            onClick={() => setActiveTab('tutorials')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tutorials'
                ? 'bg-[#002147] text-white dark:bg-[#FF7F32]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Private Tutorial Requests ({tutorialRequests.length})</span>
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
                              {course.tutorAvailability.currency || '£'}{course.tutorAvailability.ratePer30Min} / 30m
                            </span>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>{course.modules?.length || 1} Modules</span>
                          <span>{course.price || 'Free'}</span>
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

                    {/* Available Days Checkboxes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Available Days of the Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSel = selectedDays.includes(day);
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => toggleDay(day)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-[#002147] text-white border-[#002147] dark:bg-[#FF7F32] dark:border-[#FF7F32]'
                                  : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
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
                            <span>{slot}</span>
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
                          placeholder="e.g. 19:00 - 21:00 BST"
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

          {/* TAB 3: PRIVATE TUTORIAL REQUESTS */}
          {activeTab === 'tutorials' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Student Tutorial Inquiries
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requests submitted by students for your course tutorials. Both you and the admin team can review and provide feedback.
                </p>
              </div>

              {tutorialRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                  <Calendar className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No tutorial requests received yet
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    When students request private 1-on-1 tutorials for your courses, their booking details and preferred time slots will appear here.
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
                          <span className="text-[#FF7F32]">{req.currency}{req.calculatedRate}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>📅 {req.selectedDay}</span>
                          <span>⏰ {req.selectedTimeSlot}</span>
                          <span>⏳ {req.durationMinutes} mins</span>
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
    </div>
  );
};
