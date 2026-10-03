/**
 * cnsqdesigns — brand + content single source of truth
 * =====================================================================
 * ARCHITECTURAL DECISIONS
 * ---------------------------------------------------------------------
 * 1. No user-visible copy is hard-coded inside a component. Everything a
 *    client reads lives here as typed data, which means:
 *      - copy edits can never break markup,
 *      - one string feeds the visible page, the <title>/meta tags and the
 *        JSON-LD structured data (one source, zero drift),
 *      - `npm run check` fails the build on a missing/misspelled field.
 * 2. This module is imported by astro.config.mjs as well, so `site` (which
 *    drives canonical URLs, sitemap.xml and robots.txt) is defined once.
 *    It therefore stays dependency-free and side-effect-free.
 * 3. Naming guardrail: the brand is always written lowercase as one word —
 *    "cnsqdesigns". Branded files use the `cnsqdesigns-` prefix with a
 *    lowercase kebab-case suffix (cnsqdesigns-resume.pdf,
 *    cnsqdesigns-og.png, cnsqdesigns-web-01.png).
 * 4. `TODO(copy)` marks text that must be replaced with the *verbatim*
 *    wording from the live Canva site so core messaging is preserved.
 */

/** Brand slug. Reused by file naming, ids, form names and the sitemap. */
export const BRAND_SLUG = 'cnsqdesigns';

export interface SectionLink {
  /** Heading text shown in the nav and in the section. */
  readonly label: string;
  /** In-page anchor target; also used as the section's `id`. */
  readonly id: string;
}

export interface SocialLink {
  readonly platform: 'instagram' | 'facebook' | 'linkedin' | 'behance';
  /** Accessible name — the visible label is the platform icon only. */
  readonly label: string;
  readonly href: string;
}

export interface Service {
  readonly title: string;
  readonly summary: string;
  readonly deliverables: readonly string[];
}

export const SITE = {
  /**
   * TODO(launch): point this at the production domain (e.g.
   * https://cnsqdesigns.com) before the first deploy. It is the base for
   * <link rel="canonical">, og:url, sitemap.xml and robots.txt.
   */
  url: 'https://cnsqdesigns.netlify.app',
  name: BRAND_SLUG,
  locale: 'en_PH',
  lang: 'en',
  /** TODO(copy): keep the meta description under ~155 characters. */
  description:
    'cnsqdesigns is the graphic design practice of a Davao City designer with 18+ years in brand identity, print and e-book design.',
  keywords: [
    'graphic designer Davao City',
    'brand identity Philippines',
    'print design',
    'ebook layout design',
    'cnsqdesigns',
  ],
  /** OG card lives in /public, so it is referenced by absolute path. */
  ogImage: '/cnsqdesigns-og.png',
  ogImageAlt: 'cnsqdesigns — graphic design portfolio, Davao City',
} as const;

/**
 * Person facts. These feed the JSON-LD graph emitted by
 * src/components/Seo.astro and are the only place the designer's details
 * are written down.
 */
export const PROFILE = {
  /**
   * TODO(copy): the designer's display name. `cnsqdesigns` is the brand
   * name and is used as the fallback until the legal name is confirmed.
   */
  name: BRAND_SLUG,
  jobTitle: 'Graphic Designer',
  location: 'Davao City, Philippines',
  /** Used in the Hero eyebrow and the About copy. */
  yearsOfExperience: '18+',
  /** TODO(copy): add verified profile URLs (Behance, LinkedIn, ...). */
  sameAs: [] as readonly string[],
} as const;

/** Sections in reading order — drives the nav and the page composition. */
export const SECTIONS: readonly SectionLink[] = [
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Work' },
  { id: 'services', label: 'Services' },
  { id: 'contact', label: 'Contact' },
];

export const HERO = {
  eyebrow: `Graphic design studio · ${PROFILE.location}`,
  /**
   * TODO(copy): the headline is the most important piece of core messaging
   * on the site — swap in the Canva wording verbatim.
   */
  headline: 'Design that earns a second look.',
  standfirst: `I am a ${PROFILE.jobTitle.toLowerCase()} with ${PROFILE.yearsOfExperience} years of practice — shaping brands, print and digital publications for teams across Davao City and beyond.`,
  primaryCta: { label: 'View selected work', id: 'gallery' },
  secondaryCta: { label: 'Start a project', id: 'contact' },
  /** Short proof points, rendered as a description list for screen readers. */
  facts: [
    { term: 'Practice', detail: `${PROFILE.yearsOfExperience} years` },
    { term: 'Disciplines', detail: 'Brand · Print · Digital' },
    { term: 'Based in', detail: PROFILE.location },
  ],
} as const;

