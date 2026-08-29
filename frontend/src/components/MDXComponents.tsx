// created_date: 2025-07-10
// last_modified_date: 2025-07-10
// last_modified_summary: "Shared MDX components (Image, Callout, Infographic)."

'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

type CalloutProps = {
  children: React.ReactNode;
  type?: 'info' | 'tip' | 'warn' | 'danger';
};

export function Callout({ children, type = 'info' }: CalloutProps) {
  const styles = {
    info: 'my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4',
    tip: 'my-6 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4',
    warn: 'my-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4',
    danger: 'my-6 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4',
  }[type];
  return <div className={styles}>{children}</div>;
}

type InfographicProps = {
  src: string;
  caption?: string;
};
export function Infographic({ src, caption }: InfographicProps) {
  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={caption || ''}
        width={800}
        height={450}
        className="mx-auto rounded-lg shadow-md"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export const MDXComponents = {
  Image,
  img: (props: any) => (
    <Image
      {...props}
      alt={props.alt || ''}
      width={props.width || 800}
      height={props.height || 400}
    />
  ),
  a: (props: any) => (
    <Link
      {...props}
      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
    />
  ),
  Callout,
  Infographic,
};
