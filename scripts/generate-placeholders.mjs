/**
 * cnsqdesigns — placeholder asset generator
 * =====================================================================
 * ARCHITECTURAL DECISION
 * ---------------------------------------------------------------------
 * The real "optimized image assets" for this portfolio are supplied
 * separately. To keep the repository *buildable and verifiable* in the
 * meantime (so `npm run build`, `astro check` and CI are green from
 * commit #1), this script writes deterministic, dependency-free
 * placeholder files using only Node built-ins:
 *
 *   src/assets/gallery/cnsqdesigns-*.jpg|png   gallery specimens
 *   src/assets/brand/cnsqdesigns-portrait.jpg  about-section portrait
 *   public/cnsqdesigns-og.png                  social/OG card (1200x630)
 *   public/cnsqdesigns-resume.pdf              the PDF resume button target
 *
 * It implements a minimal PNG encoder (IHDR/IDAT/IEND + CRC32) and a
 * minimal single-page PDF writer, deliberately avoiding `sharp`,
 * `canvas` or any other native/image dependency.
 *
 * WHEN THE REAL ASSETS ARRIVE:
 *   1. Drop them into src/assets/** keeping the exact same filenames
 *      (see src/data/gallery.ts for the manifest).
 *   2. Delete this script + the `assets:placeholders` npm script.
 *   3. Nothing else changes — components reference the manifest, not
 *      the file system.
 *
 * Run: npm run assets:placeholders
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * Brand palette (mirror of src/styles/abstracts/_tokens.scss).
 * Kept as plain RGB tuples because PNG pixels need 8-bit channels.
 * ------------------------------------------------------------------ */
const INK = [15, 15, 14];
const INK_RAISED = [21, 23, 26];
const INK_SURFACE = [31, 35, 40];
const LINE = [64, 69, 76];
const PAPER = [245, 242, 236];
const PAPER_MUTED = [166, 169, 174];
const ACCENT = [239, 83, 51];
const ACCENT_DEEP = [200, 64, 31];

/* ------------------------------------------------------------------ *
 * PNG encoder
 * ------------------------------------------------------------------ */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

