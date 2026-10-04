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
  readonly category: GalleryCategory;
  /** One-line description shown in the lightbox and under the thumbnail. */
  readonly summary: string;
  /** Required, descriptive alt text. Never describe the medium, describe the content. */
  readonly alt: string;
  /** Short discipline tags rendered as a list. */
  readonly tags: readonly string[];
}

/**
 * TODO(copy): titles/summaries/tags are working titles carried over from
 * the scaffold until the Canva case-study copy is ported. Only the
 * `baseName`, `category` and `alt` fields are structural — edit everything
 * else freely. Artwork files are the real exports from the Canva demo site
 * (see scripts/ingest-canva-assets.mjs for provenance); place each piece in
 * the category matching the section it was taken from on that site.
 */
export const GALLERY: readonly GalleryEntry[] = [
  {
    baseName: 'cnsqdesigns-web-01',
    title: 'Portfolio hero composition',
    category: 'web',
    summary: 'Wide landscape hero artwork from the demo site home section.',
    alt: 'Wide landscape web artwork from the cnsqdesigns Canva demo site home section.',
    tags: ['Web', 'Hero artwork', 'Landscape'],
  },
  {
    baseName: 'cnsqdesigns-web-02',
    title: 'Landscape feature artwork',
    category: 'web',
    summary: 'Second landscape feature piece from the demo site home section.',
    alt: 'Second wide landscape web artwork from the cnsqdesigns Canva demo site home section.',
    tags: ['Web', 'Feature artwork', 'Landscape'],
  },
  {
    baseName: 'cnsqdesigns-web-03',
    title: 'Editorial web artwork',
    category: 'web',
    summary: 'Large editorial landscape artwork from the demo site.',
    alt: 'Large landscape editorial artwork from the cnsqdesigns Canva demo site.',
    tags: ['Web', 'Editorial', 'Landscape'],
  },
  {
    baseName: 'cnsqdesigns-print-01',
    title: 'Portrait print piece',
    category: 'print',
    summary: 'Portrait-format print artwork from the demo site portfolio section.',
    alt: 'Portrait-format print artwork from the cnsqdesigns Canva demo site portfolio section.',
    tags: ['Print', 'Portfolio', 'Portrait'],
  },
  {
    baseName: 'cnsqdesigns-print-02',
    title: 'Tall editorial print',
    category: 'print',
    summary: 'Tall portrait editorial piece from the demo site portfolio section.',
    alt: 'Tall portrait editorial print artwork from the cnsqdesigns Canva demo site portfolio section.',
    tags: ['Print', 'Editorial', 'Portrait'],
  },
  {
    baseName: 'cnsqdesigns-print-03',
    title: 'Square brand mark study',
    category: 'print',
    summary: 'Square brand-mark study from the demo site portfolio section.',
    alt: 'Square brand mark study artwork from the cnsqdesigns Canva demo site portfolio section.',
    tags: ['Print', 'Brand mark', 'Square'],
  },
  {
    baseName: 'cnsqdesigns-ebook-01',
    title: 'E-book portrait spread',
    category: 'ebook',
    summary: 'Portrait e-book artwork from the demo site portfolio section.',
    alt: 'Portrait e-book artwork from the cnsqdesigns Canva demo site portfolio section.',
    tags: ['E-book', 'Portrait', 'Interior'],
  },
  {
    baseName: 'cnsqdesigns-ebook-02',
    title: 'E-book feature artwork',
    category: 'ebook',
    summary: 'Portrait e-book feature piece from the demo site portfolio section.',
    alt: 'Portrait e-book feature artwork from the cnsqdesigns Canva demo site portfolio section.',
    tags: ['E-book', 'Feature', 'Portrait'],
  },
  {
    baseName: 'cnsqdesigns-ebook-03',
    title: 'E-book landscape spread',
    category: 'ebook',
    summary: 'Landscape e-book spread artwork from the demo site portfolio section.',
    alt: 'Landscape e-book spread artwork from the cnsqdesigns Canva demo site portfolio section.',
    tags: ['E-book', 'Spread', 'Landscape'],
  },
];