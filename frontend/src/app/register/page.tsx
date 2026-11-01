import { redirect } from 'next/navigation';
import { authLabelsFor, signInMethods } from '@bitbaum/accountkit/auth';
import { returnPath } from '@bitbaum/accountkit/orangecat';
import { DataCatSignUp } from '../components/AccountScreens';
import { ROUTES } from '@/lib/routes';
import { getSessionUser } from '@/lib/session';
import { authMailer } from '@/server/auth/runtime';

export const dynamic = 'force-dynamic';

/** A DataCat account, in one step: AccountKit's sign-up form. */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = returnPath((await searchParams).next, ROUTES.builder);
  if (await getSessionUser()) redirect(next);
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Konto erstellen
        </h2>
        <DataCatSignUp
          labels={authLabelsFor('de')}
          methods={signInMethods(process.env, authMailer.configured)}
          next={next}
        />
      </div>
    </div>
  );
}
