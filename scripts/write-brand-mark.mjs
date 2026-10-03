import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * cnsqdesigns — brand-mark writer (one-shot, then delete).
 * Redraws the supplied double-chevron logo as vector SVG so the header
 * and the favicon share one sharp source file at every size.
 * Replace `src/assets/brand/cnsqdesigns-mark.svg` with the original
 * artwork file if a higher-fidelity source arrives — same filename,
 * nothing else changes.
 */
const MARK_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" role="img" aria-label="cnsqdesigns">',
  '<defs>',
  '<linearGradient id="cnsqbrand-p" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0" stop-color="#4c1d95"/><stop offset="1" stop-color="#a855f7"/>',
  '</linearGradient>',
  '<linearGradient id="cnsqbrand-b" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#c7d7fe"/>',
  '</linearGradient>',
  '</defs>',
  '<g fill="none" stroke-linecap="square" stroke-width="13">',
  '<path d="M22 10 46 32 22 54" stroke="url(#cnsqbrand-p)"/>',
  '<path d="M58 10 82 32 58 54" stroke="url(#cnsqbrand-b)"/>',
  '<path d="M22 46 14 54" stroke="#1e1b4b"/>',
  '<path d="M74 18 82 10" stroke="#1e40af"/>',
  '</g>',
  '</svg>',
].join('');

writeFileSync(new URL('../public/favicon.svg', import.meta.url), MARK_SVG);
writeFileSync(new URL('../src/assets/brand/cnsqdesigns-mark.svg', import.meta.url), MARK_SVG);
console.log('svg bytes:', MARK_SVG.length);

const NAVY = { r: 15, g: 23, b: 42, alpha: 1 };
const iconPath = fileURLToPath(new URL('../public/cnsqdesigns-icon-180.png', import.meta.url));
await sharp(Buffer.from(MARK_SVG), { density: 384 })
  .resize(180, 180, { fit: 'contain', background: NAVY })
  .png()
  .toFile(iconPath);
console.log('icon-180 written');