export const ABOUT = {
  eyebrow: 'About',
  heading: 'Two decades of making things clear, memorable and print-ready.',
  /**
   * TODO(copy): replace with the Canva bio verbatim. Three short
   * paragraphs read better at display sizes than one long block.
   */
  paragraphs: [
    `I have spent ${PROFILE.yearsOfExperience} years turning briefs into work that holds up — on a billboard, in a saddle-stitched catalogue, and on a phone at 320 pixels wide.`,
    'The studio is deliberately small. You talk to the person doing the design, decisions happen in one conversation instead of three hand-offs, and files arrive correct the first time: outlined, colour-profiled and press-ready.',
    'Most projects start with a question rather than a mood board. What is this for, who is it for, and what has to be true for it to have worked?',
  ],
  /**
   * The portrait is referenced by base name and resolved through
   * src/lib/assets.ts, so a placeholder .png today can be replaced by a
   * production .jpg tomorrow without a code change.
   */
  portrait: {
    baseName: 'cnsqdesigns-portrait',
    alt: 'Portrait-format artwork from the cnsqdesigns Canva demo site, used as the about-section portrait.',
  },
  /** The PDF resume CTA. Path is fixed by the file-naming convention. */
  resume: {
    href: '/cnsqdesigns-resume.pdf',
    label: 'Download resume (PDF)',
  },
} as const;

export const SERVICES: readonly Service[] = [
  {
    title: 'Brand identity',
    summary: 'Marks, type systems and the rules that keep them consistent as you grow.',
    deliverables: ['Logo system', 'Type & colour specs', 'Usage guidelines'],
  },
  {
    title: 'Print & editorial',
    summary: 'Publications, collateral and packaging prepared for real-world production.',
    deliverables: ['Brochures & catalogues', 'Packaging & labels', 'Press-ready files'],
  },
  {
    title: 'E-book & digital publishing',
    summary: 'Fixed and reflowable layouts that stay readable on every device.',
    deliverables: ['EPUB & fixed-layout', 'Covers & interiors', 'Asset export'],
  },
  {
    title: 'Web & social graphics',
    summary: 'Screen-first visuals built for the crops, ratios and speeds people actually use.',
    deliverables: ['Web & landing visuals', 'Social templates', 'Responsive asset sets'],
  },
];

export const CONTACT = {
  eyebrow: 'Contact',
  heading: 'Tell me what you are building.',
  standfirst:
    'Send the scope, the timeline and any existing assets. You will get a straight answer on fit, budget range and the next available start date.',
  /** TODO(copy): confirm the public email address before deploy. */
  email: `hello@${BRAND_SLUG}.com`,
  /** TODO(copy): confirm whether a phone number should be published at all. */
  phone: '+63 82 000 0000',
  /** Machine-readable form of the same number, for tel: links. */
  phoneHref: '+63820000000',
  location: PROFILE.location,
  /** TODO(copy): confirm realistic working hours. */
  hours: 'Mon–Fri · 9:00–18:00 PHT',
  /**
   * Netlify Forms: the static HTML form is detected at deploy time, so no
   * server code, no third-party form service and no client JS is needed.
   */
  formName: `${BRAND_SLUG}-contact`,
  /** TODO(launch): replace with the real profile URLs. */
  socials: [
    {
      platform: 'instagram',
      label: `${BRAND_SLUG} on Instagram`,
      href: 'https://www.instagram.com/',
    },
    {
      platform: 'facebook',
      label: `${BRAND_SLUG} on Facebook`,
      href: 'https://www.facebook.com/',
    },
    {
      platform: 'linkedin',
      label: `${BRAND_SLUG} on LinkedIn`,
      href: 'https://www.linkedin.com/',
    },
    {
      platform: 'behance',
      label: `${BRAND_SLUG} on Behance`,
      href: 'https://www.behance.net/',
    },
  ] satisfies readonly SocialLink[],
};

export const FOOTER = {
  note: `Independent graphic design practice in ${PROFILE.location}.`,
  /** Small print rendered next to the © mark. */
  legal: 'All work shown remains the property of its respective client.',
} as const;