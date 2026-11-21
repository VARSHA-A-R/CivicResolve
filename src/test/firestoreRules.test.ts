import { readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnvironment: RulesTestEnvironment;

const citizenProfile = (uid: string) => ({
  uid,
  email: `${uid}@example.com`,
  displayName: 'Test Citizen',
  phoneNumber: '+15551234567',
  role: 'citizen',
  createdAt: '2026-03-01T10:00:00.000Z',
});

const complaintRecord = (uid: string, id: string) => ({
  id,
  title: 'Water leak on Main Street',
  description: 'Water is leaking from a pipe onto the pavement.',
  location: { address: 'Main Street', city: 'Bangalore' },
  status: 'reported',
  priority: 'medium',
  category: 'water',
  department: 'Water Supply & Sewerage',
  citizenName: 'Test Citizen',
  citizenUid: uid,
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  isDemo: false,
  timeline: [{
    id: 'evt-1',
    status: 'reported',
    statusLabel: 'Complaint Lodged',
    timestamp: '2026-03-01T10:00:00.000Z',
    actor: 'Test Citizen',
    actorRole: 'citizen',
    note: 'Civic issue registered through CivicResolve portal.',
  }],
});

const rulesDescribe = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;

rulesDescribe('Firestore profile and complaint access rules', () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      projectId: 'demo-civicresolve',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnvironment.clearFirestore();
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it('allows an authenticated citizen to create and read their own profile', async () => {
    const db = testEnvironment.authenticatedContext('citizen-1', {
      email: 'citizen-1@example.com',
    }).firestore();
    const profileRef = doc(db, 'users', 'citizen-1');

    await assertSucceeds(setDoc(profileRef, citizenProfile('citizen-1')));
    const profile = await assertSucceeds(getDoc(profileRef));
    expect(profile.data()).toMatchObject({
      uid: 'citizen-1',
      email: 'citizen-1@example.com',
      phoneNumber: '+15551234567',
      role: 'citizen',
    });
  });

  it('rejects a profile email that does not match the authenticated email', async () => {
    const db = testEnvironment.authenticatedContext('citizen-1', {
      email: 'verified@example.com',
    }).firestore();

    await assertFails(setDoc(doc(db, 'users', 'citizen-1'), citizenProfile('citizen-1')));
  });

  it('allows a citizen to update only their own profile fields', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'citizen-1'), citizenProfile('citizen-1'));
    });
    const db = testEnvironment.authenticatedContext('citizen-1', {
      email: 'citizen-1@example.com',
    }).firestore();

    await assertSucceeds(updateDoc(doc(db, 'users', 'citizen-1'), {
      displayName: 'Updated Citizen',
      phoneNumber: '+15557654321',
    }));
  });

  it('rejects reading and creating another user profile', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'citizen-2'), citizenProfile('citizen-2'));
    });
    const db = testEnvironment.authenticatedContext('citizen-1', {
      email: 'citizen-1@example.com',
    }).firestore();

    await assertFails(getDoc(doc(db, 'users', 'citizen-2')));
    await assertFails(setDoc(doc(db, 'users', 'citizen-2'), citizenProfile('citizen-2')));
  });

  it('rejects citizen role assignment and protected authorization changes', async () => {
    const db = testEnvironment.authenticatedContext('citizen-1', {
      email: 'citizen-1@example.com',
    }).firestore();
    const profileRef = doc(db, 'users', 'citizen-1');

    await assertFails(setDoc(profileRef, { ...citizenProfile('citizen-1'), role: 'admin' }));
    await assertSucceeds(setDoc(profileRef, citizenProfile('citizen-1')));
    await assertFails(updateDoc(profileRef, { role: 'admin' }));
    await assertFails(updateDoc(profileRef, { isVerifiedOfficer: true }));
  });

  it('allows a citizen to create their own complaint without a profile document', async () => {
    const uid = 'citizen-1';
    const id = 'CR-2026-CITIZEN-1';
    const db = testEnvironment.authenticatedContext(uid, {
      email: 'citizen-1@example.com',
    }).firestore();

    await assertSucceeds(setDoc(doc(db, 'complaints', id), complaintRecord(uid, id)));
    await assertFails(setDoc(
      doc(db, 'complaints', 'CR-2026-OTHER-UID'),
      complaintRecord('citizen-2', 'CR-2026-OTHER-UID')
    ));
    await assertFails(setDoc(
      doc(db, 'complaints', 'CR-2026-MISMATCH'),
      complaintRecord(uid, 'CR-2026-DIFFERENT-ID')
    ));
  });

  it('denies citizen creation and modification of officer assessments', async () => {
    const uid = 'citizen-1';
    const assessmentId = 'CR-2026-PRIVATE';
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'officerAssessments', assessmentId), {
        complaintId: assessmentId,
        citizenUid: uid,
        aiAnalysis: { priority: 'medium' },
        createdAt: '2026-03-01T10:00:00.000Z',
      });
    });
    const db = testEnvironment.authenticatedContext(uid, {
      email: 'citizen-1@example.com',
    }).firestore();

    await assertFails(setDoc(doc(db, 'officerAssessments', 'CR-2026-NEW'), {
      complaintId: 'CR-2026-NEW',
      citizenUid: uid,
      aiAnalysis: { priority: 'critical' },
      createdAt: '2026-03-01T10:00:00.000Z',
    }));
    await assertFails(updateDoc(doc(db, 'officerAssessments', assessmentId), {
      aiAnalysis: { priority: 'critical' },
    }));
  });

  it('allows a verified officer to create a private note record for an existing complaint', async () => {
    const complaintId = 'CR-2026-OFFICER-NOTE';
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'complaints', complaintId),
        complaintRecord('citizen-1', complaintId)
      );
      await setDoc(doc(context.firestore(), 'officers', 'officer-1'), { role: 'officer' });
    });
    const db = testEnvironment.authenticatedContext('officer-1', {
      email: 'officer@example.com',
    }).firestore();
    const timestamp = '2026-03-01T10:00:00.000Z';

    await assertSucceeds(setDoc(doc(db, 'officerAssessments', complaintId), {
      complaintId,
      citizenUid: 'citizen-1',
      officerNotes: [{
        id: 'note-1',
        actorUid: 'officer-1',
        actorName: 'Test Officer',
        timestamp,
        note: 'Dispatch team assigned.',
      }],
      updatedAt: timestamp,
    }));
  });

  it('restricts complaint reads to the owner or a verified officer', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'complaints', 'CR-2026-PRIVATE'), {
        citizenUid: 'citizen-1',
        title: 'Private address report',
      });
      await setDoc(doc(context.firestore(), 'officers', 'officer-1'), {
        role: 'officer',
      });
    });

    const ownerDb = testEnvironment.authenticatedContext('citizen-1', {
      email: 'citizen-1@example.com',
    }).firestore();
    const otherCitizenDb = testEnvironment.authenticatedContext('citizen-2', {
      email: 'citizen-2@example.com',
    }).firestore();
    const officerDb = testEnvironment.authenticatedContext('officer-1', {
      email: 'officer@example.com',
    }).firestore();
    const anonymousDb = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(ownerDb, 'complaints', 'CR-2026-PRIVATE')));
    await assertFails(getDoc(doc(otherCitizenDb, 'complaints', 'CR-2026-PRIVATE')));
    await assertFails(getDoc(doc(anonymousDb, 'complaints', 'CR-2026-PRIVATE')));
    await assertSucceeds(getDoc(doc(officerDb, 'complaints', 'CR-2026-PRIVATE')));
  });

  it('limits officer registry reads to the signed-in officer record', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'officers', 'officer-1'), { role: 'officer' });
      await setDoc(doc(context.firestore(), 'officers', 'officer-2'), { role: 'officer' });
    });
    const db = testEnvironment.authenticatedContext('officer-1').firestore();

    await assertSucceeds(getDoc(doc(db, 'officers', 'officer-1')));
    await assertFails(getDoc(doc(db, 'officers', 'officer-2')));
  });
});
