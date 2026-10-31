import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type RequestCategory = 'service' | 'research' | 'private_class';

export type RequestStatus = 'Submitted' | 'Under Review' | 'Scheduled' | 'In Progress' | 'Completed';

export interface BaseRequest {
  id: string;
  referenceCode: string;
  category: RequestCategory;
  userId?: string;
  userName: string;
  userEmail: string;
  submittedAt: string;
  status: RequestStatus;
  statusNotes?: string;
}

export interface ServiceRequest extends BaseRequest {
  category: 'service';
  serviceType: string;
  description: string;
  timeline: string;
  additionalNotes?: string;
  departmentOrHospital?: string;
}

export interface ResearchRequest extends BaseRequest {
  category: 'research';
  researchTitle: string;
  discipline: string;
  assistanceType: string;
  currentStage: string;
  supportDetails: string;
  deadline: string;
  methodologyNotes?: string;
}

export interface PrivateClassRequest extends BaseRequest {
  category: 'private_class';
  subjectTopic: string;
  currentKnowledgeLevel: string;
  learningObjectives: string;
  preferredFormat: 'Online 1-on-1' | 'Group Tutorial' | 'Case Study Review';
  preferredSchedule: string;
  tutorPreference?: string;
  specialNeeds?: string;
}

export type UserRequest = ServiceRequest | ResearchRequest | PrivateClassRequest;

interface RequestContextType {
  requests: UserRequest[];
  submitServiceRequest: (data: Omit<ServiceRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>) => Promise<{ success: boolean; referenceCode?: string; error?: string }>;
  submitResearchRequest: (data: Omit<ResearchRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>) => Promise<{ success: boolean; referenceCode?: string; error?: string }>;
  submitPrivateClassRequest: (data: Omit<PrivateClassRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>) => Promise<{ success: boolean; referenceCode?: string; error?: string }>;
  getRequestById: (id: string) => UserRequest | undefined;
  cancelRequest: (id: string) => void;
}

const STORAGE_KEY_REQUESTS = 'studirad_user_requests';

// Initial pre-loaded real request sample so user can immediately see their request log in action
const INITIAL_REQUESTS: UserRequest[] = [
  {
    id: 'req_init_1',
    referenceCode: 'SR-REQ-84920',
    category: 'private_class',
    userName: 'Alex Morgan',
    userEmail: 'alex.morgan@nhs.uk',
    subjectTopic: 'Trauma Radiography & C-Spine Peg Clearing',
    currentKnowledgeLevel: 'Qualified Band 5 Radiographer',
    learningObjectives: 'Improve diagnostic confidence when evaluating lateral cervical spine odontoid pegs and identifying occult facet subluxations.',
    preferredFormat: 'Online 1-on-1',
    preferredSchedule: 'Weekday Evenings (after 18:00 BST)',
    tutorPreference: 'Consultant Radiographer or Superintendent',
    specialNeeds: 'Focus on pediatric and geriatric trauma cases',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'Scheduled',
    statusNotes: 'Session confirmed with Dr. Marcus Thorne for Thursday 18:30 BST.',
  },
  {
    id: 'req_init_2',
    referenceCode: 'SR-RES-71932',
    category: 'research',
    userName: 'Alex Morgan',
    userEmail: 'alex.morgan@nhs.uk',
    researchTitle: 'Evaluation of Automated Tube Voltage Selection in Low-Dose Chest CT',
    discipline: 'Diagnostic Computed Tomography',
    assistanceType: 'SPSS Biostatistics & Methodology',
    currentStage: 'Data Collection & Statistical Analysis',
    supportDetails: 'Need guidance running two-way ANOVA and Bland-Altman plots comparing radiation dose metrics (CTDIvol, DLP) with image quality scores across 120 patients.',
    deadline: 'Within 3 Weeks',
    methodologyNotes: 'Hospital IRB approved; anonymized SPSS .sav file prepared.',
    submittedAt: new Date(Date.now() - 172800000).toISOString(),
    status: 'Under Review',
    statusNotes: 'Academic advisor reviewing data structure and test selection.',
  },
];

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.warn('Could not persist requests', e);
    }
  }, [requests]);

  const generateRefCode = (prefix: string) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `SR-${prefix}-${randomNum}`;
  };

  const submitServiceRequest = async (
    data: Omit<ServiceRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => {
    // Artificial delay to mimic server submission
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!data.serviceType || !data.description.trim()) {
      return { success: false, error: 'Please specify the service category and detailed requirements.' };
    }

    const ref = generateRefCode('SRV');
    const newRequest: ServiceRequest = {
      ...data,
      id: 'req_' + Date.now(),
      referenceCode: ref,
      category: 'service',
      userId: currentUser?.id,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      statusNotes: 'Your service request has been logged. Our clinical team will assess requirements within 24 hours.',
    };

    setRequests((prev) => [newRequest, ...prev]);
    return { success: true, referenceCode: ref };
  };

  const submitResearchRequest = async (
    data: Omit<ResearchRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!data.researchTitle.trim() || !data.supportDetails.trim()) {
      return { success: false, error: 'Please provide your research topic title and specific support needed.' };
    }

    const ref = generateRefCode('RES');
    const newRequest: ResearchRequest = {
      ...data,
      id: 'req_' + Date.now(),
      referenceCode: ref,
      category: 'research',
      userId: currentUser?.id,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      statusNotes: 'Research inquiry received. An academic supervisor will review your project brief.',
    };

    setRequests((prev) => [newRequest, ...prev]);
    return { success: true, referenceCode: ref };
  };

  const submitPrivateClassRequest = async (
    data: Omit<PrivateClassRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!data.subjectTopic.trim() || !data.learningObjectives.trim()) {
      return { success: false, error: 'Please specify the learning topic and key educational objectives.' };
    }

    const ref = generateRefCode('CLS');
    const newRequest: PrivateClassRequest = {
      ...data,
      id: 'req_' + Date.now(),
      referenceCode: ref,
      category: 'private_class',
      userId: currentUser?.id,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      statusNotes: 'Class request submitted. We will match you with a specialized tutor in your time slot.',
    };

    setRequests((prev) => [newRequest, ...prev]);
    return { success: true, referenceCode: ref };
  };

  const getRequestById = (id: string) => {
    return requests.find((r) => r.id === id);
  };

  const cancelRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <RequestContext.Provider
      value={{
        requests,
        submitServiceRequest,
        submitResearchRequest,
        submitPrivateClassRequest,
        getRequestById,
        cancelRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequests must be used within a RequestProvider');
  }
  return context;
};
