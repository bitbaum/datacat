'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function FYIPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">What is DataCat?</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            An AI-first platform to capture, structure, and act on data.
          </p>
        </header>

        <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            The idea in 20 seconds
          </h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Build a form, or ingest audio, video, images, websites and databases</li>
            <li>AI analyses what comes in: classification, sentiment, extraction, summaries</li>
          </ul>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Versioned forms</h3>
            <p className="text-gray-600 dark:text-gray-300">
              When the fields of a form change, the previous version is kept, so a form can evolve
              without losing its history.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Data integrity by design
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Client and server validation plus Prisma constraints keep data trustworthy.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Modular & maintainable
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              A Next.js frontend and a tRPC API with typed inputs.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Where to go next</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>
              Build a form in the{' '}
              <Link href={ROUTES.builder} className="text-blue-600 dark:text-blue-400 underline">
                Form Builder
              </Link>
            </li>
            <li>
              Read what DataCat is for in{' '}
              <Link href={ROUTES.about} className="text-blue-600 dark:text-blue-400 underline">
                About
              </Link>
            </li>
            <li>
              Read the technical plan in{' '}
              <Link
                href="/blog/intake-engine"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                our blog
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
