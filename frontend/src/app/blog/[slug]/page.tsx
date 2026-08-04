// created_date: 2025-07-10
// last_modified_date: 2025-07-10
// last_modified_summary: "Dynamic MDX blog post page with CTA." 

import { allPosts } from '../../../../.contentlayer/generated';
import { notFound } from 'next/navigation';
import { MDXContentClient } from './MDXContentClient';
import Image from 'next/image';
import Link from 'next/link';

export const generateStaticParams = async () => allPosts.map(p => ({ slug: p.slug }));

interface PageProps { params: Promise<{ slug: string }> }

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = allPosts.find(p => p.slug === slug);
  
  if (!post) {
    return notFound();
  }

  return (
    <article className="prose prose-indigo dark:prose-invert mx-auto max-w-3xl px-4 pb-24 pt-12">
      {post.coverImage && (
        <div className="mb-8 overflow-hidden rounded-xl shadow-lg">
          <Image src={post.coverImage} alt="Cover" width={800} height={400} className="w-full h-64 object-cover" />
        </div>
      )}
      <h1>{post.title}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {new Date(post.date).toLocaleDateString('de-CH')}
      </p>
      <MDXContentClient code={post.body.code} />

      {/* CTA */}
      <div className="mt-16 border-t pt-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Teste den Universal Form Builder selbst</h2>
        <Link href="/builder" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700">
          Zum Builder →
        </Link>
      </div>
    </article>
  );
} 