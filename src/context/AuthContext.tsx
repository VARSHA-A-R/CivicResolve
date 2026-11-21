import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: 'citizen' | 'admin';
  loading: boolean;
  switchRole: (role: 'citizen' | 'admin') => void;
  loginAsCitizenDemo: () => void;
  loginAsAdminDemo: () => void;
  logout: () => Promise<void>;
  isFirebaseActive: boolean;
}

const DEFAULT_CITIZEN: UserProfile = {
  uid: 'citizen-demo-01',
  email: 'citizen@civicresolve.gov',
  displayName: 'Aarav Sharma',
  role: 'citizen',
  phoneNumber: '+91 98450 12345',
};

const DEFAULT_ADMIN: UserProfile = {
  uid: 'officer-admin-01',
  email: 'ward.officer@civicresolve.gov',
  displayName: 'Er. Rajesh Kumar',
  role: 'admin',
  department: 'Roads & Infrastructure',
  phoneNumber: '+91 94480 88220',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_CITIZEN);
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const isAdmin = firebaseUser.email?.includes('admin') || firebaseUser.email?.includes('officer');
          const detectedRole = isAdmin ? 'admin' : 'citizen';
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || (isAdmin ? 'Municipal Officer' : 'Citizen User'),
            role: detectedRole,
          });
          setRole(detectedRole);
        } else {
          // Keep demo citizen logged in for frictionless hackathon evaluation
          setUser(DEFAULT_CITIZEN);
          setRole('citizen');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Offline / Hackathon preview mode
      const savedRole = localStorage.getItem('civicresolve_user_role') as 'citizen' | 'admin' | null;
      if (savedRole === 'admin') {
        setUser(DEFAULT_ADMIN);
        setRole('admin');
      } else {
        setUser(DEFAULT_CITIZEN);
        setRole('citizen');
      }
      setLoading(false);
    }
  }, []);

  const switchRole = (newRole: 'citizen' | 'admin') => {
    setRole(newRole);
    localStorage.setItem('civicresolve_user_role', newRole);
    if (newRole === 'admin') {
      setUser(DEFAULT_ADMIN);
    } else {
      setUser(DEFAULT_CITIZEN);
    }
  };

  const loginAsCitizenDemo = () => {
    switchRole('citizen');
  };

  const loginAsAdminDemo = () => {
    switchRole('admin');
  };

  const logout = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Firebase signout error:', err);
      }
    }
    // Reset to citizen demo
    switchRole('citizen');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        switchRole,
        loginAsCitizenDemo,
        loginAsAdminDemo,
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
