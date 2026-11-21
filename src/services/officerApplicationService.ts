import { doc, getDoc, setDoc, type DocumentSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { describeFirestoreError, normalizePhoneNumber } from './authService';
import type { OfficerApplication } from '../types';

function requireApplicant(uid: string): {
  currentUser: NonNullable<NonNullable<typeof auth>['currentUser']>;
  firestoreDb: NonNullable<typeof db>;
} {
  const currentUser = auth?.currentUser;
  const firestoreDb = db;
  if (!isFirebaseConfigured() || !firestoreDb || !currentUser || currentUser.uid !== uid) {
    throw new Error('Sign in to your account before managing an officer application.');
  }
  return { currentUser, firestoreDb };
}

export async function getOfficerApplication(uid: string): Promise<OfficerApplication | null> {
  const { firestoreDb } = requireApplicant(uid);
  let applicationSnapshot: DocumentSnapshot;
  try {
    applicationSnapshot = await getDoc(doc(firestoreDb, 'officerApplications', uid));
  } catch (error) {
    throw new Error(describeFirestoreError('Officer application lookup failed', error));
  }
  if (!applicationSnapshot.exists()) return null;

  const application = applicationSnapshot.data();
  const status = application.status;
  if (
    application.uid !== uid
    || (status !== 'pending' && status !== 'approved' && status !== 'rejected')
    || typeof application.fullName !== 'string'
    || typeof application.email !== 'string'
    || typeof application.phoneNumber !== 'string'
    || typeof application.department !== 'string'
    || typeof application.reason !== 'string'
    || typeof application.createdAt !== 'string'
  ) {
    throw new Error('The saved officer application has an invalid format. Contact your system administrator.');
  }
  return {
    uid,
    fullName: application.fullName,
    email: application.email,
    phoneNumber: application.phoneNumber,
    department: application.department,
    reason: application.reason,
    status,
    createdAt: application.createdAt,
  };
}

export async function submitOfficerApplication(
  uid: string,
  application: Pick<OfficerApplication, 'fullName' | 'phoneNumber' | 'department' | 'reason'>
): Promise<void> {
  const { currentUser, firestoreDb } = requireApplicant(uid);
  const fullName = application.fullName.trim();
  const phoneNumber = normalizePhoneNumber(application.phoneNumber);
  const department = application.department.trim();
  const reason = application.reason.trim();

  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error('Enter your full name (2 to 120 characters).');
  }
  if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
    throw new Error('Enter a valid phone number containing 7 to 15 digits.');
  }
  if (department.length < 2 || department.length > 120) {
    throw new Error('Enter the municipal department you work with (2 to 120 characters).');
  }
  if (reason.length < 20 || reason.length > 2000) {
    throw new Error('Explain your request in 20 to 2,000 characters.');
  }

  const applicationRef = doc(firestoreDb, 'officerApplications', uid);
  let existingApplication: DocumentSnapshot;
  try {
    existingApplication = await getDoc(applicationRef);
  } catch (error) {
    throw new Error(describeFirestoreError('Officer application lookup failed', error));
  }
  if (existingApplication.exists()) {
    throw new Error('An officer application already exists for this account.');
  }

  const record: OfficerApplication = {
    uid,
    fullName,
    email: currentUser.email || '',
    phoneNumber,
    department,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(applicationRef, record);
  } catch (error) {
    throw new Error(describeFirestoreError('Officer application submission failed', error));
  }
}
