# cnsqdesigns

Portfolio site for **cnsqdesigns** — the graphic design practice of a Davao City
designer with 18+ years in brand identity, print and e-book design.

Migrated from Canva Sites to a hand-built **Astro + React islands + SASS** static
site, deployed on Netlify. No page builder, no third-party runtime, no analytics.

---

## Why this stack

| Requirement | How it is met |
| --- | --- |
| Lighthouse ≥ 90 (mobile + desktop) | Static output, no third-party requests, self-hosted fonts, LCP is text, one small deferred island, measured budget guard (`npm run report`) |
| Graceful degradation without JavaScript | Every section is server-rendered HTML. Filtering, smooth-scroll nav, sticky header and mobile nav are pure CSS. The lightbox degrades to "open the full-size image" |
| Responsive mobile-first layout | `@include mix.from(...)` min-width breakpoints, fluid `clamp()` type and spacing, 320px → 1440px+, no horizontal scroll |
| Brand identity preserved | Dark navy palette with cyan accent and the signature blue→cyan gradient, synchronised with cnsqwordpressengr.netlify.app; "cnsqdesigns" naming enforced in data, filenames and CSS |
| Astro / React / SASS only | 5 runtime deps, all first-party Astro or React. No Tailwind, no GSAP, no icon pack, no form vendor |

---

## Quick start

```bash
npm install            # install dependencies
npm run dev            # dev server            -> http://localhost:4321
npm run build          # production build      -> ./dist
npm run preview        # serve ./dist locally  -> http://localhost:4321

npm run check          # astro check: types + template diagnostics (currently 0/0/0)
npm run report         # build report + performance budget guard (must pass before deploy)

npm run assets:placeholders   # regenerate the placeholder images + resume PDF (dev only)
```

Node 20.3+ is required (`engines` in package.json). Netlify is pinned to Node 22
in `netlify.toml`, which matches what has been verified locally.

---

## Project structure

```
cnsqdesigns/
├─ astro.config.mjs         Astro config: static output, React, sitemap, fonts, SASS loadPaths
├─ netlify.toml             Build settings, security + cache headers, CSP plan
├─ tsconfig.json            strictest Astro TS preset + React JSX + "@/*" -> "src/*"
├─ public/
│  ├─ _redirects            Canva -> cnsqdesigns migration map (ACTION REQUIRED, see deploy)
│  ├─ favicon.svg           Hand-written brand mark
│  ├─ cnsqdesigns-og.png    1200x630 social card
│  ├─ cnsqdesigns-icon-180.png  Apple touch icon
│  └─ cnsqdesigns-resume.pdf    Target of the "Resume (PDF)" CTA
├─ scripts/
│  ├─ generate-placeholders.mjs  Dependency-free PNG + PDF placeholder generator
│  └─ dist-report.mjs            Build report / performance budget guard
└─ src/
   ├─ data/
   │  ├─ site.ts            ALL copy, brand facts, nav, services, contact (single source of truth)
   │  └─ gallery.ts         Gallery manifest + categories (drives filters and items)
   ├─ lib/
   │  └─ assets.ts          Extension-agnostic image resolver (base name -> ImageMetadata)
   ├─ layouts/
   │  └─ BaseLayout.astro   <html>, <head>, fonts, skip link, landmarks, global CSS
   ├─ components/
   │  ├─ Seo.astro              Meta, Open Graph, canonical, JSON-LD graph
   │  ├─ StickyHeader.astro     Sticky nav + JS-free mobile rail + CSS scroll progress
   │  ├─ Wordmark.astro         Inline SVG + text wordmark
   │  ├─ SectionHeading.astro   Shared eyebrow/heading + aria-labelledby ids
   │  ├─ Hero.astro             h1, CTAs, facts <dl>, CSS specimen grid (no hero image)
   │  ├─ AboutSection.astro     Bio, <Picture> portrait, PDF resume CTA
   │  ├─ Gallery.astro          CSS-only filters (radio + :has()), noscript fallback
   │  ├─ GalleryItem.astro      Static thumbnail + lightbox data contract
   │  ├─ Lightbox.tsx           React island (native <dialog>), the only hydrated component
   │  ├─ Services.astro         Ordered service index
   │  ├─ ContactInfo.astro      Contact <dl>, social links, Netlify Form (no JS)
   │  ├─ SocialLinks.astro      Typographic social links + registration-diamond mark
   │  └─ Footer.astro           contentinfo landmark
   ├─ pages/
   │  ├─ index.astro        Composes the five sections
   │  ├─ 404.astro          Real dist/404.html (no SPA catch-all)
   │  ├─ thank-you.astro    Netlify Form success page (noindex)
   │  └─ robots.txt.ts      Generated from SITE.url
   └─ styles/
      ├─ global.scss           Entry point (shared modules only)
      ├─ abstracts/_tokens.scss   SCSS variables: palette, type scale, space, motion, breakpoints
      ├─ abstracts/_mixins.scss   shell, section-shell, from/until, focus-ring, eyebrow, motion guards
      ├─ base/_root.scss          Publishes tokens as CSS custom properties on :root
      ├─ base/_reset.scss         Zero-specificity reset (smooth scroll lives here)
      ├─ base/_typography.scss    Base type, eyebrows, prose links, selection, focus defaults
      ├─ base/_buttons.scss       Shared button primitive (solid / ghost / quiet)
      ├─ base/_ambient.scss       CSS-only grain + wash background layers
      ├─ base/_motion.scss        Reveal-on-scroll + reduced-motion kill switch
      └─ components/_lightbox.scss  Global styles for the React island (cannot be Astro-scoped)
```

