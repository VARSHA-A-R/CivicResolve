import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../services/authService';

const firebaseMocks = vi.hoisted(() => {
  const firebaseUser = {
    uid: 'user-123',
    email: 'user@example.com',
    displayName: 'Firebase Name',
    phoneNumber: null,
  };
  const db = {};
  const refs = {
    doc: vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(async () => ({ user: firebaseUser })),
    signInWithEmailAndPassword: vi.fn(async () => ({ user: firebaseUser })),
    updateProfile: vi.fn(),
  };
  return { firebaseUser, db, refs };
});

vi.mock('../services/firebase', () => ({
  auth: { currentUser: firebaseMocks.firebaseUser },
  db: firebaseMocks.db,
  isFirebaseConfigured: () => true,
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: firebaseMocks.refs.createUserWithEmailAndPassword,
  signInWithEmailAndPassword: firebaseMocks.refs.signInWithEmailAndPassword,
  signOut: vi.fn(),
  updateProfile: firebaseMocks.refs.updateProfile,
}));

vi.mock('firebase/firestore', () => ({
  doc: firebaseMocks.refs.doc,
  getDoc: firebaseMocks.refs.getDoc,
  setDoc: firebaseMocks.refs.setDoc,
  updateDoc: firebaseMocks.refs.updateDoc,
}));

const profileSnapshot = {
  exists: () => true,
  data: () => ({
    uid: 'user-123',
    email: 'user@example.com',
    displayName: 'Saved Name',
    phoneNumber: '+15551234567',
    role: 'citizen',
    createdAt: '2026-03-01T10:00:00.000Z',
  }),
};

describe('authService portal-specific authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMocks.refs.getDoc.mockImplementation(async (reference: { collection: string }) =>
      reference.collection === 'users'
        ? profileSnapshot
        : { exists: () => false, data: () => ({}) }
    );
    firebaseMocks.refs.signInWithEmailAndPassword.mockResolvedValue({
      user: firebaseMocks.firebaseUser,
    });
    firebaseMocks.refs.createUserWithEmailAndPassword.mockResolvedValue({
      user: firebaseMocks.firebaseUser,
    });
  });

  it('authenticates citizens and loads their profile without reading the officer registry', async () => {
    const profile = await authService.signIn('user@example.com', 'password');

    expect(profile).toMatchObject({
      uid: 'user-123',
      displayName: 'Saved Name',
      phoneNumber: '+15551234567',
      role: 'citizen',
      isVerifiedOfficer: false,
    });
    expect(firebaseMocks.refs.doc).toHaveBeenCalledWith(firebaseMocks.db, 'users', 'user-123');
    expect(firebaseMocks.refs.doc).not.toHaveBeenCalledWith(firebaseMocks.db, 'officers', 'user-123');
    expect(firebaseMocks.refs.getDoc).toHaveBeenCalledOnce();
  });

  it('authenticates and authorizes an officer only through the officer registry', async () => {
    firebaseMocks.refs.getDoc.mockImplementation(async (reference: { collection: string }) =>
      reference.collection === 'officers'
        ? { exists: () => true, data: () => ({}) }
        : profileSnapshot
    );

    const profile = await authService.signInOfficer('user@example.com', 'password');

    expect(profile).toMatchObject({
      uid: 'user-123',
      role: 'admin',
      isVerifiedOfficer: true,
    });
    expect(firebaseMocks.refs.doc).toHaveBeenCalledWith(firebaseMocks.db, 'officers', 'user-123');
  });

  it.each([
    ['permission-denied', 'Missing or insufficient permissions.'],
    ['unavailable', 'The network is unavailable.'],
  ])('surfaces officer Firestore errors (%s)', async (code, message) => {
    const firestoreError = Object.assign(new Error(message), { code });
    firebaseMocks.refs.getDoc.mockRejectedValueOnce(firestoreError);

    await expect(authService.signInOfficer('user@example.com', 'password'))
      .rejects.toThrow(`Officer authorization lookup failed (${code}): ${message}`);
  });

  it('creates a citizen profile with the required fields and normalized phone number', async () => {
    const profile = await authService.signUp(
      'user@example.com',
      'password',
      'Full Name',
      '+1 (555) 123-4567'
    );

    expect(profile.profileComplete).toBe(true);
    expect(firebaseMocks.refs.doc).toHaveBeenCalledWith(firebaseMocks.db, 'users', 'user-123');
    expect(firebaseMocks.refs.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', id: 'user-123' }),
      expect.objectContaining({
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'Full Name',
        phoneNumber: '+15551234567',
        role: 'citizen',
      })
    );
  });

  it('recovers a missing profile for the signed-in user without creating another auth account', async () => {
    firebaseMocks.refs.getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce(profileSnapshot);

    const profile = await authService.completeCitizenProfile('Recovered Name', '+1 (555) 123-4567');

    expect(profile.profileComplete).toBe(true);
    expect(firebaseMocks.refs.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', id: 'user-123' }),
      expect.objectContaining({
        uid: 'user-123',
        displayName: 'Recovered Name',
        phoneNumber: '+15551234567',
        role: 'citizen',
      })
    );
    expect(firebaseMocks.refs.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('preserves profile-write errors after auth creation and allows sign-in recovery', async () => {
    const permissionError = Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied',
    });
    firebaseMocks.refs.setDoc.mockRejectedValueOnce(permissionError);

    const incompleteProfile = await authService.signUp(
      'user@example.com',
      'password',
      'Full Name',
      '+1 (555) 123-4567'
    );

    expect(incompleteProfile.profileComplete).toBe(false);
    expect(incompleteProfile.profileError).toContain('permission-denied');

    firebaseMocks.refs.getDoc.mockRejectedValueOnce(permissionError);
    const recoveredSession = await authService.signIn('user@example.com', 'password');

    expect(recoveredSession.profileComplete).toBe(false);
    expect(recoveredSession.profileError).toContain('permission-denied');
    expect(firebaseMocks.refs.createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    expect(firebaseMocks.refs.signInWithEmailAndPassword).toHaveBeenCalledOnce();
  });

  it('updates only citizen-editable fields when an incomplete profile already exists', async () => {
    firebaseMocks.refs.getDoc
      .mockResolvedValueOnce(profileSnapshot)
      .mockResolvedValueOnce({
        ...profileSnapshot,
        data: () => ({
          ...profileSnapshot.data(),
          displayName: 'Updated Name',
          phoneNumber: '+15557654321',
        }),
      });

    const profile = await authService.completeCitizenProfile('Updated Name', '+1 (555) 765-4321');

    expect(profile.profileComplete).toBe(true);
    expect(firebaseMocks.refs.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', id: 'user-123' }),
      { displayName: 'Updated Name', phoneNumber: '+15557654321' }
    );
  });
});
