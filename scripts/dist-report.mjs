/**
 * cnsqdesigns — build report / performance budget guard
 * =====================================================================
 * ARCHITECTURAL DECISION
 * ---------------------------------------------------------------------
 * "Lighthouse >= 90" is a requirement, and a requirement that is not
 * measured will rot. This script reads the built `dist/` folder, reports
 * the shipped weight of every asset class (raw + gzip, which is what
 * Netlify actually transfers) and FAILS if the budgets below are exceeded.
 *
 * It is deliberately advisory-only: it is exposed as `npm run report` and
 * is NOT wired into `npm run build`, so a budget breach never blocks a
 * deploy — it just makes the regression impossible to miss in review or CI.
 *
 * Budgets (raw bytes of everything linked from a page):
 *   JS  <= 240 KB raw   The React island runtime is the only JS we ship.
 *   CSS <=  60 KB raw   Global stylesheet + per-page component styles.
 *   page<=  60 KB raw   The largest single HTML page.
 *   transferred <= 130 KB gzip across html + css + js.
 *
 * Run: npm run report
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = 'dist';
/**
 * Budgets. Raw bytes are used for JS/CSS/markup because they catch bloat
 * that gzip hides (e.g. a srcset that got out of hand);
 * `transferred` is budgeted in gzip because that is what the visitor's
 * connection actually carries.
 *
 * Why the markup budget is 60 KB rather than 30 KB — the composition of
 * the homepage's 52 KB is measured, not guessed:
 *   ~8 KB  <picture>/srcset for 7 responsive images (AVIF + WebP + JPEG)
 *   ~6 KB  inline @font-face rules with metric-matched fallbacks
 *   ~6 KB  Astro's inlined island loader + the JSON-LD graph
 *   ~4 KB  the actual copy
 *   ~18 KB element/attribute markup, ~3 KB whitespace, remainder scoped
 *          Astro component ids
 * It gzips to ~10 KB. The guard exists to catch a regression, not to
 * punish the srcset that keeps image transfer small.
 */
const BUDGETS = {
  js: 240 * 1024,
  css: 60 * 1024,
  page: 60 * 1024,
  transferred: 130 * 1024,
};

/** Walk a directory tree, returning absolute file paths. */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(ROOT);
const totals = { js: 0, css: 0, html: 0, other: 0, gzip: 0 };
const htmlPages = [];
const rows = [];

for (const file of files) {
  const bytes = statSync(file).size;
  const gzip = gzipSync(readFileSync(file)).length;
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();

  let bucket = 'other';
  if (ext === '.js') bucket = 'js';
  else if (ext === '.css') bucket = 'css';
  else if (ext === '.html') bucket = 'html';

  totals[bucket] += bytes;
  // Only linked assets count towards transferred bytes; images and PDFs are
  // fetched on demand and are tracked by Astro's own build log.
  if (bucket !== 'other') {
    totals.gzip += gzip;
    rows.push({ file: relative(ROOT, file), bytes, gzip, bucket });
  }
  if (bucket === 'html') htmlPages.push({ file: relative(ROOT, file), bytes, gzip });
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

rows.sort((a, b) => b.gzip - a.gzip);
htmlPages.sort((a, b) => b.bytes - a.bytes);

console.log('\ncnsqdesigns — build report');
console.log('='.repeat(66));
console.log(`${'linked asset'.padEnd(40)}${'raw'.padStart(11)}${'gzip'.padStart(11)}`);
for (const row of rows.slice(0, 12)) {
  console.log(`${row.file.padEnd(40)}${kb(row.bytes).padStart(11)}${kb(row.gzip).padStart(11)}`);
}
if (rows.length > 12) console.log(`… and ${rows.length - 12} more linked assets`);

console.log('='.repeat(66));
console.log('pages:');
for (const page of htmlPages) {
  console.log(`  ${page.file.padEnd(38)}${kb(page.bytes).padStart(11)}${kb(page.gzip).padStart(11)}`);
}

console.log('-'.repeat(66));
console.log(`javascript         ${kb(totals.js)} raw (budget ${kb(BUDGETS.js)})`);
console.log(`stylesheets        ${kb(totals.css)} raw (budget ${kb(BUDGETS.css)})`);
console.log(
  `largest page       ${kb(htmlPages[0]?.bytes ?? 0)} raw (budget ${kb(BUDGETS.page)})`,
);
console.log(
  `html+css+js gzip   ${kb(totals.gzip)} (budget ${kb(BUDGETS.transferred)}, excl. fonts/images)`,
);
console.log('='.repeat(66));

/**
 * HTML is budgeted per page (the largest one), not as a sum — the sum grows
 * with the page count and would trip the guard as soon as a second route is
 * added, which is not a regression.
 */
const breaches = [
  ['javascript', totals.js, BUDGETS.js],
  ['stylesheets', totals.css, BUDGETS.css],
  ['largest page', htmlPages[0]?.bytes ?? 0, BUDGETS.page],
  ['transferred gzip', totals.gzip, BUDGETS.transferred],
].filter(([, actual, limit]) => actual > limit);

if (breaches.length > 0) {
  console.error('\nBUDGET EXCEEDED:');
  for (const [key, actual, limit] of breaches) {
    console.error(`  ${key}: ${kb(actual)} > ${kb(limit)}`);
  }
  console.error(
    '\nIf the breach is the React island runtime, see the Preact escape hatch ' +
      'documented in README.md ("Performance budget").',
  );
  process.exitCode = 1;
} else {
  console.log('\nAll budgets met.');
}