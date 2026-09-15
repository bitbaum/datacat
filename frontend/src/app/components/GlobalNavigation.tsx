// created_date: 2025-07-09
// last_modified_date: 2025-07-09
// last_modified_summary: "Wrapper, der TopNavigation global rendert."

'use client';

import { useRouter } from 'next/navigation';
import { TopNavigation } from './TopNavigation';
import { ROUTES } from '@/lib/routes';

export default function GlobalNavigation() {
  const router = useRouter();
  return (
    <TopNavigation
      onViewChange={(view) => {
        const target = view === 'saved-forms' ? ROUTES.forms : `/${view}`;
        router.push(target);
      }}
    />
  );
}
