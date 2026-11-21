import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

const authMocks = vi.hoisted(() => ({
  listener: null as ((
    user: {
      uid: string;
      email: string | null;
      displayName: string | null;
      phoneNumber: string | null;
    } | null
  ) => Promise<void>) | null,
  onAuthStateChanged: vi.fn(),
  getAuthenticatedUserProfile: vi.fn(),
  verifyOfficerInFirestore: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
  auth: { currentUser: null },
  isFirebaseConfigured: () => true,
}));

vi.mock('../services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    signInOfficer: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    completeCitizenProfile: vi.fn(),
  },
  getAuthenticatedUserProfile: authMocks.getAuthenticatedUserProfile,
  verifyOfficerInFirestore: authMocks.verifyOfficerInFirestore,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: authMocks.onAuthStateChanged,
}));

const AuthStateDisplay = () => {
  const { user, loading, authError, isVerifiedOfficer } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.displayName || 'none'}</span>
      <span data-testid="officer">{String(isVerifiedOfficer)}</span>
      <span data-testid="error">{authError || 'none'}</span>
    </div>
  );
};

const signedInUser = {
  uid: 'citizen-1',
  email: 'citizen@example.com',
  displayName: 'Firebase Citizen',
  phoneNumber: null,
};

describe('AuthProvider authentication state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.listener = null;
    authMocks.onAuthStateChanged.mockImplementation((_auth, listener) => {
      authMocks.listener = listener;
      return vi.fn();
    });
    authMocks.getAuthenticatedUserProfile.mockResolvedValue({
      uid: 'citizen-1',
      email: 'citizen@example.com',
      displayName: 'Saved Citizen',
      phoneNumber: '+15551234567',
      role: 'citizen',
      profileComplete: true,
    });
  });

  it('loads a citizen profile without checking the officer registry', async () => {
    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );

    await act(async () => {
      await authMocks.listener?.(signedInUser);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('Saved Citizen');
    expect(screen.getByTestId('officer')).toHaveTextContent('false');
    expect(authMocks.verifyOfficerInFirestore).not.toHaveBeenCalled();
  });

  it('ends loading and reports profile Firestore errors', async () => {
    authMocks.getAuthenticatedUserProfile.mockRejectedValue(
      new Error('Citizen profile lookup failed (permission-denied): Missing or insufficient permissions.')
    );

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );

    await act(async () => {
      await authMocks.listener?.(signedInUser);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent(/permission-denied/i);
    expect(authMocks.verifyOfficerInFirestore).not.toHaveBeenCalled();
  });
});