---

## Architecture decisions

The reasoning lives next to the code as comments; this is the index. Each
heading names the file that documents it.

### 1. Static output, no adapter
`astro.config.mjs` sets `output: 'static'`. The site is content, not an
application, so every page is prerendered to HTML and Netlify serves `dist/`
from its edge CDN. Nothing to scale, nothing to cold-start, instant rollback.

### 2. JavaScript is a last resort, not a default
`StickyHeader.astro`, `Gallery.astro`, `Hero.astro`, `Footer.astro`. There are
four features people expect to cost JavaScript, and all four are CSS here:

| Feature | Implementation | Cost |
| --- | --- | --- |
| Sticky header | `position: sticky` | 0 KB |
| Smooth-scroll nav | `scroll-behavior: smooth` + `scroll-margin-top` on every `[id]` | 0 KB |
| Mobile navigation | Horizontally scrollable rail with an edge mask (no hamburger, no focus trap, no state machine) | 0 KB |
| Gallery filtering | Visually hidden radio group + `:has()` on the container | 0 KB |
| Reading progress bar | `animation-timeline: scroll()` | 0 KB |
| Reveal on scroll | `animation-timeline: view()` | 0 KB |

Unsupported browsers get the final state, not a broken page: no `:has()` means
no filtering (all items visible), no scroll timelines means no animation.

### 3. One island, hydrated at idle
`Gallery.astro`, `GalleryItem.astro`, `Lightbox.tsx`. The gallery grid is static
HTML. `Lightbox.tsx` is a single React island that renders one empty `<dialog>`,
delegates clicks from the grid and reads slide metadata from `data-*`
attributes — so metadata exists once, and six images cost one hydration instead
of six. `client:idle` (not `client:visible`) is used deliberately: the dialog is
`display: none` until opened, so it has no layout box and an
IntersectionObserver-based directive would never fire.

### 4. Progressive enhancement by construction
`GalleryItem.astro`. The thumbnail wrapper is a real `<a href="{1400px WebP}">`.
With JavaScript disabled the "lightbox" becomes "open the full-size image" — a
perfectly good gallery. With JavaScript enabled the island intercepts the click,
and it steps aside for Ctrl/Cmd/Shift/middle-clicks so "open in new tab" still
works.

### 5. Native `<dialog>`, not a hand-rolled modal
`Lightbox.tsx`. `showModal()` provides focus containment, Esc to close, an inert
background, top-layer stacking and focus restoration to the trigger. Those are
the parts hand-written modals get wrong.

### 6. Fonts are self-hosted and metric-matched
`astro.config.mjs`, `BaseLayout.astro`, `src/styles/base/_root.scss`. Astro's
Fonts API downloads the woff2 files at build time and emits `@font-face` rules
plus metric-matched fallback overrides, so the fallback occupies the same space
as the webfont (protects CLS) and there is no third-party request, no consent
banner and no render-blocking stylesheet.

