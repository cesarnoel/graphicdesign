/**
 * cnsqdesigns — gallery manifest
 * =====================================================================
 * ARCHITECTURAL DECISION — the filter is data-driven and CSS-only.
 * ---------------------------------------------------------------------
 * `GALLERY_CATEGORIES` drives both the filter radio group and the
 * `data-category` attribute on every item. The filtering itself is done
 * with the `:has()` CSS selector (see Gallery.astro), which means:
 *   - the filters work with JavaScript fully disabled,
 *   - no client-side hydration cost for a feature Lighthouse measures,
 *   - keyboard users get normal radio-group arrow-key behaviour for free.
 *
 * Entries reference images by *base name* (no extension). src/lib/assets.ts
 * resolves that name against src/assets/gallery/*.{png,jpg,jpeg,webp,avif},
 * so swapping placeholder PNGs for production JPGs/AVIFs is a file drop —
 * no data or component change.
 */

/** Type-only import, so this module stays free of runtime dependencies. */
import type { ImageMetadata } from 'astro';

export const GALLERY_CATEGORIES = [
  { id: 'all', label: 'All work' },
  { id: 'web', label: 'Web' },
  { id: 'print', label: 'Print' },
  { id: 'ebook', label: 'E-book' },
] as const;

export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]['id'];

/** A real, filterable category ('all' is a view, not a category). */
export type GalleryCategory = Exclude<GalleryCategoryId, 'all'>;

/**
 * The shape a gallery entry takes once its image has been resolved at
 * build time. Components depend on this type rather than on the raw
 * ImageMetadata, which keeps the data module and the view module decoupled.
 */
export interface GalleryItemView extends GalleryEntry {
  readonly image: ImageMetadata;
}

export interface GalleryEntry {
  /** File base name in src/assets/gallery (no extension). */
  readonly baseName: string;
  readonly title: string;
  readonly client: string;
  readonly year: string;
  readonly category: GalleryCategory;
  /** One-line description shown in the lightbox and under the thumbnail. */
  readonly summary: string;
  /** Required, descriptive alt text. Never describe the medium, describe the content. */
  readonly alt: string;
  /** Short discipline tags rendered as a list. */
  readonly tags: readonly string[];
}

/**
 * TODO(copy): project names/clients are anonymised placeholders until the
 * Canva case-study copy is ported. Only the `baseName`, `category` and
 * `alt` fields are structural — edit everything else freely.
 */
export const GALLERY: readonly GalleryEntry[] = [
  {
    baseName: 'cnsqdesigns-web-01',
    title: 'Export company website',
    client: 'Agri-food exporter, Davao',
    year: '2024',
    category: 'web',
    summary: 'A product-first web presence with a photography system the client can extend themselves.',
    alt: 'Homepage composition for an agri-food exporter: a wide product photograph under a large serif headline.',
    tags: ['UI design', 'Responsive', 'Photography direction'],
  },
  {
    baseName: 'cnsqdesigns-web-02',
    title: 'Resort booking flow',
    client: 'Boutique resort, Island Garden City of Samal',
    year: '2023',
    category: 'web',
    summary: 'Booking reduced from five screens to three, with availability visible from the first step.',
    alt: 'Three stacked mobile booking screens showing room availability and a date picker.',
    tags: ['UX flow', 'Mobile-first', 'Design system'],
  },
  {
    baseName: 'cnsqdesigns-print-01',
    title: 'Roastery catalogue',
    client: 'Specialty coffee roastery',
    year: '2024',
    category: 'print',
    summary: 'A saddle-stitched catalogue with a grid that survives every bean, roast and origin.',
    alt: 'Open catalogue spread showing a coffee origin profile beside a full-bleed green landscape photograph.',
    tags: ['Editorial grid', 'Saddle-stitch', 'Press-ready'],
  },
  {
    baseName: 'cnsqdesigns-print-02',
    title: 'Snack brand packaging',
    client: 'Regional snack manufacturer',
    year: '2022',
    category: 'print',
    summary: 'One structural system covering six SKUs without changing the die line.',
    alt: 'Six foil snack packets in a row, each in a different solid colour with the same centred wordmark.',
    tags: ['Packaging', 'Dielines', 'Colour management'],
  },
  {
    baseName: 'cnsqdesigns-ebook-01',
    title: 'Annual report e-book',
    client: 'Regional development foundation',
    year: '2025',
    category: 'ebook',
    summary: 'A 96-page report designed to read well on a phone before it was designed to print.',
    alt: 'Two side-by-side e-book pages: a data chart on the left and a pull quote on the right.',
    tags: ['Fixed layout', 'Data graphics', 'Accessibility'],
  },
  {
    baseName: 'cnsqdesigns-ebook-02',
    title: 'Reflowable EPUB series',
    client: 'Educational publisher',
    year: '2023',
    category: 'ebook',
    summary: 'Semantic reflowable EPUBs that hold their typographic hierarchy at any font size.',
    alt: 'An e-reader screen showing a chapter opening with a drop cap above body text.',
    tags: ['EPUB 3', 'Typography', 'Semantic CSS'],
  },
];