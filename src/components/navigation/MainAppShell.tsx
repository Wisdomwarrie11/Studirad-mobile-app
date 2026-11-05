import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Course, LiveClass, Opportunity, Tutor, ResearchService, TutorBooking } from '../../types';
import { MOCK_COURSES, MOCK_LIVE_CLASSES, MOCK_QUIZ } from '../../data/mockData';
import { AppHeader } from './AppHeader';
import { BottomTabBar } from './BottomTabBar';
import { NotificationCenter } from '../drawers/NotificationCenter';
import { ProfileDrawer } from '../drawers/ProfileDrawer';
import { HomeTab } from '../tabs/HomeTab';
import { LearnTab } from '../tabs/LearnTab';
import { SearchTab } from '../tabs/SearchTab';
import { ProfileTab } from '../tabs/ProfileTab';
import { AiTutorTab } from '../tabs/AiTutorTab';
import { ServicesTab } from '../tabs/ServicesTab';
import { ExploreTab } from '../tabs/ExploreTab';

// Interactive Modals
import { CourseDetailsModal } from '../modals/CourseDetailsModal';
import { CoursePlayerModal } from '../modals/CoursePlayerModal';
import { LiveClassModal } from '../modals/LiveClassModal';
import { QuizRunnerModal } from '../modals/QuizRunnerModal';
import { OpportunityDetailsModal } from '../modals/OpportunityDetailsModal';
import { TutorBookingModal } from '../modals/TutorBookingModal';
import { ResearchRequestModal } from '../modals/ResearchRequestModal';
import { AuthRequiredModal } from '../modals/AuthRequiredModal';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { OfflineStudyPackModal } from '../modals/OfflineStudyPackModal';

