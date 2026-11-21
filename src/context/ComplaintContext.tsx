import React, { createContext, useContext, useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';
import { useAuth } from './AuthContext';
import type { Complaint, ComplaintStatus, ComplaintSubmission, CivicStats } from '../types';

interface ComplaintFilter {
  category: string;
  priority: string;
  status: string;
  search: string;
}

interface ComplaintContextType {
  complaints: Complaint[];
  filteredComplaints: Complaint[];
  loading: boolean;
  complaintError: string | null;
  stats: CivicStats | null;
  filter: ComplaintFilter;
  setFilter: React.Dispatch<React.SetStateAction<ComplaintFilter>>;
  resetFilter: () => void;
  refreshComplaints: () => Promise<void>;
  createComplaint: (
    data: ComplaintSubmission,
    submissionKey?: string
  ) => Promise<Complaint>;
  updateComplaintStatus: (
    id: string,
    status: ComplaintStatus,
    citizenVisibleUpdate: string,
    privateOfficerNote: string
  ) => Promise<void>;
  getComplaintById: (id: string) => Promise<Complaint | null>;
}

const defaultFilter: ComplaintFilter = {
  category: 'all',
  priority: 'all',
  status: 'all',
  search: '',
};

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

export const ComplaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isVerifiedOfficer, user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [stats, setStats] = useState<CivicStats | null>(null);
  const [filter, setFilter] = useState<ComplaintFilter>(defaultFilter);

  const calculateStats = (list: Complaint[]): CivicStats => {
    const totalComplaints = list.length;
    const pendingCount = list.filter((c) => c.status === 'reported').length;
    const inProgressCount = list.filter((c) => c.status === 'in_progress').length;
    const resolvedCount = list.filter((c) => c.status === 'resolved').length;
    const criticalPendingCount = list.filter(
      (c) => c.priority === 'critical' && c.status !== 'resolved'
    ).length;

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 1000) / 10 : 0;
    const resolutionDurations = list
      .filter((complaint) => complaint.status === 'resolved' && complaint.resolvedAt)
      .map((complaint) =>
        (new Date(complaint.resolvedAt!).getTime() - new Date(complaint.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      .filter((days) => Number.isFinite(days) && days >= 0);

    return {
      totalComplaints,
      pendingCount,
      inProgressCount,
      resolvedCount,
      resolutionRate,
      avgResolutionDays: resolutionDurations.length
        ? Math.round((resolutionDurations.reduce((total, days) => total + days, 0) /
            resolutionDurations.length) * 10) / 10
        : 0,
      criticalPendingCount,
    };
  };

  // Real-time Firestore onSnapshot listener
  useEffect(() => {
    setLoading(true);
    setComplaintError(null);
    setComplaints([]);
    setStats(calculateStats([]));
    const unsubscribe = complaintService.subscribeToComplaints((updatedList) => {
      const visibleList = isVerifiedOfficer
        ? updatedList
        : user?.uid
          ? updatedList.filter((complaint) => complaint.citizenUid === user.uid)
          : [];
      setComplaints(visibleList);
      setStats(calculateStats(visibleList));
      setLoading(false);
    }, (error) => {
      setComplaintError(error.message);
      setLoading(false);
    }, isVerifiedOfficer, user?.uid);

    return () => unsubscribe();
  }, [isVerifiedOfficer, user?.uid]);

  const refreshComplaints = async () => {
    try {
      const list = await complaintService.getAllComplaints(isVerifiedOfficer, user?.uid);
      const visibleList = isVerifiedOfficer
        ? list
        : list.filter((complaint) => complaint.citizenUid === user?.uid);
      setComplaints(visibleList);
      setStats(calculateStats(visibleList));
      setComplaintError(null);
    } catch (error) {
      setComplaintError(error instanceof Error ? error.message : 'Complaints could not be refreshed.');
      setComplaints([]);
      setStats(calculateStats([]));
    }
  };

  const createComplaint = async (
    data: ComplaintSubmission,
    submissionKey?: string
  ): Promise<Complaint> => {
    const created = await complaintService.createComplaint(data, submissionKey);
    return created;
  };

  const updateComplaintStatus = async (
    id: string,
    newStatus: ComplaintStatus,
    citizenVisibleUpdate: string,
    privateOfficerNote: string
  ): Promise<void> => {
    await complaintService.updateComplaintStatus(
      id,
      newStatus,
      citizenVisibleUpdate,
      privateOfficerNote,
      isVerifiedOfficer
    );
  };

  const getComplaintById = async (id: string): Promise<Complaint | null> => {
    const clean = id.trim().toUpperCase();
    const existing = complaints.find(
      (c) => c.id.toUpperCase() === clean || c.id.replace(/-/g, '') === clean.replace(/-/g, '')
    );
    if (existing) return existing;
    return await complaintService.getComplaintById(id, isVerifiedOfficer, user?.uid);
  };

  const resetFilter = () => {
    setFilter(defaultFilter);
  };

  // Compute filtered list
  const filteredComplaints = complaints.filter((c) => {
    if (filter.category !== 'all' && c.category !== filter.category) return false;
    if (filter.priority !== 'all' && c.priority !== filter.priority) return false;
    if (filter.status !== 'all' && c.status !== filter.status) return false;
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      const matchLoc = c.location.address.toLowerCase().includes(q);
      const matchDept = c.department.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchId && !matchLoc && !matchDept) return false;
    }
    return true;
  });

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        filteredComplaints,
        loading,
        complaintError,
        stats,
        filter,
        setFilter,
        resetFilter,
        refreshComplaints,
        createComplaint,
        updateComplaintStatus,
        getComplaintById,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};