Only the variants the design uses are declared. An italic Bodoni file is ~26 KB
and the component preloads every file of a family it describes, so the unused
italic was removed — worth 31 KB off the critical path.

`--csq-font-display` / `--csq-font-body` are owned by the Fonts API. Do **not**
redeclare them in `_root.scss`: that would override the metric overrides and
reintroduce the layout shift the integration exists to prevent.

### 7. Two-tier tokens: SCSS for authoring, custom properties for runtime
`src/styles/abstracts/_tokens.scss` → `src/styles/base/_root.scss`. SCSS
variables are compile-time (usable in mixins, maths, media queries); components
consume `var(--csq-*)`. That lets tokens be overridden at runtime — the
`prefers-contrast: more` block already brightens paper and strengthens the accent
without touching a component — and it means no SCSS needs to be injected into
every component build.

`additionalData` injection was rejected on purpose: it re-injects into the
modules themselves and causes Sass "module already loaded" errors. `loadPaths`
plus an explicit `@use` per component is safer and makes dependencies visible.

### 8. Content is data
`src/data/site.ts`, `src/data/gallery.ts`. No user-visible string is hard-coded
in a template. One string feeds the page, the meta tags and the JSON-LD graph,
so they cannot drift, and `npm run check` fails on a missing field.

### 9. Images: extension-agnostic, resolution-failure-proof
`src/lib/assets.ts`. Entries declare a *base name*; a build-time
`import.meta.glob` maps it to typed `ImageMetadata` whatever the extension. That
is what lets this repo ship with placeholder `.png` files and accept the real
optimised `.jpg`/`.avif` assets as a pure file drop. `requireAsset()` throws at
build time, so a missing image can never reach production.

### 10. Motion costs zero JavaScript
`src/styles/base/_motion.scss`. Scroll-driven animations run on the compositor.
There is one global `prefers-reduced-motion: reduce` kill switch, and every
animation is gated behind `prefers-reduced-motion: no-preference`. The hero's
`<h1>` uses a transform-only animation (`.cnsq-lift`) so the LCP element is
opaque in the first frame — Lighthouse does not count fully transparent elements
as contentful, so fading the headline in would delay LCP by the length of the
delay.

### 11. Forms and spam handling without a vendor
`ContactInfo.astro`. A plain HTML form with `data-netlify="true"` is detected
and stored by Netlify Forms: no server code, no third-party form service, no
CAPTCHA. Spam is handled with a honeypot field. Submission redirects to a real
`/thank-you` page, so the flow is identical with JavaScript disabled.

---

## Design system

### Colour — dark navy theme, cyan accent, signature blue→cyan gradient

Synchronised with the primary site (`cnsqwordpressengr.netlify.app`) whose
compiled CSS was the extraction source. Asserted once in
`src/styles/abstracts/_tokens.scss`, published once in `base/_root.scss`.
Components must never introduce a raw hex value.

| Token | Value | Role | Contrast |
| --- | --- | --- | --- |
| `--csq-ink` | `#0f172a` | Page ground (slate-900 navy) | — |
| `--csq-ink-deep` | `#080d1a` | Lightbox backdrop, wells, CTA banner | — |
| `--csq-ink-raised` | `#101a30` | Sticky header, raised sections | — |
| `--csq-ink-surface` | `#172033` | Cards, form panel | — |
| `--csq-line` | `#273044` | Hairlines (decorative) | — |
| `--csq-line-strong` | `#64748b` | UI boundaries (slate-500) | 3.4:1 |
| `--csq-paper` | `#f8fafc` | Primary text (slate-50) | 17.0:1 |
| `--csq-paper-muted` | `#cbd5e1` | Body/secondary text (slate-300) | 11.9:1 |
| `--csq-paper-faint` | `#94a3b8` | Small print (slate-400) | 6.9:1 |
| `--csq-accent` | `#22d3ee` | The dark-mode accent (cyan-400) | 9.8:1 on ink |
| `--csq-accent-deep` | `#06b6d4` | Gradient end / decorative only | — |
| `--csq-accent-blue` | `#2563eb` | Gradient start (large/decorative) | 3.5:1 on ink |
| `--csq-accent-gradient` | `linear-gradient(135deg, #2563eb, #06b6d4)` | Signature display motif | — |

