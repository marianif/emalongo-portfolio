/**
 * Pure, environment-agnostic helpers for deriving artwork metadata from the
 * messy filenames the collection ships with. Extracted from `lib/artworks.ts`
 * so both the filesystem layer (build-time SSG) and the Cloudinary layer
 * (`lib/cloudinary.ts`, runtime API routes) parse identically — a work keeps
 * the SAME slug whether it's read off disk or fetched from the CDN, so the
 * per-slug overrides in `data/artworks.json` apply in both worlds.
 *
 * No `server-only`, no fs, no SDK — safe to import anywhere.
 */

export type Category = "dipinti" | "disegni" | "opere-digitali";

export const CATEGORIES: Category[] = ["dipinti", "disegni", "opere-digitali"];

export interface Artwork {
  /** Stable URL-safe id, derived from the filename (override-stable). */
  slug: string;
  /** Best-effort title in Italian, parsed from filename or overridden. */
  title: string;
  /** Optional English title (from overrides only). */
  titleEn?: string;
  /** Medium/technique, e.g. "tecnica mista su cartone". */
  technique?: string;
  /** Dimensions string, e.g. "70x50 cm". */
  dimensions?: string;
  /** Year or year range, e.g. "2020" or "2014-2017". */
  year?: string;
  category: Category;
  /** Delivery URL (or public path) to the source image. */
  src: string;
  /** Intrinsic pixel width of the source scan. */
  width: number;
  /** Intrinsic pixel height of the source scan. */
  height: number;
  /** width / height — the true aspect ratio, so images are never cropped. */
  aspect: number;
  /** Manual sort weight (lower = earlier). Defaults to Infinity. */
  order: number;
  /** Featured on the home page. */
  featured: boolean;
}

export interface ArtworkOverride {
  title?: string;
  titleEn?: string;
  technique?: string;
  dimensions?: string;
  year?: string;
  order?: number;
  featured?: boolean;
}

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

/** True for filenames we treat as deliverable artwork images. */
export function isImageFile(name: string): boolean {
  return IMAGE_RE.test(name);
}

/** Strip a known image extension from a filename, leaving the stem. */
export function stripExtension(name: string): string {
  return name.replace(IMAGE_RE, "");
}

/** Turn an arbitrary filename stem into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/['’.,()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Best-effort parse of the metadata baked into a filename stem.
 * Filenames loosely follow: Title-technique-dimensions-year, but separators
 * are wildly inconsistent, so we extract by pattern rather than by position.
 */
export function parseStem(stem: string): {
  title: string;
  technique?: string;
  dimensions?: string;
  year?: string;
} {
  // Normalise separators to spaces for parsing.
  const normalized = stem
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Year or year range: 4 digits, optionally -4digits.
  const yearMatch = normalized.match(/\b(\d{4}(?:\s*-\s*\d{4})?)\b/);
  const year = yearMatch?.[1]?.replace(/\s*-\s*/, "-");

  // Dimensions: "cm.70x50", "70×50", "cm 40,5x27", "formatoA4", "a4".
  const dimMatch = normalized.match(
    /\b(?:cm\.?\s*)?(\d{1,3}(?:[.,]\d+)?\s*[x×]\s*\d{1,3}(?:[.,]\d+)?)\b/i,
  );
  const a4Match = /\bformato\s*a4\b|\ba4\b/i.test(normalized);
  const dimensions = dimMatch
    ? dimMatch[1].replace(/×/g, "x").replace(/\s+/g, "") + " cm"
    : a4Match
      ? "A4"
      : undefined;

  // Technique: phrases starting with common medium keywords up to dims/year.
  const techMatch = normalized.match(
    /\b((?:tecnica mista|penna|pennarelli|acrilici|acquerelli|matita|china)[^]*?)(?=\bcm\.?\s*\d|\bformato|\b\d{4}\b|$)/i,
  );
  const technique = techMatch?.[1]
    ?.replace(/[,\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // Title = everything before the first metadata marker we found.
  const firstMarker = [
    techMatch?.index,
    dimMatch?.index,
    yearMatch?.index,
  ].filter((i): i is number => typeof i === "number");
  const cut = firstMarker.length ? Math.min(...firstMarker) : normalized.length;
  let title = normalized.slice(0, cut).replace(/[-\s,]+$/, "").trim();
  if (!title) title = normalized;

  return { title, technique, dimensions, year };
}

/**
 * Build an Artwork from a parsed filename plus a delivered image. Shared by the
 * filesystem and Cloudinary layers so the merge semantics (override wins over
 * parsed) are identical. `slug` keys into `overrides`; doc/comment keys
 * (prefixed `_`) never resolve.
 */
export function buildArtwork(params: {
  stem: string;
  category: Category;
  src: string;
  width: number;
  height: number;
  overrides: Record<string, ArtworkOverride>;
}): Artwork {
  const { stem, category, src, width, height, overrides } = params;
  const slug = slugify(stem);
  const parsed = parseStem(stem);
  const ov = (!slug.startsWith("_") && overrides[slug]) || {};

  return {
    slug,
    title: ov.title ?? parsed.title,
    titleEn: ov.titleEn,
    technique: ov.technique ?? parsed.technique,
    dimensions: ov.dimensions ?? parsed.dimensions,
    year: ov.year ?? parsed.year,
    category,
    src,
    width,
    height,
    aspect: width / height,
    order: ov.order ?? Number.POSITIVE_INFINITY,
    featured: ov.featured ?? false,
  };
}

/** Curated global sort: explicit order first, then Italian-collated title. */
export function sortArtworks(works: Artwork[]): Artwork[] {
  return works.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, "it");
  });
}
