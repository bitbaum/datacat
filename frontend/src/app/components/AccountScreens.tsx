'use client';

import Link from 'next/link';
import {
  AccountPanel,
  SignInForm,
  SignUpForm,
  type AuthClasses,
  type AuthLabels,
} from '@bitbaum/accountkit/auth/react';
import type { SignInMethods } from '@bitbaum/accountkit/auth';
import { authClient } from '@/lib/auth-client';
import { ROUTES } from '@/lib/routes';

/**
 * The fleet's account screens (@bitbaum/accountkit/auth/react) in DataCat's
 * look, light and dark. The logic and the words are the package's; the words
 * come from the server (`authLabelsFor('de')` reads node:crypto, so it never
 * enters the browser bundle).
 */
const field =
  'block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white';

const CLASSES: Partial<AuthClasses> = {
  stack: 'flex flex-col gap-5',
  field: 'flex flex-col gap-2',
  label: 'text-sm font-medium text-gray-700 dark:text-gray-200',
  hint: 'text-sm text-gray-600 dark:text-gray-400',
  input: field,
  inputWrap: 'relative',
  reveal:
    'absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-300',
  button:
    'flex min-h-11 w-full items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400',
  buttonQuiet:
    'flex min-h-11 w-full items-center justify-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600',
  notice:
    'rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
  error:
    'rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  divider:
    'flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500 before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200 dark:before:bg-gray-700 dark:after:bg-gray-700',
  section: 'flex flex-col gap-4 border-t border-gray-200 pt-8 dark:border-gray-700',
  sectionTitle: 'text-lg font-semibold text-gray-900 dark:text-white',
  link: 'break-all font-medium text-indigo-600 hover:text-indigo-500',
  check: 'flex min-h-11 items-center gap-3 text-sm text-gray-700 dark:text-gray-200',
};

const textLink = 'font-medium text-indigo-600 hover:text-indigo-500';

export function DataCatSignIn(props: {
  labels: AuthLabels;
  methods: SignInMethods;
  next: string;
  initialError?: boolean;
}) {
  const { labels } = props;
  return (
    <SignInForm
      client={authClient}
      classes={CLASSES}
      labels={labels}
      methods={props.methods}
      next={props.next}
      signInPath={ROUTES.login}
      initialError={props.initialError}
      signUpLink={
        <Link href={ROUTES.register} className={textLink}>
          {labels.createAccount}
        </Link>
      }
    />
  );
}

export function DataCatSignUp(props: { labels: AuthLabels; methods: SignInMethods; next: string }) {
  const { labels } = props;
  return (
    <SignUpForm
      client={authClient}
      classes={CLASSES}
      labels={labels}
      methods={props.methods}
      next={props.next}
      signUpPath={ROUTES.register}
      signInPath={ROUTES.login}
      signInLink={
        <Link href={ROUTES.login} className={textLink}>
          {labels.signIn}
        </Link>
      }
    />
  );
}

export function DataCatAccount(props: {
  labels: AuthLabels;
  methods: SignInMethods;
  user: {
    name: string;
    email: string | null;
    emailVerified: boolean;
    role: string;
    twoFactorEnabled: boolean;
  };
  linked: string[];
}) {
  return (
    <AccountPanel
      client={authClient}
      classes={CLASSES}
      accountPath={ROUTES.account}
      homePath={ROUTES.home}
      {...props}
    />
  );
}