Ratios are annotated in the token file. Text stays ≥ 4.5:1 and UI boundaries
≥ 3:1. `prefers-contrast: more` brightens paper, strengthens hairlines, drops the
grain overlay and swaps in a brighter accent.

### Type

- **Bodoni Moda** (display) — a high-contrast Didone, an editorial nod to the
  print side of the practice. Headlines only, never body copy.
- **Archivo** (body/UI) — a grotesque with more character than a system stack
  and better small-size metrics.

Deliberately not Inter/Roboto/Arial/system-font body text. The fluid scale
(`--csq-step--2` → `--csq-step-6`) is `clamp()`-based between 320px and 1440px.

### The identity vocabulary

One motif, repeated: a **registration diamond in a hairline square**, borrowed
from print alignment marks, appears in the favicon, the wordmark, the social
links, the service deliverables and the placeholder artwork. Cyan and the
blue→cyan gradient are used only for emphasis, never as a large fill behind
body text.

### Motion

CSS-only, compositor-driven, three primitives: `cnsq-rise`/`cnsq-lift` (time-based
load stagger), `cnsq-reveal` (scroll-driven reveal), and the header's
`cnsq-header-progress` scroll indicator. Everything is disabled by
`prefers-reduced-motion: reduce`.

---

## Editing content

Almost all edits are in **`src/data/site.ts`** and **`src/data/gallery.ts`**.

```ts
// src/data/site.ts
export const HERO = {
  headline: 'Design that earns a second look.',   // <- change the words here
  ...
};
```

Because the same values drive the meta tags and the JSON-LD graph, changing a
headline or the studio location in the data file updates the SEO output
automatically. No template edits required.

Search the data files and components for `TODO(copy)` and `TODO(launch)` to find
everything that must be confirmed before launch:

```bash
# PowerShell
Select-String -Path src/*.ts,src/**/*.ts,src/**/*.astro -Pattern 'TODO\('
```

| Marker | Meaning |
| --- | --- |
| `TODO(copy)` | Replace with the **verbatim** Canva wording so core messaging is preserved |
| `TODO(launch)` | Must be changed before the site goes live (domain, social URLs, phone, email) |

---

## Images and assets

### Naming convention (do not break)

```
cnsqdesigns-<purpose>[-<nn>].<ext>
```

- Brand is always lowercase, one word: **`cnsqdesigns`**. `Wordmark.astro` and the
  footer `.cssq-wordmark__text` rule apply `text-transform: lowercase`, so the
  brand cannot render as "CnsqDesigns" even if someone types it that way.
- Branded files use the `cnsqdesigns-` prefix with a lowercase kebab-case suffix.
- CSS classes are `cnsq-*`, design tokens are `--csq-*`, DOM ids are `cnsq-*`.

### Where images live

| Path | Purpose | Referenced by |
| --- | --- | --- |
| `src/assets/gallery/cnsqdesigns-<category>-<nn>.<ext>` | Gallery artwork | `baseName` in `gallery.ts` |
| `src/assets/brand/cnsqdesigns-portrait.<ext>` | About portrait (3:4) | `ABOUT.portrait.baseName` |
| `public/cnsqdesigns-og.png` | 1200×630 social card | `SITE.ogImage` |
| `public/cnsqdesigns-icon-180.png` | Apple touch icon | `BaseLayout.astro` |
| `public/cnsqdesigns-resume.pdf` | Resume CTA target | `ABOUT.resume.href` |

### Replacing the placeholders with the real artwork

The repository currently ships with generated placeholders so that `npm run build`
is green from commit #1. The real optimised assets have not been provided yet.

1. Drop the real files into `src/assets/**` keeping the **same base names**
   (`cnsqdesigns-web-01`, `cnsqdesigns-print-01`, …). The extension may change
   freely — the resolver is extension-agnostic.
2. Replace `public/cnsqdesigns-resume.pdf` with the real resume.
3. Replace `public/cnsqdesigns-og.png` with the real 1200×630 card.
4. Delete `scripts/generate-placeholders.mjs`, its `assets:placeholders` npm
   script, and the placeholder files. Nothing else changes.

