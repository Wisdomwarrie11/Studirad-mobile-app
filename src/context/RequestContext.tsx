import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeUserRequests,
  pushResearchRequestToFirestore,
  pushGeneralRequestToFirestore,
  deleteUserRequestFromFirestore,
} from '../services/firebaseDataService';
import { RepresentativeInfo } from '../services/researchAssistanceConfig';

export type RequestCategory = 'service' | 'research' | 'private_class';

export type RequestStatus =
  | 'New Request'
  | 'Submitted'
  | 'Under Review'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed';

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
  customStage?: string;
  supportDetails: string;
  deadline: string;
  methodologyNotes?: string;
  academicLevel?: string;
  serviceCategory?: string;
  selectedServices?: string[];
  priceDisplay?: string;
  othersDescription?: string;
  assignedRepresentative?: RepresentativeInfo;
  assignedRepLabel?: string;
  assignedRepPhone?: string;
  assignedRepWhatsapp?: string;
  whatsappMessage?: string;
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

export interface SubmitResearchResult {
  success: boolean;
  referenceCode?: string;
  requestId?: string;
  assignedRepresentative?: RepresentativeInfo;
  submittedAt?: string;
  error?: string;
}

interface RequestContextType {
  requests: UserRequest[];
  submitServiceRequest: (
    data: Omit<ServiceRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => Promise<{ success: boolean; referenceCode?: string; error?: string }>;
  submitResearchRequest: (
    data: Omit<ResearchRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => Promise<SubmitResearchResult>;
  submitPrivateClassRequest: (
    data: Omit<PrivateClassRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ) => Promise<{ success: boolean; referenceCode?: string; error?: string }>;
  getRequestById: (id: string) => UserRequest | undefined;
  cancelRequest: (id: string) => void;
}

const STORAGE_KEY_REQUESTS = 'studirad_user_requests';

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time synchronization with Firestore requests collection; preserve unsynced session requests
  useEffect(() => {
    if (currentUser?.id || currentUser?.email) {
      const uid = currentUser.id;
      const uEmail = currentUser.email?.toLowerCase();
      const unsub = subscribeUserRequests(
        { userId: uid, email: currentUser.email },
        (realRequests) => {
          setRequests((prev) => {
            const seenRefs = new Set(realRequests.map((r: any) => r.referenceCode || r.id));
            const unsyncedLocal = prev.filter((r: any) => {
              const key = r.referenceCode || r.id;
              if (seenRefs.has(key)) return false;
              const matchesOwner =
                !r.userId ||
                r.userId === uid ||
                (uEmail && r.userEmail?.toLowerCase() === uEmail);
              return matchesOwner;
            });
            const merged = [...realRequests, ...unsyncedLocal];
            merged.sort(
              (a: any, b: any) =>
                new Date(b.submittedAt || b.createdAt || 0).getTime() -
                new Date(a.submittedAt || a.createdAt || 0).getTime()
            );
            return merged;
          });
        }
      );
      return () => unsub?.();
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRequests(parsed.filter((r: any) => !r?.userId));
            return;
          }
        }
      } catch {}
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
    pushGeneralRequestToFirestore(newRequest).catch(() => {});
    return { success: true, referenceCode: ref };
  };

  const submitResearchRequest = async (
    data: Omit<ResearchRequest, 'id' | 'referenceCode' | 'category' | 'submittedAt' | 'status'>
  ): Promise<SubmitResearchResult> => {
    if (!data.researchTitle.trim()) {
      return { success: false, error: 'Please provide your research topic or enter "No topic yet".' };
    }

    try {
      const res = await pushResearchRequestToFirestore({
        ...data,
        userId: currentUser?.id || undefined,
        userName: data.userName || currentUser?.fullName || 'Researcher',
        userEmail: data.userEmail || currentUser?.email || '',
        supportDetails: data.supportDetails?.trim() || 'Not specified',
      });

      if (res.success && res.referenceCode) {
        const chosenRep = res.assignedRepresentative;
        const submittedAt = res.submittedAt || new Date().toISOString();
        const newRequest: ResearchRequest = {
          ...data,
          id: res.id || `req_${Date.now()}`,
          referenceCode: res.referenceCode,
          category: 'research',
          userId: currentUser?.id || undefined,
          submittedAt,
          status: 'New Request',
          assignedRepresentative: chosenRep,
          assignedRepLabel: chosenRep?.label,
          assignedRepPhone: chosenRep?.displayPhone,
          assignedRepWhatsapp: chosenRep?.whatsappNumber,
          statusNotes: chosenRep
            ? `Request logged and routed to ${chosenRep.label} (${chosenRep.displayPhone}). Speak with your representative on WhatsApp to finalize your requirements.`
            : 'Research inquiry received. An academic supervisor will review your project brief.',
        };
        setRequests((prev) => [newRequest, ...prev.filter((r) => r.referenceCode !== res.referenceCode)]);
        return {
          success: true,
          referenceCode: res.referenceCode,
          requestId: res.id,
          assignedRepresentative: chosenRep,
          submittedAt,
        };
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
    pushGeneralRequestToFirestore(newRequest).catch(() => {});
    return { success: true, referenceCode: ref };
  };

  const getRequestById = (id: string) => {
    return requests.find((r) => r.id === id);
  };

  const cancelRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    deleteUserRequestFromFirestore(id).catch(() => {});
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
