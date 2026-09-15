'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ICON, OutlineIcon, SpinnerIcon } from '../components/data-ingestion/icons';
import { authHeaders } from '../components/data-ingestion/shared';

/**
 * What every /ingest/<kind> page shares: the page frame with its header, the
 * "Recent …" panel and its loading / error / empty states, the status badge,
 * the detail panel with its close button, and the fetch that fills the list.
 */

export function IngestPage({
  icon,
  title,
  subtitle,
  ingestion,
  recent,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  /** The ingestion component (left column). */
  ingestion: React.ReactNode;
  /** The RecentPanel (right column). */
  recent: React.ReactNode;
  /** The detail panel for the selected source, if any. */
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ingest"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <OutlineIcon d={ICON.back} className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <OutlineIcon d={icon} className="w-8 h-8 text-indigo-600" />
                  {title}
                </h1>
                <p className="mt-1 text-gray-500">{subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>{ingestion}</div>
          {recent}
        </div>
        {children}
      </div>
    </div>
  );
}

export function RecentPanel({
  title,
  icon = ICON.clock,
  headerExtra,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyHint,
  children,
}: {
  title: string;
  icon?: string;
  /** A control rendered on the heading row, e.g. a filter select. */
  headerExtra?: React.ReactNode;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyIcon: string;
  emptyTitle: string;
  emptyHint: string;
  children: React.ReactNode;
}) {
  const heading = (
    <>
      <OutlineIcon d={icon} className="w-5 h-5 text-indigo-600" />
      {title}
    </>
  );
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {headerExtra ? (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{heading}</h2>
          {headerExtra}
        </div>
      ) : (
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">{heading}</h2>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button onClick={onRetry} className="text-sm font-medium text-red-700 hover:underline">
              Try again
            </button>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-12">
          <OutlineIcon d={emptyIcon} className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{emptyTitle}</p>
          <p className="text-sm text-gray-400 mt-1">{emptyHint}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/** Border/background for a list entry that can be the selected one. */
export function selectableItemClass(selected: boolean): string {
  return `rounded-lg border-2 transition-all ${
    selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
  }`;
}

export function StatusBadge({
  status,
  className = 'ml-2 px-2 py-1 text-xs font-medium rounded-full',
}: {
  status: string;
  className?: string;
}) {
  const tone =
    status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : status === 'PROCESSING'
        ? 'bg-yellow-100 text-yellow-700'
        : status === 'FAILED'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700';
  return <span className={`${className} ${tone}`}>{status}</span>;
}

export function DetailPanel({
  header,
  onClose,
  children,
}: {
  header: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        {header}
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <OutlineIcon d={ICON.close} className="w-6 h-6" />
        </button>
      </div>
      {children}
    </div>
  );
}

interface RecentPayload<T> {
  data?: { dataSources?: T[] };
  dataSources?: T[];
}

/** Most list routes answer `{ data: { dataSources } }` … */
export function fromDataEnvelope<T>(payload: RecentPayload<T>): T[] | undefined {
  return payload.data?.dataSources;
}

/** … db-ingestion answers `{ dataSources }` at the top level. */
export function fromRoot<T>(payload: RecentPayload<T>): T[] | undefined {
  return payload.dataSources;
}

interface RecentSourcesOptions<T> {
  url: string;
  token: string | null | undefined;
  /** Noun for the console message, e.g. "images" → "Failed to fetch images:". */
  what: string;
  /** What the panel shows when the fetch fails. */
  loadError: string;
  /** Must be referentially stable (a module-level function), it is an effect dependency. */
  unwrap: (payload: RecentPayload<T>) => T[] | undefined;
}

/** The recent-sources list: fetched once a token exists, re-fetched on demand. */
export function useRecentSources<T>({
  url,
  token,
  what,
  loadError,
  unwrap,
}: RecentSourcesOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(url, { headers: authHeaders(token) });
      if (!response.ok) throw new Error(`Failed to fetch ${what}`);
      const data: RecentPayload<T> = await response.json();
      setItems(unwrap(data) || []);
    } catch (err) {
      console.error(`Failed to fetch ${what}:`, err);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [url, token, what, loadError, unwrap]);

  useEffect(() => {
    if (token) refresh();
  }, [token, refresh]);

  return { items, loading, error, refresh };
}
