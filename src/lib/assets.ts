import type { ImageMetadata } from 'astro';

/**
 * cnsqdesigns — asset resolver
 * =====================================================================
 * ARCHITECTURAL DECISION — extension-agnostic image lookup.
 * ---------------------------------------------------------------------
 * Vite's `import.meta.glob` runs at build time and hands back typed
 * `ImageMetadata` for every image under src/assets. Keying that map by
 * *base name* (filename without its extension) means the content layer
 * never has to know whether a given artwork is a placeholder .png or the
 * final .avif — which is exactly the situation during this migration,
 * where assets arrive separately from the code.
 *
 * Benefits:
 *   - zero runtime cost: the map is a build-time constant,
 *   - adding/replacing an image is a file drop, not a code change,
 *   - `requireAsset()` fails the build loudly instead of shipping a
 *     broken <img>, so a missing asset can never reach production,
 *   - Astro still performs full optimisation (resize, AVIF/WebP) because
 *     the components receive real ImageMetadata, not a string path.
 */

/** Every optimisable image in the project, eagerly imported at build time. */
const assetModules = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>;

const assetsByBaseName: ReadonlyMap<string, ImageMetadata> = new Map(
  Object.entries(assetModules).flatMap(([modulePath, image]) => {
    const fileName = modulePath.split('/').pop();
    if (!fileName) return [];
    const baseName = fileName.replace(/\.[^.]+$/, '');
    return [[baseName, image] as const];
  }),
);

/** Look up an image by base name. Returns undefined when absent. */
export function findAsset(baseName: string): ImageMetadata | undefined {
  return assetsByBaseName.get(baseName);
}

/**
 * Look up an image by base name, failing the build when it is missing.
 * Used wherever a missing image would be a content bug rather than a
 * design choice.
 */
export function requireAsset(baseName: string): ImageMetadata {
  const asset = findAsset(baseName);
  if (!asset) {
    throw new Error(
      `[cnsqdesigns] Missing image "${baseName}". Expected ` +
        `src/assets/**/${baseName}.{png,jpg,jpeg,webp,avif}. ` +
        'Run `npm run assets:placeholders` to regenerate the placeholders.',
    );
  }
  return asset;
}

/** Base names currently available — useful for the /404 and dev diagnostics. */
export function listAssetBaseNames(): readonly string[] {
  return [...assetsByBaseName.keys()].sort();
}