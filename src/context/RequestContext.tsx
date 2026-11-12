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

import { subscribeUserRequests, pushResearchRequestToFirestore } from '../services/firebaseDataService';

const STORAGE_KEY_REQUESTS = 'studirad_user_requests';

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>([]);

  // Real-time synchronization with Firestore requests collection
  useEffect(() => {
    if (currentUser?.id || currentUser?.email) {
      const unsub = subscribeUserRequests(currentUser.id || currentUser.email || '', (realRequests) => {
        setRequests(realRequests);
      });
      return () => unsub?.();
    } else {
      setRequests([]);
    }
  }, [currentUser?.id, currentUser?.email]);

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
    await new Promise((resolve) => setTimeout(resolve, 400));

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
      statusNotes: 'Your service request has been logged. Our team will assess requirements within 24 hours.',
    };

    setRequests((prev) => [newRequest, ...prev]);
    return { success: true, referenceCode: ref };
  };

  const submitResearchRequest = async (
    data: Omit<ResearchRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => {
    if (!data.researchTitle.trim()) {
      return { success: false, error: 'Please provide your research topic or title.' };
    }

    try {
      // Write to real Firestore collection and trigger admin notification
      const res = await pushResearchRequestToFirestore({
        ...data,
        userId: currentUser?.id,
        userName: data.userName || currentUser?.fullName || 'Researcher',
        userEmail: data.userEmail || currentUser?.email || 'scholar@studirad.org',
        supportDetails: data.supportDetails?.trim() || 'Not specified',
      });

      if (res.success && res.referenceCode) {
        const newRequest: ResearchRequest = {
          ...data,
          id: 'req_' + Date.now(),
          referenceCode: res.referenceCode,
          category: 'research',
          userId: currentUser?.id,
          submittedAt: new Date().toISOString(),
          status: 'Submitted',
          statusNotes: 'Research inquiry received. An academic supervisor will review your project brief.',
        };
        setRequests((prev) => [newRequest, ...prev.filter(r => r.referenceCode !== res.referenceCode)]);
        return { success: true, referenceCode: res.referenceCode };
      }
      return { success: false, error: res.error || 'Failed to submit research request.' };
    } catch (err) {
      console.error('Error submitting research request:', err);
      return { success: false, error: 'Could not connect to service. Please check your internet connection.' };
    }
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
