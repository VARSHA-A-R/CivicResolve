import {
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  where,
  getDoc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  writeBatch,
  arrayUnion,
  deleteField,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import type {
  Complaint,
  ComplaintSubmission,
  ComplaintStatus,
  ComplaintTimelineEvent,
  CivicStats,
  OfficerNote,
} from '../types';

const STORAGE_KEY = 'civicresolve_complaints_v1';
const FIRESTORE_SAVE_TIMEOUT_MS = 15_000;
const MAX_INLINE_IMAGE_URL_LENGTH = 700 * 1024;
const FIRESTORE_CONFIRMATION_TIMEOUT_MS = 5_000;

function toPublicComplaint(complaint: Complaint): Complaint {
  const {
    aiAnalysis: _aiAnalysis,
    citizenContact: _citizenContact,
    citizenEmail: _citizenEmail,
    officerNotes: _officerNotes,
    ...publicComplaint
  } = complaint;
  return publicComplaint;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function logSaveStage(stage: string, outcome: 'started' | 'completed' | 'failed', startedAt?: number, error?: unknown): void {
  if (!import.meta.env.DEV) return;
  const duration = startedAt === undefined ? '' : ` (${Date.now() - startedAt}ms)`;
  const errorName = error instanceof Error ? ` ${error.name}` : '';
  const message = `[CivicResolve] Firestore complaint save ${stage}: ${outcome}${duration}${errorName}`;
  if (outcome === 'failed') console.error(message);
  else console.info(message);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Local storage helper
const getLocalComplaints = (): Complaint[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Complaint[];
    return Array.isArray(parsed) ? parsed.map(toPublicComplaint) : [];
  } catch (e) {
    console.warn('[CivicResolve] Failed to parse localStorage complaints', e);
    return [];
  }
};

const saveLocalComplaints = (complaints: Complaint[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (e) {
    console.error('[CivicResolve] Failed to save complaints to localStorage', e);
  }
};

const newestFirst = (complaints: Complaint[]): Complaint[] =>
  [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const complaintService = {
  /**
   * Subscribe to real-time complaint updates via Cloud Firestore onSnapshot.
   * Falls back to returning local stored complaints if Firebase is not active.
   */
  subscribeToComplaints(
    callback: (complaints: Complaint[]) => void,
    onError?: (error: Error) => void,
    includeOfficerData: boolean = false,
    citizenUid?: string
  ): Unsubscribe {
    const firestoreDb = db;
    if (includeOfficerData && (!isFirebaseConfigured() || !firestoreDb || !auth?.currentUser)) {
      callback([]);
      onError?.(new Error('Officer complaints require an authenticated Firebase connection.'));
      return () => {};
    }
    if (!includeOfficerData && isFirebaseConfigured() && firestoreDb
      && (!auth?.currentUser || !citizenUid || auth.currentUser.uid !== citizenUid)) {
      callback([]);
      if (auth?.currentUser) onError?.(new Error('Citizen complaints require the signed-in account UID.'));
      return () => {};
    }

    if (isFirebaseConfigured() && firestoreDb) {
      try {
        const complaintsRef = collection(firestoreDb, 'complaints');
        const q = includeOfficerData
          ? query(complaintsRef, orderBy('createdAt', 'desc'))
          : query(complaintsRef, where('citizenUid', '==', citizenUid));
        let isActive = true;

        const unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            try {
              const list = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const complaint = toPublicComplaint(docSnap.data() as Complaint);
                if (includeOfficerData) {
                  const assessmentSnap = await getDoc(doc(firestoreDb, 'officerAssessments', complaint.id));
                  if (assessmentSnap.exists()) {
                    const privateData = assessmentSnap.data();
                    return {
                      ...complaint,
                      ...(privateData.aiAnalysis ? { aiAnalysis: privateData.aiAnalysis } : {}),
                      ...(typeof privateData.citizenContact === 'string'
                        ? { citizenContact: privateData.citizenContact }
                        : {}),
                      ...(typeof privateData.citizenEmail === 'string'
                        ? { citizenEmail: privateData.citizenEmail }
                        : {}),
                      ...(Array.isArray(privateData.officerNotes)
                        ? { officerNotes: privateData.officerNotes as OfficerNote[] }
                        : {}),
                    };
                  }
                }
                return complaint;
              }));
              if (!isActive) return;
              const sortedList = newestFirst(list);
              if (!includeOfficerData) saveLocalComplaints(sortedList);
              callback(sortedList);
            } catch (error) {
              if (!isActive) return;
              onError?.(asError(error));
              callback([]);
            }
          },
          (err) => {
            if (!isActive) return;
            if (includeOfficerData) {
              onError?.(err);
              callback([]);
              return;
            }
            console.warn('[CivicResolve] Firestore onSnapshot error, reverting to local cache:', err);
            onError?.(err);
            callback(newestFirst(includeOfficerData
              ? getLocalComplaints()
              : getLocalComplaints().filter((complaint) => complaint.citizenUid === citizenUid)));
          }
        );

        return () => {
          isActive = false;
          unsubscribe();
        };
      } catch (err) {
        onError?.(asError(err));
        if (includeOfficerData) callback([]);
      }
    }

    if (includeOfficerData) {
      onError?.(new Error('Officer complaints could not be loaded from Firestore.'));
      callback([]);
      return () => {};
    }

    // Local / Offline mode
    callback(getLocalComplaints());
    return () => {};
  },

  /**
   * Fetch all complaints (one-shot)
   */
  async getAllComplaints(includeOfficerData: boolean = false, citizenUid?: string): Promise<Complaint[]> {
    const firestoreDb = db;
    if (includeOfficerData && (!isFirebaseConfigured() || !firestoreDb || !auth?.currentUser)) {
      throw new Error('Officer complaints require an authenticated Firebase connection.');
    }
    if (!includeOfficerData && isFirebaseConfigured() && firestoreDb && !auth?.currentUser) {
      return [];
    }
    if (!includeOfficerData && isFirebaseConfigured() && firestoreDb
      && (!citizenUid || auth?.currentUser?.uid !== citizenUid)) {
      throw new Error('Citizen complaints require the signed-in account UID.');
    }
    if (isFirebaseConfigured() && firestoreDb) {
      try {
        const complaintsRef = collection(firestoreDb, 'complaints');
        const q = includeOfficerData
          ? query(complaintsRef, orderBy('createdAt', 'desc'))
          : query(complaintsRef, where('citizenUid', '==', citizenUid));
        const snapshot = await getDocs(q);
        const list = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const complaint = toPublicComplaint(docSnap.data() as Complaint);
          if (!includeOfficerData) return complaint;

          const assessmentSnap = await getDoc(doc(firestoreDb, 'officerAssessments', complaint.id));
          if (!assessmentSnap.exists()) return complaint;
          const privateData = assessmentSnap.data();
          return {
            ...complaint,
            ...(privateData.aiAnalysis ? { aiAnalysis: privateData.aiAnalysis } : {}),
            ...(typeof privateData.citizenContact === 'string'
              ? { citizenContact: privateData.citizenContact }
              : {}),
            ...(typeof privateData.citizenEmail === 'string'
              ? { citizenEmail: privateData.citizenEmail }
              : {}),
            ...(Array.isArray(privateData.officerNotes)
              ? { officerNotes: privateData.officerNotes as OfficerNote[] }
              : {}),
          };
        }));
        return newestFirst(list);
      } catch (err) {
        if (includeOfficerData) throw err;
        console.warn('[CivicResolve] Firestore query failed, falling back to local persistence:', err);
      }
    }

    if (includeOfficerData) {
      throw new Error('Officer complaints could not be loaded from Firestore.');
    }
    return newestFirst(includeOfficerData
      ? getLocalComplaints()
      : getLocalComplaints().filter((complaint) => complaint.citizenUid === citizenUid));
  },

  /**
   * Get a complaint by unique ID
   */
  async getComplaintById(
    id: string,
    includeOfficerData: boolean = false,
    citizenUid?: string
  ): Promise<Complaint | null> {
    const cleanId = id.trim().toUpperCase();
    const firestoreDb = db;

    if (isFirebaseConfigured() && firestoreDb && !auth?.currentUser) return null;
    if (!includeOfficerData && isFirebaseConfigured() && firestoreDb
      && (!citizenUid || auth?.currentUser?.uid !== citizenUid)) {
      throw new Error('Complaint lookup requires the signed-in account UID.');
    }

    if (isFirebaseConfigured() && firestoreDb) {
      try {
        const docRef = doc(firestoreDb, 'complaints', cleanId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const complaint = toPublicComplaint(docSnap.data() as Complaint);
          if (includeOfficerData || complaint.citizenUid === citizenUid) return complaint;
          return null;
        }

        // Try querying by field 'id' just in case
        const q = includeOfficerData
          ? query(collection(firestoreDb, 'complaints'), where('id', '==', cleanId))
          : query(
            collection(firestoreDb, 'complaints'),
            where('id', '==', cleanId),
            where('citizenUid', '==', citizenUid)
          );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return toPublicComplaint(qSnap.docs[0].data() as Complaint);
        }
      } catch (err) {
        console.warn('[CivicResolve] Firestore get failed, falling back to local storage:', err);
      }
    }

    const localList = includeOfficerData
      ? getLocalComplaints()
      : getLocalComplaints().filter((complaint) => complaint.citizenUid === citizenUid);
    const found = localList.find(
      (c) => c.id.toUpperCase() === cleanId || c.id.replace(/-/g, '') === cleanId.replace(/-/g, '')
    );
    return found || null;
  },

  /**
   * Create a new complaint in Cloud Firestore
   */
  async createComplaint(
    complaintData: ComplaintSubmission,
    submissionKey?: string
  ): Promise<Complaint> {
    const firestoreDb = db;
    const currentUser = auth?.currentUser;
    if (!isFirebaseConfigured() || !firestoreDb || !currentUser) {
      throw new Error('You must be signed in to Firebase to submit a complaint. No complaint was saved.');
    }
    if (!complaintData.citizenUid || complaintData.citizenUid !== currentUser.uid) {
      throw new Error('The signed-in account does not match the complaint submitter. No complaint was saved.');
    }
    if (
      complaintData.imageUrl?.startsWith('data:') &&
      complaintData.imageUrl.length > MAX_INLINE_IMAGE_URL_LENGTH
    ) {
      throw new Error('The selected photograph is too large to safely save with the complaint. Choose a smaller image or enable Firebase Storage.');
    }

    const year = new Date().getFullYear();
    const safeSubmissionKey = submissionKey?.replace(/[^a-zA-Z0-9_-]/g, '');
    if (submissionKey && (!safeSubmissionKey || safeSubmissionKey !== submissionKey)) {
      throw new Error('Invalid complaint submission key. Please retry the submission.');
    }
    const generatedKey = safeSubmissionKey || doc(collection(firestoreDb, 'complaints')).id;
    const newId = `CR-${year}-${generatedKey.toUpperCase()}`;
    const complaintRef = doc(firestoreDb, 'complaints', newId);
    const now = new Date().toISOString();

    const initialEvent: ComplaintTimelineEvent = {
      id: `evt-${Date.now()}-1`,
      status: 'reported',
      statusLabel: 'Complaint Lodged',
      timestamp: now,
      actor: complaintData.citizenName || 'Citizen Contributor',
      actorRole: 'citizen',
      note: 'Civic issue registered through CivicResolve portal.',
    };

    const aiSourceLabel =
      complaintData.aiAnalysis.source === 'firebase-gemini-3.8-flash'
        ? 'Firebase AI Logic (Gemini 3.8 Flash)'
        : 'Civic Heuristic Rule Engine (Offline Fallback)';

    const aiEvent: ComplaintTimelineEvent = {
      id: `evt-${Date.now()}-2`,
      status: 'reported',
      statusLabel: 'AI Triage & Department Routing',
      timestamp: new Date(Date.now() + 1500).toISOString(),
      actor: aiSourceLabel,
      actorRole: 'ai_system',
      note: `Classified as ${complaintData.aiAnalysis.priority.toUpperCase()} priority. Auto-routed to ${complaintData.department}. Reason: ${complaintData.aiAnalysis.reason || complaintData.aiAnalysis.summary}`,
    };

    const {
      imageUrl,
      citizenEmail,
      assignedOfficer: _assignedOfficer,
      resolutionNotes: _resolutionNotes,
      resolvedAt: _resolvedAt,
      location: submittedLocation,
      ...complaintFields
    } = complaintData;
    const location = {
      address: submittedLocation.address,
      ...(submittedLocation.landmark ? { landmark: submittedLocation.landmark } : {}),
      ...(submittedLocation.pincode ? { pincode: submittedLocation.pincode } : {}),
      ...(submittedLocation.city ? { city: submittedLocation.city } : {}),
      ...(submittedLocation.coordinates
        ? { coordinates: submittedLocation.coordinates }
        : {}),
    };
    const newComplaint: Complaint = {
      ...complaintFields,
      location,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(citizenEmail !== undefined ? { citizenEmail } : {}),
      id: newId,
      createdAt: now,
      updatedAt: now,
      status: 'reported',
      isDemo: false, // Live submitted complaints are never marked as demo
      timeline: [initialEvent, aiEvent],
    };

    const {
      aiAnalysis: _aiAnalysis,
      citizenContact: _citizenContact,
      citizenEmail: _citizenEmail,
      ...publicComplaint
    } = newComplaint;

    const writeStartedAt = Date.now();
    logSaveStage('document write', 'started');
    try {
      await withTimeout(
        setDoc(complaintRef, publicComplaint),
        FIRESTORE_SAVE_TIMEOUT_MS,
        'Saving the complaint timed out. The save may still be processing; retrying this same form is safe.'
      );
      logSaveStage('document write', 'completed', writeStartedAt);
    } catch (writeError) {
      logSaveStage('document write', 'failed', writeStartedAt, writeError);
      try {
        const confirmedSnapshot = await withTimeout(
          getDocFromServer(complaintRef),
          FIRESTORE_CONFIRMATION_TIMEOUT_MS,
          'Could not confirm the complaint save.'
        );
        if (confirmedSnapshot.exists()) {
          const confirmed = confirmedSnapshot.data() as Partial<Complaint>;
          if (confirmed.citizenUid === currentUser.uid) {
            return {
              ...newComplaint,
              ...confirmed,
              aiAnalysis: complaintData.aiAnalysis,
              citizenContact: complaintData.citizenContact,
              citizenEmail: complaintData.citizenEmail,
            };
          }
        }
      } catch (confirmationError) {
        const writeMessage = writeError instanceof Error ? writeError.message : String(writeError);
        const confirmationMessage = confirmationError instanceof Error
          ? confirmationError.message
          : String(confirmationError);
        throw new Error(`Complaint save could not be confirmed. ${writeMessage} ${confirmationMessage}`);
      }
      throw writeError;
    }

    const currentList = getLocalComplaints();
    saveLocalComplaints([toPublicComplaint(newComplaint), ...currentList]);

    return newComplaint;
  },

  /**
   * Update complaint status and append timeline note.
   * Requires verified officer authorization.
   */
  async updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    citizenVisibleUpdate: string,
    privateOfficerNote: string,
    isVerifiedOfficer: boolean = false
  ): Promise<void> {
    const currentUser = auth?.currentUser;
    if (!isVerifiedOfficer || !currentUser || !db || !isFirebaseConfigured()) {
      throw new Error('Unauthorized: Only verified municipal officials can transition complaint statuses.');
    }
    if (!citizenVisibleUpdate.trim()) {
      throw new Error('A citizen-visible status update is required.');
    }
    if (citizenVisibleUpdate.trim().length > 2000 || privateOfficerNote.trim().length > 2000) {
      throw new Error('Status updates and officer notes must be 2,000 characters or fewer.');
    }

    const now = new Date().toISOString();

    const statusLabelMap: Record<ComplaintStatus, string> = {
      reported: 'Re-opened / Under Review',
      in_progress: 'In Progress / Assigned to Crew',
      resolved: 'Resolved & Closed',
      rejected: 'Deemed Ineligible / Rejected',
    };

    const newEvent: ComplaintTimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      status: newStatus,
      statusLabel: statusLabelMap[newStatus],
      timestamp: now,
      actor: currentUser.displayName || currentUser.email || currentUser.uid,
      actorRole: 'officer',
      note: citizenVisibleUpdate.trim(),
    };

    const batch = writeBatch(db);
    const complaintRef = doc(db, 'complaints', id);
    const assessmentRef = doc(db, 'officerAssessments', id);
    let complaintCitizenUid: string | undefined;
    let assessmentExists = false;
    const trimmedPrivateNote = privateOfficerNote.trim();
    if (trimmedPrivateNote) {
      const [complaintSnapshot, assessmentSnapshot] = await Promise.all([
        getDoc(complaintRef),
        getDoc(assessmentRef),
      ]);
      if (!complaintSnapshot.exists()) {
        throw new Error('The complaint could not be found in Firestore.');
      }
      const complaint = complaintSnapshot.data();
      if (typeof complaint.citizenUid !== 'string' || !complaint.citizenUid) {
        throw new Error('The complaint has no valid citizen owner in Firestore.');
      }
      complaintCitizenUid = complaint.citizenUid;
      assessmentExists = assessmentSnapshot.exists();
    }

    batch.update(complaintRef, {
      status: newStatus,
      updatedAt: now,
      timeline: arrayUnion(newEvent),
      resolutionNotes: newStatus === 'resolved' ? citizenVisibleUpdate.trim() : deleteField(),
      resolvedAt: newStatus === 'resolved' ? now : deleteField(),
    });

    if (trimmedPrivateNote) {
      const officerNote: OfficerNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        actorUid: currentUser.uid,
        actorName: currentUser.displayName || currentUser.email || currentUser.uid,
        timestamp: now,
        note: trimmedPrivateNote,
      };
      if (assessmentExists) {
        batch.update(assessmentRef, {
          officerNotes: arrayUnion(officerNote),
          updatedAt: now,
        });
      } else {
        batch.set(assessmentRef, {
          complaintId: id,
          citizenUid: complaintCitizenUid,
          officerNotes: [officerNote],
          updatedAt: now,
        });
      }
    }

    await batch.commit();
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
  },
};
