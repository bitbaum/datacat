import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authLabelsFor, isDeliverable, signInMethods } from '@bitbaum/accountkit/auth';
import { DataCatAccount } from '../components/AccountScreens';
import { ROUTES } from '@/lib/routes';
import { authMailer, getAuth, getSession } from '@/server/auth/runtime';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Konto', robots: { index: false } };

/** One's own account: passkeys, two-step codes, password, sign-in methods, deletion. */
export default async function AccountPage() {
  const session = await getSession().catch(() => null);
  if (!session) redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.account)}`);
  const linked = (await getAuth()
    .api.listUserAccounts({ headers: await headers() })
    .catch(() => [])) as { providerId: string }[];
  const { user } = session;
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link href={ROUTES.profile} className="text-sm text-gray-500 hover:text-gray-700">
        ← Profil
      </Link>
      <h1 className="mt-4 mb-8 text-3xl font-bold text-gray-900 dark:text-white">Konto</h1>
      <DataCatAccount
        labels={authLabelsFor('de')}
        methods={signInMethods(process.env, authMailer.configured)}
        user={{
          name: user.name ?? '',
          email: isDeliverable(user.email) ? user.email : null,
          emailVerified: Boolean(user.emailVerified),
          role: user.role ?? 'customer',
          twoFactorEnabled: Boolean(user.twoFactorEnabled),
        }}
        linked={linked.map((a) => a.providerId)}
      />
    </div>
  );
}
