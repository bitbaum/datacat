'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import type { SignInMethods } from '@bitbaum/accountkit/auth';
import type { AuthLabels } from '@bitbaum/accountkit/auth/react';
import { useAuth } from '../context/AuthContext';
import { DataCatSignIn } from './AccountScreens';

interface LoginFormProps {
  /** Additional styling on the card. */
  className?: string;
  /** Where a sign-in lands; defaults to the current page. */
  callbackUrl?: string;
  /** The ways in, from the server. Without them, the ones /api/account reported. */
  methods?: SignInMethods;
  /** The words, from the server. Without them, the ones /api/account sent. */
  labels?: AuthLabels;
  initialError?: boolean;
}

/** Every way in, on one card: AccountKit's sign-in form. */
export function LoginForm({
  className = '',
  callbackUrl,
  methods,
  labels,
  initialError,
}: LoginFormProps) {
  const pathname = usePathname();
  const context = useAuth();
  const offered = methods ?? context.methods;
  const words = labels ?? context.labels;
  return (
    <div
      className={`w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800 ${className}`}
    >
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Anmelden</h2>
      {offered && words ? (
        <DataCatSignIn
          labels={words}
          methods={offered}
          next={callbackUrl ?? pathname ?? '/'}
          initialError={initialError}
        />
      ) : (
        <div aria-hidden className="h-40" />
      )}
    </div>
  );
}
