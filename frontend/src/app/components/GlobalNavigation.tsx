// created_date: 2025-07-09
// last_modified_date: 2025-07-09
// last_modified_summary: "Wrapper, der TopNavigation global rendert und currentView abhängig vom Pfad setzt."

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { TopNavigation } from './TopNavigation';
import { ROUTES } from '@/lib/routes';

function mapPathToView(path: string): 'builder' | 'templates' | 'saved-forms' | 'about' {
  if (path.startsWith(ROUTES.templates)) return 'templates';
  if (path.startsWith(ROUTES.forms)) return 'saved-forms';
  if (path.startsWith(ROUTES.about)) return 'about';
  return 'builder';
}

export default function GlobalNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentView = mapPathToView(pathname);
  return (
    <TopNavigation
      currentView={currentView}
      onViewChange={(view) => {
        const target = view === 'saved-forms' ? ROUTES.forms : `/${view}`;
        router.push(target);
      }}
    />
  );
}
