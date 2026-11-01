// created_date: 2025-08-13
// last_modified_date: 2026-11-01
// last_modified_summary: "Accounts on @bitbaum/accountkit: AuthProvider alone, no next-auth SessionProvider."

'use client';

import React from 'react';
import { AuthProvider } from './context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
