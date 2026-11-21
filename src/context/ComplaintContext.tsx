import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { complaintService } from '../services/complaintService';
import type { Complaint, ComplaintStatus, CivicStats } from '../types';

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
  stats: CivicStats | null;
  filter: ComplaintFilter;
  setFilter: React.Dispatch<React.SetStateAction<ComplaintFilter>>;
  resetFilter: () => void;
  refreshComplaints: () => Promise<void>;
  createComplaint: (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => Promise<Complaint>;
  updateComplaintStatus: (id: string, status: ComplaintStatus, note: string, actor: string) => Promise<void>;
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
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<CivicStats | null>(null);
  const [filter, setFilter] = useState<ComplaintFilter>(defaultFilter);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, computedStats] = await Promise.all([
        complaintService.getAllComplaints(),
        complaintService.getCivicStats(),
      ]);
      setComplaints(list);
      setStats(computedStats);
    } catch (err) {
      console.error('[CivicResolve] Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshComplaints = async () => {
    await loadData();
  };

  const createComplaint = async (
    data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>
  ): Promise<Complaint> => {
    const created = await complaintService.createComplaint(data);
    await loadData();
    return created;
  };

  const updateComplaintStatus = async (
    id: string,
    newStatus: ComplaintStatus,
    note: string,
    actor: string
  ): Promise<void> => {
    await complaintService.updateComplaintStatus(id, newStatus, note, actor, 'officer');
    await loadData();
  };

  const getComplaintById = async (id: string): Promise<Complaint | null> => {
    // Check in local state first
    const clean = id.trim().toUpperCase();
    const existing = complaints.find(
      (c) => c.id.toUpperCase() === clean || c.id.replace(/-/g, '') === clean.replace(/-/g, '')
    );
    if (existing) return existing;
    return await complaintService.getComplaintById(id);
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
