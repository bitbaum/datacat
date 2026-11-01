'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SignInMethods } from '@bitbaum/accountkit/auth';
import type { AuthLabels } from '@bitbaum/accountkit/auth/react';
import { authClient } from '@/lib/auth-client';
import { ROUTES } from '@/lib/routes';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** The API token for /api/v1/* and the Express backend (src/server/auth/api-token.ts). */
  token: string | null;
  /** Which ways in this deployment offers, for a sign-in form outside a page. */
  methods: SignInMethods | null;
  labels: AuthLabels | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AccountAnswer {
  user: User | null;
  token: string | null;
  methods: SignInMethods;
  labels: AuthLabels;
}

/**
 * The signed-in person, read from /api/account (AccountKit's session plus
 * the product row). Re-read on every navigation, so a sign-in or sign-out
 * anywhere shows at once.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [answer, setAnswer] = useState<AccountAnswer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetch('/api/account', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<AccountAnswer>) : null))
      .catch(() => null)
      .then((value) => {
        if (!live) return;
        setAnswer(value);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [pathname]);

  const logout = useCallback(async () => {
    await authClient.signOut().catch(() => undefined);
    setAnswer((current) => (current ? { ...current, user: null, token: null } : current));
    router.push(ROUTES.login);
    router.refresh();
  }, [router]);

  const value: AuthContextType = {
    user: answer?.user ?? null,
    loading,
    isAuthenticated: Boolean(answer?.user),
    token: answer?.token ?? null,
    methods: answer?.methods ?? null,
    labels: answer?.labels ?? null,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
