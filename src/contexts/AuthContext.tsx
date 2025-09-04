import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    if (!auth) throw new Error('Firebase auth not configured');
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string) {
    if (!auth) throw new Error('Firebase auth not configured');
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (!auth) throw new Error('Firebase auth not configured');
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    if (!auth) throw new Error('Firebase auth not configured');
    await sendPasswordResetEmail(auth, email);
  }

  async function updateUserPassword(newPassword: string) {
    if (!auth || !currentUser) throw new Error('No authenticated user');
    await updatePassword(currentUser, newPassword);
  }

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    updateUserPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
