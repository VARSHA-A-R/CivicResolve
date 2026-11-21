import { beforeEach, describe, expect, it, vi } from 'vitest';
import { complaintService } from '../services/complaintService';
import type { ComplaintSubmission } from '../types';

const firestoreMocks = vi.hoisted(() => {
  const batchSet = vi.fn();
  const batchUpdate = vi.fn();
  const batchCommit = vi.fn();
  const getDoc = vi.fn();
  const getDocFromServer = vi.fn();
  const getDocs = vi.fn();
  const setDoc = vi.fn();
  const orderBy = vi.fn((...args: unknown[]) => ({ orderBy: args }));
  const query = vi.fn((...parts: unknown[]) => ({ parts }));
  const where = vi.fn((...args: unknown[]) => ({ args }));
  return {
    batchSet,
    batchUpdate,
    batchCommit,
    getDoc,
    getDocFromServer,
    getDocs,
    setDoc,
    orderBy,
    query,
    where,
    auth: {
      currentUser: {
        uid: 'citizen-uid',
        displayName: 'Test Account',
        email: 'test@example.com',
      } as { uid: string; displayName: string; email: string } | null,
    },
    collection: vi.fn((_db: unknown, name: string) => ({ name })),
    doc: vi.fn((_dbOrCollection: unknown, ...segments: string[]) => ({
      id: segments[segments.length - 1] || 'firestore-generated-id',
    })),
    writeBatch: vi.fn(() => ({ set: batchSet, update: batchUpdate, commit: batchCommit })),
    arrayUnion: vi.fn((value: unknown) => ({ arrayUnion: value })),
    deleteField: vi.fn(() => ({ deleteField: true })),
  };
});

vi.mock('../services/firebase', () => ({
  auth: firestoreMocks.auth,
  db: {},
  isFirebaseConfigured: () => true,
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  getDocs: firestoreMocks.getDocs,
  getDoc: firestoreMocks.getDoc,
  query: firestoreMocks.query,
  orderBy: firestoreMocks.orderBy,
  where: firestoreMocks.where,
  getDocFromServer: firestoreMocks.getDocFromServer,
  setDoc: firestoreMocks.setDoc,
  onSnapshot: vi.fn(),
  writeBatch: firestoreMocks.writeBatch,
  arrayUnion: firestoreMocks.arrayUnion,
  deleteField: firestoreMocks.deleteField,
}));

const complaintInput = {
  title: 'Water leak on Main Street',
  description: 'Water is leaking from a pipe onto the pavement.',
  location: { address: 'Main Street', city: 'Bangalore' },
  status: 'reported',
  priority: 'medium',
  category: 'water',
  department: 'Water Supply & Sewerage',
  citizenName: 'Test Citizen',
  citizenContact: '9000000000',
  citizenUid: 'citizen-uid',
  aiAnalysis: {
    category: 'water',
    categoryLabel: 'Water Supply & Pipelines',
    priority: 'medium',
    recommendedDepartment: 'Water Supply & Sewerage',
    urgencyScore: 5,
    summary: 'Water leak.',
    keyActionItems: [],
    estimatedResolutionTime: '3 days',
    safetyHazard: false,
    confidenceScore: 0.5,
    source: 'civic-rule-engine-fallback',
  },
} satisfies ComplaintSubmission;

