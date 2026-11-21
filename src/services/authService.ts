import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, type DocumentSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import type { UserProfile } from '../types';

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.trim().replace(/[^\d+]/g, '');
}

export function describeFirestoreError(action: string, error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';
  const detail = error instanceof Error ? error.message : 'Unknown Firestore error.';
  return `${action}${code ? ` (${code})` : ''}: ${detail}`;
}

async function authenticate(email: string, pass: string): Promise<FirebaseUser> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Configure the Firebase environment before signing in.');
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

type SavedUserProfile = Partial<Pick<UserProfile, 'displayName' | 'phoneNumber'>> & {
  profileComplete: boolean;
};

async function loadUserProfile(firebaseUser: FirebaseUser, fallbackEmail: string): Promise<UserProfile> {
  let savedProfile: SavedUserProfile;
  let profileError: string | undefined;
  try {
    savedProfile = await getSavedUserProfile(firebaseUser.uid);
  } catch (error) {
    profileError = error instanceof Error ? error.message : 'Citizen profile lookup failed.';
    savedProfile = { profileComplete: false };
  }
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || fallbackEmail,
    displayName: savedProfile.displayName || firebaseUser.displayName || 'Citizen',
    phoneNumber: savedProfile.phoneNumber || firebaseUser.phoneNumber || undefined,
    role: 'citizen',
    isVerifiedOfficer: false,
    profileComplete: savedProfile.profileComplete,
    ...(profileError ? { profileError } : {}),
  };
}

export async function getAuthenticatedUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
  return loadUserProfile(firebaseUser, firebaseUser.email || '');
}

/**
 * Checks Firestore /officers collection to securely verify
 * if the authenticated user has verified municipal officer privileges.
 * This guarantees the client cannot spoof its role.
 */
export async function verifyOfficerInFirestore(uid: string, _email?: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  if (!db) {
    throw new Error('Officer access verification failed (unavailable): Firestore is not initialized.');
  }
  try {
    const officerRef = doc(db, 'officers', uid);
    const snap = await getDoc(officerRef);
    return snap.exists();
  } catch (e) {
    const message = describeFirestoreError('Officer authorization lookup failed', e);
    console.error('[CivicResolve]', message);
    throw new Error(message);
  }
}

export async function getSavedUserProfile(
  uid: string
): Promise<SavedUserProfile> {
  if (!isFirebaseConfigured()) {
    return { profileComplete: false };
  }
  if (!db) {
    throw new Error('Citizen profile lookup failed (unavailable): Firestore is not initialized.');
  }
  let profileSnapshot: DocumentSnapshot;
  try {
    profileSnapshot = await getDoc(doc(db, 'users', uid));
  } catch (error) {
    throw new Error(describeFirestoreError('Citizen profile lookup failed', error));
  }
  if (!profileSnapshot.exists()) return { profileComplete: false };

  const profile = profileSnapshot.data();
  const phoneNumber = typeof profile.phoneNumber === 'string' ? profile.phoneNumber : undefined;
  const normalizedPhone = phoneNumber ? normalizePhoneNumber(phoneNumber) : '';
  const profileComplete = profile.uid === uid
    && typeof profile.email === 'string'
    && profile.email.length > 0
    && typeof profile.displayName === 'string'
    && profile.displayName.trim().length >= 2
    && typeof phoneNumber === 'string'
    && phoneNumber === normalizedPhone
    && /^\+?\d{7,15}$/.test(phoneNumber)
    && profile.role === 'citizen'
    && typeof profile.createdAt === 'string';
  return {
    ...(typeof profile.displayName === 'string' ? { displayName: profile.displayName } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
    profileComplete,
  };
}

export const authService = {
  /**
   * Register a new citizen account with email & password
   */
  async signUp(
    email: string,
    pass: string,
    displayName: string,
    phoneNumber: string = ''
  ): Promise<UserProfile> {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase Authentication is not configured. Configure the Firebase environment before creating an account.');
    }
    const cleanName = displayName.trim();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!cleanName) throw new Error('Enter your full name.');
    if (!/^\+?\d{7,15}$/.test(normalizedPhone)) {
      throw new Error('Enter a valid phone number containing 7 to 15 digits.');
    }

    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: cleanName,
      phoneNumber: normalizedPhone,
      role: 'citizen',
      isVerifiedOfficer: false,
      profileComplete: true,
    };

    try {
      if (!db) throw new Error('Firestore is not configured.');
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: profile.email,
        displayName: profile.displayName,
        phoneNumber: normalizedPhone,
        role: 'citizen',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      const profileError = describeFirestoreError('Citizen profile creation failed', error);
      console.error(
        '[CivicResolve]',
        profileError,
        error instanceof Error ? error.name : 'UnknownError'
      );
      return { ...profile, profileComplete: false, profileError };
    }

    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch (error) {
      console.warn(
        '[CivicResolve] Profile is saved, but Firebase Auth display name could not be updated.',
        error instanceof Error ? error.name : 'UnknownError'
      );
    }

    return profile;
  },

  /**
   * Sign in existing user with email & password
   */
  async signIn(email: string, pass: string): Promise<UserProfile> {
    const firebaseUser = await authenticate(email, pass);
    return loadUserProfile(firebaseUser, email);
  },

  /**
   * Authenticate through the officer portal, then verify the server-managed registry.
   */
  async signInOfficer(email: string, pass: string): Promise<UserProfile> {
    const firebaseUser = await authenticate(email, pass);
    const isOfficer = await verifyOfficerInFirestore(firebaseUser.uid);
    const citizenProfile = await loadUserProfile(firebaseUser, email);
    return {
      ...citizenProfile,
      displayName: citizenProfile.displayName || (isOfficer ? 'Municipal Officer' : 'Citizen'),
      role: isOfficer ? 'admin' : 'citizen',
      isVerifiedOfficer: isOfficer,
    };
  },

  async completeCitizenProfile(displayName: string, phoneNumber: string): Promise<UserProfile> {
    if (!isFirebaseConfigured() || !auth?.currentUser || !db) {
      throw new Error('Citizen profile save failed (unavailable): Sign in and check the Firestore configuration.');
    }
    const firebaseUser = auth.currentUser;
    const cleanName = displayName.trim();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!cleanName || cleanName.length > 120) {
      throw new Error('Enter your full name (1 to 120 characters).');
    }
    if (!/^\+?\d{7,15}$/.test(normalizedPhone)) {
      throw new Error('Enter a valid phone number containing 7 to 15 digits.');
    }
    if (!firebaseUser.email) {
      throw new Error('Citizen profile save failed: the authenticated account has no email address.');
    }

    const profileRef = doc(db, 'users', firebaseUser.uid);
    let profileSnapshot: DocumentSnapshot;
    try {
      profileSnapshot = await getDoc(profileRef);
    } catch (error) {
      throw new Error(describeFirestoreError('Citizen profile recovery lookup failed', error));
    }

    try {
      if (profileSnapshot.exists()) {
        await updateDoc(profileRef, {
          displayName: cleanName,
          phoneNumber: normalizedPhone,
        });
      } else {
        await setDoc(profileRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: cleanName,
          phoneNumber: normalizedPhone,
          role: 'citizen',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      throw new Error(describeFirestoreError('Citizen profile save failed', error));
    }

    const profile = await loadUserProfile(firebaseUser, firebaseUser.email);
    if (!profile.profileComplete) {
      throw new Error(profile.profileError || 'The citizen profile is still incomplete after saving.');
    }
    return { ...profile, displayName: cleanName, phoneNumber: normalizedPhone };
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (isFirebaseConfigured() && auth) {
      await fbSignOut(auth);
    }
  },
};
