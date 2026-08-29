'use client';

import { useMDXComponent } from 'next-contentlayer/hooks';
import { MDXComponents } from '@/components/MDXComponents';

interface MDXContentProps {
  code: string;
}

export function MDXContent({ code }: MDXContentProps) {
  const MDXComponent = useMDXComponent(code);
  return <MDXComponent components={MDXComponents as any} />;
}
