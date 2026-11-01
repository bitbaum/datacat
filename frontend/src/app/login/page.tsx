import { redirect } from 'next/navigation';
import { authLabelsFor, signInMethods } from '@bitbaum/accountkit/auth';
import { returnPath } from '@bitbaum/accountkit/orangecat';
import { LoginForm } from '../components/LoginForm';
import { ROUTES } from '@/lib/routes';
import { getSessionUser } from '@/lib/session';
import { authMailer } from '@/server/auth/runtime';

export const dynamic = 'force-dynamic';

/** Every way in: password, link, passkey, OrangeCat, the shared sign-in. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; token?: string }>;
}) {
  const query = await searchParams;
  const next = returnPath(query.next, ROUTES.builder);
  // A reset link lands here with its token: show the form even when signed in.
  if (!query.token && (await getSessionUser())) redirect(next);
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50 dark:bg-gray-900">
      <LoginForm
        labels={authLabelsFor('de')}
        callbackUrl={next}
        methods={signInMethods(process.env, authMailer.configured)}
        initialError={Boolean(query.error)}
      />
    </div>
  );
}