/** Encode an RGBA PNG. `draw(x, y)` returns a 4-tuple. */
function encodePng(width, height, draw) {
  const stride = width * 4 + 1; // +1 filter byte per scanline
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter type 0 (None) keeps the encoder trivial
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = draw(x, y);
      const o = rowStart + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a === undefined ? 255 : a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour + alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ *
 * Drawing helpers (normalised 0..1 coordinates)
 * ------------------------------------------------------------------ */
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/**
 * Every placeholder shares the same "press specimen sheet" language:
 * a faint diagonal paper tooth, an inner hairline frame, registration
 * corner marks, one dominance block and a single vermilion accent bar.
 * Variety comes from `variant`, so all six gallery entries are
 * instantly distinguishable while staying on brand.
 */
function specimen({ variant, orientation }) {
  const blocks = [
    { fill: INK_SURFACE, rect: [0.08, 0.1, 0.92, 0.62], bar: 0.72 },
    { fill: INK_RAISED, rect: [0.08, 0.3, 0.58, 0.92], bar: 0.2 },
    { fill: INK_SURFACE, rect: [0.36, 0.08, 0.92, 0.86], bar: 0.5 },
  ];
  const scheme = blocks[variant % blocks.length];
  const weight = orientation === 'portrait' ? variant + 1 : variant;

  const INSET = 0.08;
  const ARM = 0.05;
  const CORNERS = [
    [INSET, INSET],
    [1 - INSET, INSET],
    [INSET, 1 - INSET],
    [1 - INSET, 1 - INSET],
  ];

  return (x, y, w, h) => {
    const u = x / (w - 1);
    const v = y / (h - 1);

    // 1. Paper tooth — keeps large flat areas from looking dead.
    let px = mix(INK, INK_RAISED, (x + y) % 14 < 1 ? 1 : 0.35);

    // 2. Dominance block.
    const [x0, y0, x1, y1] = scheme.rect;
    if (u > x0 && u < x1 && v > y0 && v < y1) px = scheme.fill;

    // 3. Vermilion accent bar — the one sharp colour note.
    if (v > scheme.bar && v < scheme.bar + 0.014 && u > INSET && u < 1 - INSET) {
      px = weight % 2 === 0 ? ACCENT : ACCENT_DEEP;
    }

    // 4. Inner hairline frame.
    const hair = 0.0035;
    const nearV = Math.abs(u - INSET) < hair || Math.abs(u - (1 - INSET)) < hair;
    const nearH = Math.abs(v - INSET) < hair || Math.abs(v - (1 - INSET)) < hair;
    if ((nearV && v > INSET && v < 1 - INSET) || (nearH && u > INSET && u < 1 - INSET)) {
      px = LINE;
    }

    // 5. Registration marks — print-studio motif, drawn pointing inward.
    for (const [cx, cy] of CORNERS) {
      const inwardX = cx < 0.5 ? u > cx : u < cx;
      const inwardY = cy < 0.5 ? v > cy : v < cy;
      const onArmH = Math.abs(v - cy) < 0.0022 && Math.abs(u - cx) < ARM && inwardX;
      const onArmV = Math.abs(u - cx) < 0.0022 && Math.abs(v - cy) < ARM && inwardY;
      if (onArmH || onArmV) px = PAPER_MUTED;
    }

    return [px[0], px[1], px[2], 255];
  };
}

/* ------------------------------------------------------------------ *
 * Minimal single-page PDF — the target of the "Resume (PDF)" CTA.
 * Hand-written rather than pulled from a formatter library so the
 * repository keeps its zero-extra-dependency guarantee.
 * ------------------------------------------------------------------ */
function buildResumePdf() {
  const lines = [
    { size: 22, text: 'cnsqdesigns' },
    { size: 11, text: 'Graphic Designer - Davao City, Philippines' },
    { size: 11, text: 'PLACEHOLDER FILE' },
    { size: 10, text: 'Replace public/cnsqdesigns-resume.pdf with the real resume.' },
    { size: 10, text: 'Layout . Branding . Print . E-book design . 18+ years of practice' },
  ];

  const textOps = lines
    .map(
      (line, index) =>
        `/F1 ${line.size} Tf\n50 ${770 - index * 30} Td\n(${line.text.replace(/[()\\]/g, '\\$&')}) Tj\n`,
    )
    .join('');

  const content = `BT\n1 0 0 1 0 0 Tm\n${textOps}ET\n`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
      + '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream`,
    '<< /Title (cnsqdesigns - Resume) /Author (cnsqdesigns) /Creator (cnsqdesigns) >>',
  ];

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets = [];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(header + body, 'latin1'));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>`,
    'startxref',
    String(Buffer.byteLength(header + body, 'latin1')),
    '%%EOF',
    '',
  ].join('\n');

  return Buffer.from(header + body + xref, 'latin1');
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ *
 * ARCHITECTURAL DECISION — extension-agnostic asset names.
 * Gallery entries are declared by *base name* (see src/data/gallery.ts)
 * and resolved by src/lib/images.ts against any supported extension.
 * That is why the placeholder can ship as a .png today and be replaced
 * by a production-grade .jpg/.webp/.avif tomorrow without touching a
 * single component or data entry.
 */
const TARGETS = [
  { file: 'src/assets/gallery/cnsqdesigns-web-01.png', width: 1600, height: 1000, variant: 0, orientation: 'landscape' },
  { file: 'src/assets/gallery/cnsqdesigns-web-02.png', width: 1600, height: 1000, variant: 1, orientation: 'landscape' },
  { file: 'src/assets/gallery/cnsqdesigns-print-01.png', width: 1200, height: 1500, variant: 2, orientation: 'portrait' },
  { file: 'src/assets/gallery/cnsqdesigns-print-02.png', width: 1200, height: 1500, variant: 0, orientation: 'portrait' },
  { file: 'src/assets/gallery/cnsqdesigns-ebook-01.png', width: 1400, height: 1200, variant: 1, orientation: 'landscape' },
  { file: 'src/assets/gallery/cnsqdesigns-ebook-02.png', width: 1400, height: 1200, variant: 2, orientation: 'landscape' },
  // About-section portrait, 3:4.
  { file: 'src/assets/brand/cnsqdesigns-portrait.png', width: 900, height: 1200, variant: 2, orientation: 'portrait' },
  // Open Graph / social card — platform convention is 1200x630.
  { file: 'public/cnsqdesigns-og.png', width: 1200, height: 630, variant: 1, orientation: 'landscape' },
  // Apple touch icon — 180x180, referenced by BaseLayout.astro.
  { file: 'public/cnsqdesigns-icon-180.png', width: 180, height: 180, variant: 0, orientation: 'landscape' },
];

let written = 0;

for (const target of TARGETS) {
  const absolute = resolve(ROOT, target.file);
  mkdirSync(dirname(absolute), { recursive: true });
  const png = encodePng(target.width, target.height, specimen(target));
  writeFileSync(absolute, png);
  written += 1;
  process.stdout.write(
    `  png  ${target.file}  ${target.width}x${target.height}  ${(png.length / 1024).toFixed(1)} KB\n`,
  );
}

const resumePath = resolve(ROOT, 'public/cnsqdesigns-resume.pdf');
mkdirSync(dirname(resumePath), { recursive: true });
writeFileSync(resumePath, buildResumePdf());
written += 1;
process.stdout.write(`  pdf  public/cnsqdesigns-resume.pdf  ${(buildResumePdf().length / 1024).toFixed(1)} KB\n`);

process.stdout.write(`\n${written} placeholder assets written under ${ROOT}\n`);