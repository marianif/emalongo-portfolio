import "server-only";
import fs from "node:fs";
import path from "node:path";
import overrides from "@/data/artworks.json";

/**
 * Data layer for the artwork collection.
 *
 * Source of truth = the image files in `public/artworks/<category>/`.
 * Filenames already encode title / technique / dimensions / year, but
 * inconsistently (spaces, degree symbols, typos, "×" vs "x"). We parse them
 * best-effort at build time, then merge per-slug corrections from
 * `data/artworks.json` (English titles, fixed titles, ordering, featured).
 *
 * This module is server-only — it touches the filesystem and runs during SSG.
 */

export type Category = "dipinti" | "disegni" | "opere-digitali";

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
  /** Public path to the source image, e.g. "/artworks/dipinti/foo.png". */
  src: string;
  /** Manual sort weight (lower = earlier). Defaults to Infinity. */
  order: number;
  /** Featured on the home page. */
  featured: boolean;
}

interface ArtworkOverride {
  title?: string;
  titleEn?: string;
  technique?: string;
  dimensions?: string;
  year?: string;
  order?: number;
  featured?: boolean;
}

const ARTWORKS_DIR = path.join(process.cwd(), "public", "artworks");

/** Map the on-disk folder names to clean category ids. */
const CATEGORY_BY_DIR: Record<string, Category> = {
  dipinti: "dipinti",
  disegni: "disegni",
  "opere-digitali-1-selezione_(2020)": "opere-digitali",
  "opere-digitali-2-selezione_(2020-2021)": "opere-digitali",
  "opere-digitali-3-selezione_(2022-2023)": "opere-digitali",
};

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

const overrideMap = overrides as Record<string, ArtworkOverride>;

/** Turn an arbitrary filename stem into a URL-safe slug. */
function slugify(input: string): string {
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
function parseStem(stem: string): {
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

let cache: Artwork[] | null = null;

/** Read + parse all artworks once per process. */
export function getAllArtworks(): Artwork[] {
  if (cache) return cache;

  const works: Artwork[] = [];

  for (const dir of Object.keys(CATEGORY_BY_DIR)) {
    const abs = path.join(ARTWORKS_DIR, dir);
    if (!fs.existsSync(abs)) continue;
    const category = CATEGORY_BY_DIR[dir];

    for (const file of fs.readdirSync(abs)) {
      if (!IMAGE_RE.test(file)) continue;
      const stem = file.replace(IMAGE_RE, "");
      const slug = slugify(stem);
      const parsed = parseStem(stem);
      const ov = (!slug.startsWith("_") && overrideMap[slug]) || {};

      works.push({
        slug,
        title: ov.title ?? parsed.title,
        titleEn: ov.titleEn,
        technique: ov.technique ?? parsed.technique,
        dimensions: ov.dimensions ?? parsed.dimensions,
        year: ov.year ?? parsed.year,
        category,
        src: `/artworks/${dir}/${file}`,
        order: ov.order ?? Number.POSITIVE_INFINITY,
        featured: ov.featured ?? false,
      });
    }
  }

  works.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, "it");
  });

  cache = works;
  return works;
}

export function getArtworksByCategory(category: Category): Artwork[] {
  return getAllArtworks().filter((w) => w.category === category);
}

export function getFeaturedArtworks(): Artwork[] {
  return getAllArtworks().filter((w) => w.featured);
}

/**
 * The home-page hero: the featured work with the lowest order (the curated
 * `order: 0` piece). Falls back to the first featured, then the first work
 * overall, so the hero is never empty.
 */
export function getHeroArtwork(): Artwork | undefined {
  const featured = getFeaturedArtworks();
  return featured[0] ?? getAllArtworks()[0];
}

/** Featured works excluding the hero, in curated order. */
export function getFeaturedRest(): Artwork[] {
  const hero = getHeroArtwork();
  return getFeaturedArtworks().filter((w) => w.slug !== hero?.slug);
}

export function getArtworkBySlug(slug: string): Artwork | undefined {
  return getAllArtworks().find((w) => w.slug === slug);
}

export const CATEGORIES: Category[] = ["dipinti", "disegni", "opere-digitali"];
