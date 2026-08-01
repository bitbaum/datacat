'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { signOut, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await signIn('credentials', { redirect: false, email, password });
    if (res?.ok) {
      router.push('/builder');
      return true;
    }
    return false;
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const value: AuthContextType = {
    user: (session?.user as any) || null,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    token: session?.accessToken || null,
    loginWithCredentials,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};