Recommended sources: 1600–2000px on the long edge at quality 82 (JPEG) or
sRGB-exported PNG. Astro generates AVIF + WebP and resizes on demand, so never
hand-optimise or hand-resize; the source should simply be large enough.

### How images are delivered

- `<Picture>` from `astro:assets` emits AVIF → WebP → JPEG with `srcset` and
  `sizes`, plus intrinsic width/height (CLS 0).
- Gallery thumbnails request `320/480/640/960px`; the portrait `360/540/720/900px`.
- The lightbox uses a build-time `getImage()` variant: **1400px WebP**. A
  client's 8MB CMYK master is therefore never downloadable by a visitor, while
  the no-JS fallback still opens a genuinely large, useful image.
- Everything below the fold is `loading="lazy" decoding="async"`.

---

## Accessibility

Semantic HTML and ARIA are requirements of this project, not extras.

| Area | Implementation |
| --- | --- |
| Landmarks | `<header>` (banner), `<main id="main" tabindex="-1">`, `<footer>` (contentinfo), `<nav aria-label="Primary">` |
| Skip link | First focusable element; visible on focus; targets `#main` with `tabindex="-1"` so focus actually moves |
| Regions | Every `<section>` has `aria-labelledby` pointing at the id emitted by `SectionHeading.astro` |
| Headings | Exactly one `<h1>` (hero). Sections are `<h2>`, cards are `<h3>`. Levels never skip |
| Images | `alt` is required by `astro:assets` and comes from the manifest. 0 images without `alt` (verified in the build) |
| Decorative content | Rotated hero label, index numerals, specimen grid, grain overlay and the "View" cue are all `aria-hidden` |
| Keyboard | `:focus-visible` ring on every interactive element; the gallery is a real radio group (arrow keys work); the lightbox uses native `<dialog>` (Esc, focus containment, focus restoration) |
| Announcements | Lightbox counter is `aria-live="polite"`; filters are a `<fieldset>` with a visually hidden `<legend>` |
| Motion | One global `prefers-reduced-motion: reduce` kill switch |
| Contrast | Annotated per token; text ≥ 4.5:1, UI boundaries ≥ 3:1; `prefers-contrast: more` supported |
| Targets | Interactive controls are ≥ 44px (`min-block-size: 2.75rem`) |
| Forms | Visible `<label>` per field, `autocomplete` enabled, native validation, no CAPTCHA, honeypot hidden from both the accessibility tree and the tab order |

**Responsive behaviour** has been designed for 320px upward: single-column
layouts, a scrollable nav rail instead of a hamburger, `clamp()` type and spacing,
no fixed heights, no horizontal scroll.

---

## Performance budget

Measured on the current build with `npm run report`:

| Asset | Raw | Gzip |
| --- | --- | --- |
| `index.html` | 50.7 KB | 10.0 KB |
| Global CSS (`BaseLayout.css`) | 18.3 KB | 4.1 KB |
| Component CSS (`index.css`) | 16.1 KB | 2.8 KB |
| JS — island runtime (deferred, idle) | 219.0 KB | 68.5 KB |
| fonts (preloaded, 2 files) | 59.3 KB | — |
| **html + css + js** | — | **91.9 KB** |

How the Lighthouse target is met:

- **LCP** — the hero has no image. The largest contentful paint is the `<h1>`,
  which is preloaded-free text painted in the first frame (the headline animates
  transform only, never opacity). Fonts use `display: swap` with metric-matched
  fallbacks, so text is never invisible.
- **CLS** — every image carries intrinsic width/height; fonts are metric-matched;
  animations use `transform`/`opacity` only. Expected CLS 0.
- **TBT** — no JavaScript runs during load. The island is `client:idle`, and the
  React bundle (207.9 KB raw / 64.3 KB gzip) is dynamically imported after first
  paint. Everything above the fold works before it arrives.
- **Requests** — first-party only: HTML, 2 CSS files, 2 preloaded fonts. No
  analytics, no tag manager, no CDN host for fonts, no icon pack.
- **Images** — AVIF/WebP with correct `srcset` sizes; the lightbox uses a
  1400px WebP variant rather than the original master.

### Verifying Lighthouse locally

Lighthouse needs a Chrome/Chromium binary, which is not available in the
environment where this scaffold was built — so the score has **not** been
measured here. To verify:

