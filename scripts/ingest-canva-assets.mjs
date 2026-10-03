/**
 * cnsqdesigns — Canva asset ingest (one-shot migration helper)
 * =====================================================================
 * Reads the original-resolution downloads in .work/canva-img/ (fetched
 * from the Canva demo site), downscales the oversized masters to sane
 * web dimensions, and writes them into src/assets/ with cnsqdesigns-*
 * names. Astro's <Picture>/getImage() pipeline then produces the AVIF /
 * WebP / JPEG responsive variants at build time, so this script only
 * needs to keep the *source* files a reasonable size.
 *
 * Run:  node scripts/ingest-canva-assets.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = (f) => path.join(root, '.work', 'canva-img', f);
const dst = (...p) => path.join(root, 'src', 'assets', ...p);

/** [source file, destination, max dimension (long edge), jpeg quality] */
const JOBS = [
  ['d3466841d4a6bb18a0d8f8cf7eed9c5f.jpg', dst('brand', 'cnsqdesigns-portrait.jpg'), 1200, 80],
  ['ab1b438e50cdfd22c28e67fa712c2e18.jpg', dst('gallery', 'cnsqdesigns-web-01.jpg'), 1600, 78],
  ['754d513c3fd4333d2a25231aad61a9c7.jpg', dst('gallery', 'cnsqdesigns-web-02.jpg'), 1600, 78],
  ['e9d1a6606856e0c31fc5ea0566a53ae8.jpg', dst('gallery', 'cnsqdesigns-web-03.jpg'), 1600, 78],
  ['8ff2249a2d7d34e2290a60c3cafb3422.jpg', dst('gallery', 'cnsqdesigns-print-01.jpg'), 1200, 80],
  ['5a34641c6dfbc1e3693cdeaa91e16c1c.jpg', dst('gallery', 'cnsqdesigns-print-02.jpg'), 1200, 80],
  ['57840b2a42ffeb912e9e79f4ae30cf6a.png', dst('gallery', 'cnsqdesigns-print-03.jpg'), 1200, 80],
  ['29d609f7f797e369c6406804dcebde0d.jpg', dst('gallery', 'cnsqdesigns-ebook-01.jpg'), 1200, 80],
  ['36a48c615f7385c348a17ec450c7ccde.jpg', dst('gallery', 'cnsqdesigns-ebook-02.jpg'), 1200, 80],
  ['dae167fba92eefb633f40b44c46423e5.jpg', dst('gallery', 'cnsqdesigns-ebook-03.jpg'), 1200, 80],
];

for (const [file, out, maxEdge, quality] of JOBS) {
  const input = src(file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(input)
    .rotate() // honour EXIF orientation before measuring
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(out + '.tmp');
  fs.renameSync(out + '.tmp', out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${path.basename(out)}  ${kb}KB`);
}
console.log('ingest done');
