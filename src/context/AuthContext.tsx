import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  authService,
  getAuthenticatedUserProfile,
  verifyOfficerInFirestore,
} from '../services/authService';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: 'citizen' | 'admin';
  loading: boolean;
  isVerifiedOfficer: boolean;
  authError: string | null;
  signIn: (email: string, pass: string) => Promise<UserProfile>;
  signInOfficer: (email: string, pass: string) => Promise<UserProfile>;
  verifyOfficerAccess: () => Promise<boolean>;
  completeCitizenProfile: (displayName: string, phoneNumber: string) => Promise<UserProfile>;
  signUp: (email: string, pass: string, displayName: string, phoneNumber?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [loading, setLoading] = useState<boolean>(true);
  const [isVerifiedOfficer, setIsVerifiedOfficer] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const verifiedOfficerUid = useRef<string | null>(null);
  const profileErrorsByUid = useRef(new Map<string, string>());

  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      let isActive = true;
      let latestAuthChange = 0;
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        const changeId = ++latestAuthChange;
        if (firebaseUser) {
          try {
            const authenticatedProfile = await getAuthenticatedUserProfile(firebaseUser);
            if (!isActive || changeId !== latestAuthChange) return;
            const isOfficer = verifiedOfficerUid.current === firebaseUser.uid;
            const profile: UserProfile = {
              ...authenticatedProfile,
              ...(profileErrorsByUid.current.has(firebaseUser.uid)
                && !authenticatedProfile.profileComplete
                ? { profileError: profileErrorsByUid.current.get(firebaseUser.uid) }
                : {}),
              role: isOfficer ? 'admin' : 'citizen',
              isVerifiedOfficer: isOfficer,
            };
            setUser(profile);
            setRole(profile.role);
            setIsVerifiedOfficer(isOfficer);
            setAuthError(profile.profileError || null);
          } catch (error) {
            if (!isActive || changeId !== latestAuthChange) return;
            const isOfficer = verifiedOfficerUid.current === firebaseUser.uid;
            const profileError = error instanceof Error ? error.message : 'Citizen profile lookup failed.';
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Citizen',
              phoneNumber: firebaseUser.phoneNumber || undefined,
              role: isOfficer ? 'admin' : 'citizen',
              isVerifiedOfficer: isOfficer,
              profileComplete: false,
              profileError,
            });
            setRole(isOfficer ? 'admin' : 'citizen');
            setIsVerifiedOfficer(isOfficer);
            setAuthError(profileError);
          } finally {
            if (isActive && changeId === latestAuthChange) setLoading(false);
          }
        } else {
          if (!isActive || changeId !== latestAuthChange) return;
          setUser(null);
          setRole('citizen');
          setIsVerifiedOfficer(false);
          verifiedOfficerUid.current = null;
          setAuthError(null);
          setLoading(false);
        }
      });
      return () => {
        isActive = false;
        unsubscribe();
      };
    } else {
      setUser(null);
      setRole('citizen');
      setIsVerifiedOfficer(false);
      verifiedOfficerUid.current = null;
      setAuthError(null);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<UserProfile> => {
    verifiedOfficerUid.current = null;
    setAuthError(null);
    const profile = await authService.signIn(email, pass);
    if (profile.profileError) profileErrorsByUid.current.set(profile.uid, profile.profileError);
    else profileErrorsByUid.current.delete(profile.uid);
    setUser(profile);
    setRole(profile.role);
    setIsVerifiedOfficer(Boolean(profile.isVerifiedOfficer));
    setAuthError(profile.profileError || null);
    return profile;
  };

  const signInOfficer = async (email: string, pass: string): Promise<UserProfile> => {
    verifiedOfficerUid.current = null;
    setAuthError(null);
    const profile = await authService.signInOfficer(email, pass);
    if (profile.profileError) profileErrorsByUid.current.set(profile.uid, profile.profileError);
    else profileErrorsByUid.current.delete(profile.uid);
    if (profile.isVerifiedOfficer) verifiedOfficerUid.current = profile.uid;
    setUser(profile);
    setRole(profile.role);
    setIsVerifiedOfficer(Boolean(profile.isVerifiedOfficer));
    setAuthError(profile.profileError || null);
    return profile;
  };

  const verifyOfficerAccess = useCallback(async (): Promise<boolean> => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) throw new Error('Sign in before opening the Officer Portal.');
    try {
      const isOfficer = await verifyOfficerInFirestore(firebaseUser.uid);
      if (isOfficer) verifiedOfficerUid.current = firebaseUser.uid;
      else if (verifiedOfficerUid.current === firebaseUser.uid) verifiedOfficerUid.current = null;
      setUser((currentUser) => currentUser?.uid === firebaseUser.uid
        ? { ...currentUser, role: isOfficer ? 'admin' : 'citizen', isVerifiedOfficer: isOfficer }
        : currentUser);
      setRole(isOfficer ? 'admin' : 'citizen');
      setIsVerifiedOfficer(isOfficer);
      setAuthError(null);
      return isOfficer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Officer authorization could not be verified.';
      setAuthError(message);
      throw error;
    }
  }, []);

  const completeCitizenProfile = async (
    displayName: string,
    phoneNumber: string
  ): Promise<UserProfile> => {
    const profile = await authService.completeCitizenProfile(displayName, phoneNumber);
    profileErrorsByUid.current.delete(profile.uid);
    setUser(profile);
    setAuthError(null);
    return profile;
  };

  const signUp = async (
    email: string,
    pass: string,
    displayName: string,
    phoneNumber?: string
  ): Promise<UserProfile> => {
    verifiedOfficerUid.current = null;
    const profile = await authService.signUp(email, pass, displayName, phoneNumber);
    if (profile.profileError) profileErrorsByUid.current.set(profile.uid, profile.profileError);
    else profileErrorsByUid.current.delete(profile.uid);
    setUser(profile);
    setRole(profile.role);
    setIsVerifiedOfficer(Boolean(profile.isVerifiedOfficer));
    setAuthError(profile.profileError || null);
    return profile;
  };

  const logout = async () => {
    await authService.signOut();
    verifiedOfficerUid.current = null;
    setUser(null);
    setRole('citizen');
    setIsVerifiedOfficer(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isVerifiedOfficer,
        authError,
        signIn,
        signInOfficer,
        verifyOfficerAccess,
        completeCitizenProfile,
        signUp,
        logout,
        isFirebaseActive: isFirebaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