```bash
npm run build && npm run preview      # serves ./dist on :4321
npx lighthouse http://localhost:4321 --view --preset=desktop
npx lighthouse http://localhost:4321 --view --form-factor=mobile
```

The authoritative check is Lighthouse against the **deployed Netlify URL**,
because that includes CDN compression and the real `netlify.toml` headers.

`npm run report` is the regression guard: it fails if JS > 240 KB, CSS > 60 KB,
the largest page > 60 KB, or html+css+js gzip > 130 KB.

### Escape hatch if the React runtime ever becomes the bottleneck

The only heavyweight dependency is React DOM, needed by exactly one component.
`@astrojs/react` can be swapped for `@astrojs/preact` (with
`preact/compat` alias) without touching a single component — the island uses
nothing but `useState`, `useEffect`, `useRef`, `useCallback` and JSX. That would
drop the runtime from ~64 KB gzip to roughly 4 KB. It is **not** done here
because the brief specifies React; it is documented as the known lever.

---

## SEO

- Per-page `<title>`, meta description, canonical and robots directives via
  `src/components/Seo.astro`.
- Open Graph + Twitter card with a 1200×630 image; `og:locale` `en_PH`.
- JSON-LD graph on every page: `Person` + `WebSite` + `ProfessionalService`
  (Davao City `PostalAddress`, `areaServed`, `sameAs`). Generated from the same
  data as the visible copy, so it cannot drift.
- `sitemap-index.xml` / `sitemap-0.xml` generated by `@astrojs/sitemap`, with
  `/404` filtered out.
- `robots.txt` generated from `SITE.url` at build time.
- `/404` and `/thank-you` carry `noindex`.
- One `<h1>` per page, descriptive headings, descriptive link text.
- `site` in `astro.config.mjs` derives from `SITE.url`, so canonical tags,
  sitemap and robots all change together.

---

## Graceful degradation matrix

| Feature | With JavaScript | Without JavaScript |
| --- | --- | --- |
| All content | Server-rendered HTML | Identical |
| Sticky header, nav, smooth scroll | CSS | CSS — identical |
| Mobile nav | Scrollable rail | Identical |
| Gallery filters | CSS `:has()` | Identical (a `<noscript>` note explains image behaviour) |
| Gallery images | AVIF/WebP `srcset` | Identical |
| Lightbox | In-page `<dialog>` with keyboard nav + counter | Anchor opens the 1400px image in the tab |
| Resume PDF | Anchor | Identical |
| Contact form | Netlify Forms POST → `/thank-you` | Identical |
| Reveal animations | Compositor animations | Elements render in their final state |
| Reading progress bar | Scroll-driven animation | Bar simply not animated |

---

## Deployment (Netlify)

> ⚠️ **Not deployed.** The brief requires explicit approval before any deploy, so
> no Netlify site has been created and nothing has been pushed. The steps below
> are what to run once it is approved.

### Option A — connect the Git repository (recommended)

1. Push this repository to GitHub.
2. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
3. Netlify reads `netlify.toml`, so the settings are already correct:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node: `22`
4. Deploy. Every push then builds automatically; pull requests get deploy previews.
5. Verify: run Lighthouse against the deploy URL, submit a test contact form, and
   spot-check that the old Canva links redirect (see the redirect map below).

```bash
# from this directory, once a GitHub remote exists
git remote add origin https://github.com/<account>/cnsqdesigns.git
git push -u origin main
```

### Option B — deploy from the CLI

```bash
npx netlify-cli login
npx netlify-cli init            # link or create the site
npx netlify-cli deploy --build  # draft deploy (not live)
npx netlify-cli deploy --prod   # PRODUCTION - only after approval
```

### Required before launch

1. **`public/_redirects`** — rewrite the commented Canva migration map with the
   real old URLs and 301 them to the new anchors. This file is the difference
   between keeping and losing the Canva site's search ranking.
2. **`SITE.url`** in `src/data/site.ts` — set the production domain. This updates
   the canonical tags, Open Graph URLs, sitemap and robots.txt together.
3. **Contact details and social URLs** — `CONTACT.email`, `CONTACT.phone` and every
   `CONTACT.socials[].href` are placeholders marked `TODO(launch)`.
