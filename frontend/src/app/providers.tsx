// created_date: 2025-08-13
// last_modified_date: 2025-08-13
// last_modified_summary: "Add client Providers wrapper for SessionProvider and AuthProvider to fix Server Components context error."

'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from './context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
