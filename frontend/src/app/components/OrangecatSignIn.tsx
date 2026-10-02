'use client';

import React, { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from './Button';

// Mirrors ORANGECAT_PROVIDER_ID in src/server/auth/orangecat.ts — that module is
// server-only (it reads the client secret), so the id is restated, not imported.
const PROVIDER_ID = 'orangecat';

/**
 * Whether the server offers "Sign in with OrangeCat". The provider is absent
 * until the box holds its client credentials, so the page asks rather than
 * assumes: `null` while unknown, then true/false.
 */
export function useOrangecatAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    getProviders()
      .then((providers) => live && setAvailable(Boolean(providers?.[PROVIDER_ID])))
      .catch(() => live && setAvailable(false));
    return () => {
      live = false;
    };
  }, []);
  return available;
}

interface OrangecatSignInProps {
  label: string;
  hint: string;
  /** Where to land afterwards; next-auth defaults to the current page. */
  callbackUrl?: string;
}

/** The primary way into datacat: one button, via the app's primary Button. */
export function OrangecatSignIn({ label, hint, callbackUrl }: OrangecatSignInProps) {
  const [pending, setPending] = useState(false);
  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full min-h-11"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void signIn(PROVIDER_ID, callbackUrl ? { callbackUrl } : undefined);
        }}
      >
        {pending ? 'Weiterleitung zu OrangeCat…' : label}
      </Button>
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">{hint}</p>
    </div>
  );
}

interface AuthChoicesProps extends OrangecatSignInProps {
  /** Label of the disclosure that holds the email + password form. */
  passwordLabel: string;
  /** The email + password form — secondary whenever OrangeCat is offered. */
  children: React.ReactNode;
}

/**
 * OrangeCat first; the password form behind a disclosure. Where the server does
 * not offer OrangeCat (no client credentials, e.g. local dev) the password form
 * is the way in and is shown as it always was.
 */
export function AuthChoices({ passwordLabel, children, ...orangecat }: AuthChoicesProps) {
  const available = useOrangecatAvailable();
  if (available === false) return <>{children}</>;
  return (
    <div className="space-y-6">
      {available ? <OrangecatSignIn {...orangecat} /> : <div aria-hidden className="h-20" />}
      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          {passwordLabel}
        </summary>
        <div className="pt-2">{children}</div>
      </details>
    </div>
  );
}