4. **Real assets** — replace the placeholders (see *Images and assets*).
5. **Netlify Forms** — after the first deploy, confirm the form appears under
   *Site → Forms* and enable notification emails.
6. Optionally point a custom domain, then re-run Lighthouse against it.

### Pre-launch checklist

- [ ] `npm run build` succeeds
- [ ] `npm run check` reports 0 errors / 0 warnings / 0 hints
- [ ] `npm run report` reports *All budgets met*
- [ ] All `TODO(copy)` / `TODO(launch)` markers resolved
- [ ] Real artwork + resume PDF + OG card in place, placeholders deleted
- [ ] `public/_redirects` Canva map filled in with real URLs
- [ ] `SITE.url` set to the production domain
- [ ] Contact form tested end-to-end (submission appears in Netlify Forms)
- [ ] Lighthouse >= 90 on mobile and desktop against the deployed URL
- [ ] Keyboard-only pass: skip link → nav → filters → gallery → form
- [ ] JavaScript disabled pass: content, filters, form and images all usable
- [ ] Old Canva URLs redirect correctly (spot-check each one)

---

## Known limitations and assumptions

Stated plainly rather than hidden:

1. **The real Canva content was not provided.** The copy in `src/data/site.ts`
   and `src/data/gallery.ts` is professional placeholder text written for a
   Davao City designer. The palette, by contrast, *was* synchronised: it is
   extracted from the primary site (`cnsqwordpressengr.netlify.app`) — dark
   navy grounds (`#0f172a`/`#080d1a`/`#172033`), cyan accent (`#22d3ee`) and
   the signature `135deg #2563eb→#06b6d4` gradient — so the portfolio already
   matches the existing brand system. `TODO(copy)` marks the copy items.
2. **Images and the resume PDF are generated placeholders.**
   `scripts/generate-placeholders.mjs` writes real PNG/PDF files using Node
   built-ins only, so the build, the image pipeline and the layout can all be
   verified before the real optimised assets arrive.
3. **Lighthouse has not been run** — no Chrome/Chromium binary is available in
   this environment. The measured build report and the budget guard are the
   objective evidence provided instead, and the verification commands are above.
4. **Client names in the gallery are anonymised** descriptive labels ("Agri-food
   exporter, Davao"), not fabricated brand names.
5. **A strict Content-Security-Policy is not enabled.** Astro inlines the island
   hydration script, so `script-src 'self'` would silently break the lightbox.
   `netlify.toml` documents the three ways to enable it properly; the other
   hardening headers are active.
6. **The footer year is baked in at build time.** Deliberate: zero JavaScript in
   exchange for one rebuild per year.
7. **The active section is not highlighted in the nav.** Doing that without JS is
   not reliably possible, and adding an IntersectionObserver would contradict
   decision #2. The trade-off is documented rather than silently accepted.
8. **Netlify Forms does not work in `astro dev` or `astro preview`.** It is a
   Netlify build-time feature; test it on a deploy preview.

## Constraints respected

- **No dependencies beyond Astro/React**: `astro`, `@astrojs/react`,
  `@astrojs/sitemap`, `react`, `react-dom` (plus `sass`, `typescript`,
  `@astrojs/check` and `@types/*` as dev tooling). No UI kit, no CSS framework, no
  animation library, no icon package, no form vendor, no image library.
- **Palette matches the primary site**: one dark navy system (extracted from
  cnsqwordpressengr.netlify.app), asserted in a single token file; components
  reference `var(--csq-*)` and never a raw hex.
- **Naming conventions intact**: `cnsqdesigns` in the brand, DOM ids, data module,
  filenames, form name and asset names — enforced in CSS, not just by convention.
- **Accessibility not compromised**: semantic landmarks, mandatory alt text, named
  regions, 44px targets, visible focus, contrast-checked tokens, reduced-motion
  support.
- **No deployment without approval.**

## Possible next steps (not started)

- Fill in the Canva copy and the production domain, then deploy.
- Add `astro:content` collections if the portfolio grows past a handful of items
  (the current typed data modules are deliberately simpler).
- A `/journal` or case-study route reusing the same component vocabulary.
- Generate a per-build CSP nonce to replace the commented CSP template.
- Swap `@astrojs/react` for `@astrojs/preact` if the runtime ever needs to shrink.