'use client';

// created_date: 2025-07-09
// last_modified_date: 2025-07-09
// last_modified_summary: "Erste Blog-Seite mit Platzhalterartikel hinzugefügt."

import Link from 'next/link';
import { allPosts } from '../../../.contentlayer/generated';
import Image from 'next/image';

export default function BlogPage() {
  const posts = allPosts.sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-24 sm:py-32 text-center text-white shadow-lg">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Insights & Gedanken
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg opacity-90">
          Lass dich von unseren Ideen rund um intelligente Datenerfassung, KI-Gestützte HR-Prozesse
          und moderne UX inspirieren.
        </p>
        <svg
          viewBox="0 0 1024 1024"
          className="absolute inset-0 -z-10 h-full w-full opacity-20"
          aria-hidden="true"
        >
          <circle cx="512" cy="512" r="512" fill="url(#blog-bg)" />
          <defs>
            <radialGradient id="blog-bg">
              <stop stopColor="#FFFFFF" stopOpacity=".1" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post._id}
            className="group relative rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition overflow-hidden"
          >
            {post.coverImage && (
              <Image
                src={post.coverImage}
                alt="cover"
                width={600}
                height={300}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-6">
              <time
                dateTime={post.date}
                className="text-sm text-indigo-600 dark:text-indigo-400 font-medium"
              >
                {new Date(post.date).toLocaleDateString('de-CH')}
              </time>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {post.title}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-6 line-clamp-3">
                {post.summary}
              </p>
              <Link
                href={post.url}
                className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Weiterlesen&nbsp;→
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