describe('complaint submission persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    firestoreMocks.auth.currentUser = {
      uid: 'citizen-uid',
      displayName: 'Test Account',
      email: 'test@example.com',
    };
    firestoreMocks.batchSet.mockClear();
    firestoreMocks.batchUpdate.mockClear();
    firestoreMocks.batchCommit.mockReset().mockResolvedValue(undefined);
    firestoreMocks.getDocFromServer.mockReset().mockResolvedValue({ exists: () => false });
    firestoreMocks.getDoc.mockReset();
    firestoreMocks.getDocs.mockReset().mockResolvedValue({ docs: [] });
    firestoreMocks.setDoc.mockReset().mockResolvedValue(undefined);
    firestoreMocks.doc.mockClear();
    firestoreMocks.query.mockClear();
    firestoreMocks.where.mockClear();
  });

  it('writes only the public complaint and returns an ID after Firestore confirms the write', async () => {
    const saved = await complaintService.createComplaint(complaintInput, 'attempt-key-1');

    expect(saved.id).toBe(`CR-${new Date().getFullYear()}-ATTEMPT-KEY-1`);
    expect(firestoreMocks.setDoc).toHaveBeenCalledOnce();
    expect(firestoreMocks.getDocFromServer).not.toHaveBeenCalled();
    expect(firestoreMocks.batchCommit).not.toHaveBeenCalled();
    const publicData = firestoreMocks.setDoc.mock.calls[0][1] as Record<string, unknown>;
    const location = publicData.location as Record<string, unknown>;
    expect(publicData).toMatchObject({
      id: saved.id,
      citizenUid: 'citizen-uid',
      status: 'reported',
      priority: 'medium',
      category: 'water',
      department: 'Water Supply & Sewerage',
    });
    expect(publicData).not.toHaveProperty('imageUrl');
    expect(publicData).not.toHaveProperty('citizenEmail');
    expect(publicData).not.toHaveProperty('citizenContact');
    expect(publicData).not.toHaveProperty('aiAnalysis');
    expect(location).not.toHaveProperty('landmark');
    expect(location).not.toHaveProperty('coordinates');
    expect(firestoreMocks.doc.mock.calls.some(([, collectionName]) =>
      collectionName === 'officerAssessments')).toBe(false);
    const locallyCached = JSON.parse(localStorage.getItem('civicresolve_complaints_v1') || '[]');
    expect(locallyCached[0]).not.toHaveProperty('aiAnalysis');
    expect(locallyCached[0]).not.toHaveProperty('citizenContact');
  });

  it('does not return a tracking ID when Firestore rejects the write', async () => {
    firestoreMocks.setDoc.mockRejectedValue(new Error('permission-denied'));

    await expect(
      complaintService.createComplaint(complaintInput, 'attempt-key-2')
    ).rejects.toThrow('permission-denied');
    expect(localStorage.getItem('civicresolve_complaints_v1')).toBeNull();
  });

  it('returns the original complaint after a retry finds its prior successful write', async () => {
    const savedData = {
      id: `CR-${new Date().getFullYear()}-ATTEMPT-KEY-3`,
      citizenUid: 'citizen-uid',
      title: complaintInput.title,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    firestoreMocks.setDoc.mockRejectedValueOnce(
      Object.assign(new Error('permission-denied'), { code: 'permission-denied' })
    );
    firestoreMocks.getDocFromServer.mockResolvedValueOnce({
      exists: () => true,
      data: () => savedData,
    });

    const saved = await complaintService.createComplaint(complaintInput, 'attempt-key-3');

    expect(saved.id).toBe(savedData.id);
    expect(saved.citizenUid).toBe('citizen-uid');
  });

  it('scopes citizen complaint queries to the authenticated UID', async () => {
    await complaintService.getAllComplaints(false, 'citizen-uid');

    expect(firestoreMocks.where).toHaveBeenCalledWith('citizenUid', '==', 'citizen-uid');
    expect(firestoreMocks.query).toHaveBeenCalledOnce();
    expect(firestoreMocks.getDocs).toHaveBeenCalledOnce();
    await expect(complaintService.getAllComplaints(false, 'another-citizen'))
      .rejects.toThrow(/signed-in account UID/i);
    expect(firestoreMocks.getDocs).toHaveBeenCalledOnce();
  });

  it('loads the officer feed, priorities, and statuses from Firestore complaints', async () => {
    const firestoreComplaint = {
      id: 'CR-2026-OFFICER-FEED',
      title: 'Water leak on Main Street',
      description: 'Water is leaking from a pipe onto the pavement.',
      location: { address: 'Main Street', city: 'Bangalore' },
      status: 'in_progress',
      priority: 'critical',
      category: 'water',
      department: 'Water Supply & Sewerage',
      citizenName: 'Test Citizen',
      citizenUid: 'citizen-uid',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
      timeline: [],
    };
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [{ data: () => firestoreComplaint }],
    });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

    const complaints = await complaintService.getAllComplaints(true);

    expect(complaints).toHaveLength(1);
    expect(complaints[0]).toMatchObject({
      id: firestoreComplaint.id,
      priority: 'critical',
      category: 'water',
      status: 'in_progress',
    });
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(firestoreMocks.getDocs).toHaveBeenCalledOnce();
  });

  it('saves citizen-visible status updates separately from private officer notes', async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ citizenUid: 'citizen-uid' }),
      })
      .mockResolvedValueOnce({ exists: () => true });

    await complaintService.updateComplaintStatus(
      'CR-2026-TEST',
      'in_progress',
      'A crew has been assigned.',
      'Internal dispatch reference 42.',
      true
    );

    expect(firestoreMocks.batchUpdate).toHaveBeenCalledTimes(2);
    const [, publicUpdate] = firestoreMocks.batchUpdate.mock.calls[0];
    const [, privateUpdate] = firestoreMocks.batchUpdate.mock.calls[1];
    expect(publicUpdate).toMatchObject({
      status: 'in_progress',
      timeline: {
        arrayUnion: expect.objectContaining({
          status: 'in_progress',
          actor: 'Test Account',
          actorRole: 'officer',
          note: 'A crew has been assigned.',
        }),
      },
    });
    expect(privateUpdate).toMatchObject({
      officerNotes: {
        arrayUnion: expect.objectContaining({
          actorUid: 'citizen-uid',
          note: 'Internal dispatch reference 42.',
        }),
      },
    });
    expect(publicUpdate).not.toHaveProperty('officerNotes');
    expect(privateUpdate).not.toHaveProperty('timeline');
    expect(firestoreMocks.batchCommit).toHaveBeenCalledOnce();
  });

  it('creates a private officer-note record when a new complaint has no assessment yet', async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ citizenUid: 'citizen-uid' }),
      })
      .mockResolvedValueOnce({ exists: () => false });

    await complaintService.updateComplaintStatus(
      'CR-2026-NEW',
      'in_progress',
      'A crew has been assigned.',
      'Private dispatch note.',
      true
    );

    expect(firestoreMocks.batchSet).toHaveBeenCalledOnce();
    expect(firestoreMocks.batchSet.mock.calls[0][1]).toMatchObject({
      complaintId: 'CR-2026-NEW',
      citizenUid: 'citizen-uid',
      updatedAt: expect.any(String),
      officerNotes: [expect.objectContaining({
        actorUid: 'citizen-uid',
        note: 'Private dispatch note.',
      })],
    });
    expect(firestoreMocks.batchCommit).toHaveBeenCalledOnce();
  });

  it('does not use cached complaints for the officer feed without an authenticated Firebase user', () => {
    localStorage.setItem('civicresolve_complaints_v1', JSON.stringify([{ id: 'LOCAL-DEMO' }]));
    firestoreMocks.auth.currentUser = null;
    const callback = vi.fn();
    const onError = vi.fn();

    complaintService.subscribeToComplaints(callback, onError, true);

    expect(callback).toHaveBeenCalledWith([]);
    expect(callback).not.toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'LOCAL-DEMO' }),
    ]));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/authenticated Firebase connection/i) })
    );
  });
});
