'use client';

import dynamic from 'next/dynamic';

// next-contentlayer's compiled MDX body calls React internals (getOwner) that
// don't exist in this app's React 19 — the package is unmaintained and never
// shipped a React 19-compatible release. Server-side execution (build-time
// static export AND per-request SSR) crashes; client-only rendering doesn't,
// since the browser's React copy resolves the same call differently. Loading
// via next/dynamic with ssr:false skips server execution altogether.
export const MDXContentClient = dynamic(
  () => import('./MDXContent').then((m) => m.MDXContent),
  { ssr: false, loading: () => <div className="animate-pulse text-gray-400">Lade Inhalt…</div> }
);
