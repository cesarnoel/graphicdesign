/**
 * cnsqdesigns — lightbox island (React)
 * =====================================================================
 * This is the ONLY hydrated component on the site.
 *
 * ARCHITECTURAL DECISIONS
 * ---------------------------------------------------------------------
 * 1. ONE island, not one per image. The thumbnail grid is static HTML
 *    (GalleryItem.astro). This component renders a single empty <dialog>
 *    and delegates clicks from the grid, reading slide metadata out of
 *    `data-*` attributes on the anchors. Six images therefore cost one
 *    hydration instead of six, and the metadata lives in exactly one place.
 *
 * 2. PROGRESSIVE ENHANCEMENT IS THE WHOLE POINT. Each anchor already has a
 *    working `href` to a 1400px WebP, so with JavaScript disabled the
 *    gallery remains fully usable. This island only *upgrades* a click into
 *    an in-page dialog, and it steps aside for modified clicks
 *    (Ctrl/Cmd/Shift/middle-click) so "open in new tab" still works.
 *
 * 3. NATIVE <dialog> + showModal(). The browser provides the modal
 *    behaviours that are historically got wrong by hand: focus containment,
 *    Esc to close, an inert background, the top layer, and focus
 *    restoration to the trigger. Re-implementing those with divs would add
 *    both bugs and bytes. (Its styles live in
 *    src/styles/components/_lightbox.scss because a React component cannot
 *    use Astro's scoped <style> blocks.)
 *
 * 4. `client:idle`, not `client:visible`. The dialog is `display: none`
 *    until opened, so it has no layout box and an IntersectionObserver-based
 *    directive would never fire reliably. Idle hydration happens after
 *    first paint and stays out of the LCP path.
 *
 * 5. Accessibility: the dialog is labelled by the slide title, the counter
 *    is a polite live region so slide changes are announced, arrow keys /
 *    Home / End navigate, and images keep their manifest `alt` text.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

interface Slide {
  readonly src: string;
  readonly title: string;
  readonly summary: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

/** Anchors opt in with this attribute; see GalleryItem.astro. */
const TRIGGER_SELECTOR = '[data-cnsq-lightbox]';
const GRID_ID = 'cnsq-gallery-grid';

function readSlide(trigger: Element): Slide {
  const image = trigger.querySelector('img');
  return {
    src: trigger.getAttribute('data-lightbox-src') ?? trigger.getAttribute('href') ?? '',
    title: trigger.getAttribute('data-lightbox-title') ?? '',
    summary: trigger.getAttribute('data-lightbox-summary') ?? '',
    alt: image?.getAttribute('alt') ?? '',
    width: Number(trigger.getAttribute('data-lightbox-width') ?? '0'),
    height: Number(trigger.getAttribute('data-lightbox-height') ?? '0'),
  };
}

export default function Lightbox() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [slides, setSlides] = useState<readonly Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  /* Read slides from the server-rendered DOM and bind ONE delegated click
     handler, so the cost stays flat as the portfolio grows. */
  useEffect(() => {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    const triggers = Array.from(grid.querySelectorAll(TRIGGER_SELECTOR));
    setSlides(triggers.map(readSlide));

    const onClick = (event: MouseEvent) => {
      // Respect the user's intent: modified clicks keep the plain-link
      // behaviour (new tab / download) instead of being hijacked.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const { target } = event;
      if (!(target instanceof Element)) return;

      const trigger = target.closest(TRIGGER_SELECTOR);
      if (!trigger || !grid.contains(trigger)) return;

      const position = Number(trigger.getAttribute('data-lightbox-position') ?? '0');
      event.preventDefault();
      setActiveIndex(Number.isFinite(position) && position >= 0 ? position : 0);
    };

    grid.addEventListener('click', onClick);
    return () => grid.removeEventListener('click', onClick);
  }, []);

  /* Open/close the native dialog in response to state. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeIndex === null) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) {
      // showModal() moves the dialog into the top layer, makes the rest of
      // the page inert, and installs Esc + focus containment for free.
      dialog.showModal();
    }
  }, [activeIndex]);

  const step = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (current === null || slides.length === 0) return current;
        return (current + delta + slides.length) % slides.length;
      });
    },
    [slides.length],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDialogElement>) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          step(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          step(-1);
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(slides.length - 1);
          break;
        default:
          break;
      }
    },
    [slides.length, step],
  );

  /* Clicking the dialog's own backdrop area (the dialog element itself,
     never its controls) closes it — the behaviour people expect. */
  const onDialogClick = useCallback((event: ReactMouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) dialogRef.current?.close();
  }, []);

  const active = activeIndex === null ? null : (slides[activeIndex] ?? null);
  const hasSlides = slides.length > 0;

  return (
    <dialog
      ref={dialogRef}
      className="cnsq-lightbox"
      aria-labelledby="cnsq-lightbox-title"
      onKeyDown={onKeyDown}
      onClick={onDialogClick}
      onClose={() => setActiveIndex(null)}
    >
      {active && (
        <div className="cnsq-lightbox__panel">
          <div className="cnsq-lightbox__bar">
            {/* aria-live so moving between slides is announced, and not
                just seen. */}
            <p className="cnsq-lightbox__counter" aria-live="polite">
              {activeIndex !== null ? activeIndex + 1 : 0} / {slides.length}
            </p>
            <button
              type="button"
              className="cnsq-lightbox__button cnsq-lightbox__button--close"
              onClick={() => dialogRef.current?.close()}
            >
              Close<span className="cnsq-visually-hidden"> the lightbox</span>
            </button>
          </div>

          <figure className="cnsq-lightbox__figure">
            <img
              key={active.src}
              className="cnsq-lightbox__image"
              src={active.src}
              alt={active.alt}
              width={active.width || undefined}
              height={active.height || undefined}
              decoding="async"
            />
            <figcaption className="cnsq-lightbox__caption">
              <h3 className="cnsq-lightbox__title" id="cnsq-lightbox-title">
                {active.title}
              </h3>
              <p className="cnsq-lightbox__summary">{active.summary}</p>
            </figcaption>
          </figure>

          <div className="cnsq-lightbox__nav">
            <button
              type="button"
              className="cnsq-lightbox__button"
              onClick={() => step(-1)}
              disabled={!hasSlides}
            >
              Previous
            </button>
            <button
              type="button"
              className="cnsq-lightbox__button"
              onClick={() => step(1)}
              disabled={!hasSlides}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}