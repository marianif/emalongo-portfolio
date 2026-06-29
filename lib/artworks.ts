import "server-only";
import {
  getAllArtworks,
  getArtworksByCategory,
  getArtworkBySlug,
  getFeaturedArtworks,
} from "./cloudinary";
import type { Artwork, Category } from "./artwork-parse";

/**
 * Public data layer for the artwork collection.
 *
 * Source of truth = Cloudinary (lib/cloudinary.ts fetches + maps the media
 * library; curation lives in data/artworks.json, merged per-slug). This module
 * re-exports the core fetchers and adds the derived helpers the pages need
 * (hero, featured-rest, neighbours, menu faces).
 *
 * Everything is async now (the data comes off the network), so call sites
 * `await` these. server-only — never import from a Client Component; pass the
 * resolved plain `Artwork` objects down as props instead.
 */

export type { Artwork, Category } from "./artwork-parse";
export { CATEGORIES } from "./artwork-parse";
export {
  getAllArtworks,
  getArtworksByCategory,
  getFeaturedArtworks,
  getArtworkBySlug,
} from "./cloudinary";

/**
 * The home-page hero: the featured work with the lowest order (the curated
 * `order: 0` piece). Falls back to the first featured, then the first work
 * overall, so the hero is never empty.
 */
export async function getHeroArtwork(): Promise<Artwork | undefined> {
  const featured = await getFeaturedArtworks();
  return featured[0] ?? (await getAllArtworks())[0];
}

/** Featured works excluding the hero, in curated order. */
export async function getFeaturedRest(): Promise<Artwork[]> {
  const [hero, featured] = await Promise.all([
    getHeroArtwork(),
    getFeaturedArtworks(),
  ]);
  return featured.filter((w) => w.slug !== hero?.slug);
}

/**
 * The works flanking a given slug in the global curated order — the same order
 * the constellation gallery presents, so walking prev/next from the detail page
 * is continuous with the wall the visitor just left (never category-scoped).
 * Endpoints have an undefined neighbour; the detail page omits that control
 * rather than pointing nowhere. The collection does not wrap.
 */
export async function getArtworkNeighbors(slug: string): Promise<{
  prev?: Artwork;
  next?: Artwork;
}> {
  const all = await getAllArtworks();
  const i = all.findIndex((w) => w.slug === slug);
  if (i === -1) return {};
  return { prev: all[i - 1], next: all[i + 1] };
}

/**
 * Curated "faces" for the menu voices. These are menu chrome, not catalogue
 * works, so they're committed static images under `public/menu/` (and the
 * artist portrait at the public root) rather than fetched from Cloudinary —
 * the Index renders identically without a network round-trip, and the menu
 * stays decoupled from the catalogue. Swap these files to restyle a voice.
 */
const MENU_FACES: Record<string, string> = {
  opere: "/menu/opere.jpg",
  // bio uses the artist's portrait, set directly in the layout.
  visione: "/menu/visione.jpg",
};

/** Resolve the static cover image path for a given menu voice key. */
export function getMenuFace(key: string): string | undefined {
  return MENU_FACES[key];
}

// Re-exported for callers that referenced the type locally.
export type { Category as ArtworkCategory };
