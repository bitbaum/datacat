/**
 * Every internal route, written down once.
 *
 * These were string literals spread across the app — `/builder` in ten places
 * over six files, `/erfassung` in eight, `/forms` in seven. Renaming a route
 * meant finding every copy, and a missed one did not fail to compile: it became
 * a dead link only a visitor would discover.
 *
 * Adding a route means adding it here.
 */
export const ROUTES = {
  home: '/',
  builder: '/builder',
  forms: '/forms',
  templates: '/templates',
  erfassung: '/erfassung',
  erfassungNew: '/erfassung/new',
  erfassungTable: '/erfassung/table',
  about: '/about',
  aboutFaq: '/about/faq',
  blog: '/blog',
  profile: '/profile',
  login: '/login',
  register: '/register',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/** A blog post by slug — a template literal in a component is a copy too. */
export const blogPostPath = (slug: string) => `${ROUTES.blog}/${slug}` as const;
