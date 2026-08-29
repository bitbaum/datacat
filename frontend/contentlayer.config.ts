// created_date: 2025-07-10
// last_modified_date: 2025-07-10
// last_modified_summary: "Initial Contentlayer config for MDX blog posts."

import { defineDocumentType, makeSource } from 'contentlayer/source-files';
// @ts-ignore
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `blog/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    summary: { type: 'string', required: true },
    coverImage: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' } },
    created_date: { type: 'string', required: false },
    last_modified_date: { type: 'string', required: false },
    last_modified_summary: { type: 'string', required: false },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx?$/, ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/blog/${doc._raw.sourceFileName.replace(/\.mdx?$/, '')}`,
    },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]],
  },
});