export const MainAppShell: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setScreen, 
    authPrompt, 
    closeAuthPrompt, 
    requireAuth 
  } = useAuth();
  const mainScrollRef = useRef<HTMLElement>(null);

  // Automatically reset scroll position to top whenever user switches tabs
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Drawer states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Modal active item states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [playerCourse, setPlayerCourse] = useState<Course | null>(null);
  const [selectedLiveClass, setSelectedLiveClass] = useState<LiveClass | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [selectedResearchService, setSelectedResearchService] = useState<ResearchService | null>(null);
  const [isOfflineStudyPackOpen, setIsOfflineStudyPackOpen] = useState(false);

  // Active bookings state (pure real data)
  const [activeBookings, setActiveBookings] = useState<TutorBooking[]>([]);

  const handleOpenPlayer = (course: Course) => {
    if (!requireAuth({
      title: 'Sign In to Stream Courses',
      message: 'Create a free account or sign in to watch comprehensive video lecture modules, access study attachments, and track CPD credits.',
      actionText: 'Watch Course',
    })) {
      return;
    }
    setPlayerCourse(course);
  };

  const handleStartQuiz = () => {
    if (!requireAuth({
      title: 'Sign In to Start Quiz',
      message: 'Create an account or sign in to test your clinical knowledge and save board exam spotter scores.',
      actionText: 'Diagnostic Spotter Quiz',
    })) {
      return;
    }
    setIsQuizActive(true);
  };

  const handleBookTutor = (tutor: Tutor) => {
    if (!requireAuth({
      title: 'Sign In to Book Mentorship',
      message: 'Sign in or register to schedule live 1-on-1 tutorials with accredited clinical tutors.',
      actionText: 'Book Mentorship',
    })) {
      return;
    }
    setSelectedTutor(tutor);
  };

  const handleRequestResearch = (srv: ResearchService) => {
    if (!requireAuth({
      title: 'Sign In to Request Services',
      message: 'Create an account or sign in to submit research analysis, clinical audit, and dissertation support requests.',
      actionText: 'Request Research',
    })) {
      return;
    }
    setSelectedResearchService(srv);
  };

  const handleConfirmBooking = (details: {
    tutorName: string;
    tutorRole: string;
    topic: string;
    date: string;
    timeSlot: string;
  }) => {
    if (!requireAuth({
      title: 'Sign In to Confirm Booking',
      message: 'Sign in or register to complete your 1-on-1 booking and receive meeting calendar links.',
      actionText: 'Confirm Session',
    })) {
      return;
    }
    const newBooking: TutorBooking = {
      id: 'bk_' + Date.now(),
      tutorName: details.tutorName,
      tutorRole: details.tutorRole,
      topic: details.topic,
      date: details.date,
      timeSlot: details.timeSlot,
      status: 'Confirmed',
      meetingUrl: 'https://meet.studirad.org/room/' + Math.random().toString(36).substring(2, 7),
    };
    setActiveBookings((prev) => [newBooking, ...prev]);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#0B0F17] relative text-slate-900 dark:text-slate-100">
      {/* Persistent App Header with Search and Profile at the top */}
      <AppHeader
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main ref={mainScrollRef} className="flex-1 w-full flex flex-col relative overflow-y-auto no-scrollbar">
        {activeTab === 'home' && (
          <HomeTab
            onSelectCourse={(course) => setSelectedCourse(course)}
            onOpenPlayer={handleOpenPlayer}
            onSelectLiveClass={(lc) => setSelectedLiveClass(lc)}
            onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
            onStartQuiz={handleStartQuiz}
            onOpenNotifications={() => setIsNotificationOpen(true)}
          />
        )}

        {activeTab === 'learn' && (
          <LearnTab
            onSelectCourse={(course) => setSelectedCourse(course)}
            onOpenPlayer={handleOpenPlayer}
            onSelectLiveClass={(lc) => setSelectedLiveClass(lc)}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab
            onSelectCourse={(course) => setSelectedCourse(course)}
            onOpenPlayer={handleOpenPlayer}
            onSelectLiveClass={(lc) => setSelectedLiveClass(lc)}
            onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
          />
        )}

        {activeTab === 'aiTutor' && <AiTutorTab />}

        {activeTab === 'services' && (
          <ServicesTab
            onBookTutor={handleBookTutor}
            onRequestResearch={handleRequestResearch}
            activeBookings={activeBookings}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreTab
            onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            onEditTopics={() => setScreen('personalise')}
            onOpenPlayer={handleOpenPlayer}
          />
        )}
      </main>

      {/* Persistent 5-Item Bottom Navigation Bar */}
      <BottomTabBar />

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onEditTopics={() => {
          setIsProfileOpen(false);
          setScreen('personalise');
        }}
      />

      {/* Interactive Modals */}
      <CourseDetailsModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onOpenPlayer={(c) => setPlayerCourse(c)}
      />

      <CoursePlayerModal
        course={playerCourse}
        onClose={() => setPlayerCourse(null)}
        onOpenQuiz={() => setIsQuizActive(true)}
      />

      <LiveClassModal
        liveClass={selectedLiveClass}
        onClose={() => setSelectedLiveClass(null)}
      />

      <QuizRunnerModal
        quiz={isQuizActive ? MOCK_QUIZ : null}
        onClose={() => setIsQuizActive(false)}
      />

      <OpportunityDetailsModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />

      <TutorBookingModal
        tutor={selectedTutor}
        onClose={() => setSelectedTutor(null)}
        onConfirmBooking={handleConfirmBooking}
      />

      <ResearchRequestModal
        service={selectedResearchService}
        onClose={() => setSelectedResearchService(null)}
        onSubmitRequest={(req) => console.log('Submitted research request', req)}
      />

      {/* Account Required Interceptor Modal */}
      {authPrompt && (
        <AuthRequiredModal
          isOpen={authPrompt.isOpen}
          onClose={closeAuthPrompt}
          title={authPrompt.title}
          message={authPrompt.message}
          actionText={authPrompt.actionText}
        />
      )}

      {/* Connectivity & Offline Educational Cache Indicator */}
      <OfflineIndicator onOpenOfflinePack={() => setIsOfflineStudyPackOpen(true)} />

      {/* Offline Radiography Study Pack Modal */}
      <OfflineStudyPackModal
        isOpen={isOfflineStudyPackOpen}
        onClose={() => setIsOfflineStudyPackOpen(false)}
      />
    </div>
  );
};
