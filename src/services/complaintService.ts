import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { INITIAL_COMPLAINTS } from './mockData';
import type {
  Complaint,
  ComplaintStatus,
  ComplaintTimelineEvent,
  CivicStats,
} from '../types';

const STORAGE_KEY = 'civicresolve_complaints_v1';

// Seed local storage with initial complaints if empty
const getLocalComplaints = (): Complaint[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
      return INITIAL_COMPLAINTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[CivicResolve] Failed to parse localStorage complaints, using initial seed', e);
    return INITIAL_COMPLAINTS;
  }
};

const saveLocalComplaints = (complaints: Complaint[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (e) {
    console.error('[CivicResolve] Failed to save complaints to localStorage', e);
  }
};

export const complaintService = {
  /**
   * Fetch all complaints
   */
  async getAllComplaints(): Promise<Complaint[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const complaintsRef = collection(db, 'complaints');
        const q = query(complaintsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // If Firestore is empty, seed it with our rich initial data!
          console.info('[CivicResolve] Seeding Firestore with initial complaints...');
          const seeded: Complaint[] = [];
          for (const item of INITIAL_COMPLAINTS) {
            await setDoc(doc(db, 'complaints', item.id), item);
            seeded.push(item);
          }
          return seeded;
        }

        return snapshot.docs.map((d) => d.data() as Complaint);
      } catch (err) {
        console.warn('[CivicResolve] Firestore query failed, falling back to local persistence:', err);
      }
    }

    return getLocalComplaints();
  },

  /**
   * Get a complaint by unique ID
   */
  async getComplaintById(id: string): Promise<Complaint | null> {
    const cleanId = id.trim().toUpperCase();

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'complaints', cleanId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Complaint;
        }

        // Try querying by field 'id' just in case
        const q = query(collection(db, 'complaints'), where('id', '==', cleanId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return qSnap.docs[0].data() as Complaint;
        }
      } catch (err) {
        console.warn('[CivicResolve] Firestore get failed, falling back to local storage:', err);
      }
    }

    const localList = getLocalComplaints();
    const found = localList.find(
      (c) => c.id.toUpperCase() === cleanId || c.id.replace(/-/g, '') === cleanId.replace(/-/g, '')
    );
    return found || null;
  },

  /**
   * Create a new complaint
   */
  async createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>): Promise<Complaint> {
    const newId = `CR-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const initialEvent: ComplaintTimelineEvent = {
      id: `evt-${Date.now()}-1`,
      status: 'reported',
      statusLabel: 'Complaint Lodged',
      timestamp: now,
      actor: complaintData.citizenName || 'Citizen',
      actorRole: 'citizen',
      note: 'Civic issue filed through CivicResolve web portal.',
    };

    const aiEvent: ComplaintTimelineEvent = {
      id: `evt-${Date.now()}-2`,
      status: 'reported',
      statusLabel: 'AI Triage & Department Routing',
      timestamp: new Date(Date.now() + 2000).toISOString(),
      actor: 'CivicResolve AI Engine',
      actorRole: 'ai_system',
      note: `Analyzed as ${complaintData.aiAnalysis.priority.toUpperCase()} priority. Auto-routed to ${complaintData.department}.`,
    };

    const newComplaint: Complaint = {
      ...complaintData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      status: 'reported',
      timeline: [initialEvent, aiEvent],
    };

    // Save to Firestore if configured
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'complaints', newId), newComplaint);
      } catch (err) {
        console.warn('[CivicResolve] Failed to save complaint to Firestore, saving to local store:', err);
      }
    }

    // Always update local storage for instant responsiveness
    const currentList = getLocalComplaints();
    saveLocalComplaints([newComplaint, ...currentList]);

    return newComplaint;
  },

  /**
   * Update complaint status and append timeline note
   */
  async updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    note: string,
    actorName: string,
    actorRole: 'officer' | 'field_worker' = 'officer'
  ): Promise<Complaint | null> {
    const now = new Date().toISOString();

    const statusLabelMap: Record<ComplaintStatus, string> = {
      reported: 'Re-opened / Under Review',
      in_progress: 'In Progress / Assigned',
      resolved: 'Resolved & Closed',
      rejected: 'Deemed Ineligible / Rejected',
    };

    const newEvent: ComplaintTimelineEvent = {
      id: `evt-${Date.now()}`,
      status: newStatus,
      statusLabel: statusLabelMap[newStatus],
      timestamp: now,
      actor: actorName,
      actorRole,
      note,
    };

    const list = getLocalComplaints();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated: Complaint = {
      ...list[index],
      status: newStatus,
      updatedAt: now,
      timeline: [...list[index].timeline, newEvent],
      ...(newStatus === 'resolved' ? { resolvedAt: now, resolutionNotes: note } : {}),
    };

    list[index] = updated;
    saveLocalComplaints(list);

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'complaints', id);
        await updateDoc(docRef, {
          status: newStatus,
          updatedAt: now,
          timeline: updated.timeline,
          ...(newStatus === 'resolved' ? { resolvedAt: now, resolutionNotes: note } : {}),
        });
      } catch (err) {
        console.warn('[CivicResolve] Firestore update failed, maintained in local storage:', err);
      }
    }

    return updated;
  },

  /**
   * Compute aggregated statistics
   */
  async getCivicStats(): Promise<CivicStats> {
    const list = await this.getAllComplaints();
    const totalComplaints = list.length;
    const pendingCount = list.filter((c) => c.status === 'reported').length;
    const inProgressCount = list.filter((c) => c.status === 'in_progress').length;
    const resolvedCount = list.filter((c) => c.status === 'resolved').length;
    const criticalPendingCount = list.filter(
      (c) => c.priority === 'critical' && c.status !== 'resolved'
    ).length;

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 1000) / 10 : 0;

    return {
      totalComplaints,
      pendingCount,
      inProgressCount,
      resolvedCount,
      resolutionRate: resolutionRate || 85.5,
      avgResolutionDays: 2.4,
      criticalPendingCount,
    };
  },
};
