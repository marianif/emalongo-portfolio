import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import overrides from "@/data/artworks.json";
import {
  buildArtwork,
  isImageFile,
  sortArtworks,
  stripExtension,
  type Artwork,
  type ArtworkOverride,
  type Category,
} from "./artwork-parse";

/**
 * Cloudinary-backed data layer for the artwork collection.
 *
 * Source of truth = the assets in your Cloudinary media library, foldered to
 * mirror the local `public/artworks/<category>/` hierarchy:
 *
 *   artworks/dipinti
 *   artworks/disegni
 *   artworks/opere-digitali-1-selezione_(2020)
 *   artworks/opere-digitali-2-selezione_(2020-2021)
 *   artworks/opere-digitali-3-selezione_(2022-2023)
 *
 * Asset filenames keep the same descriptive naming as on disk, so titles /
 * technique / dimensions / year are parsed the same way and each work keeps the
 * SAME slug. That means the per-slug curation in `data/artworks.json` (English
 * titles, fixed titles, `order`, `featured`) still applies.
 *
 * server-only — uses the API secret. Never import from a Client Component.
 */

export type { Artwork, Category } from "./artwork-parse";
export { CATEGORIES } from "./artwork-parse";

const overrideMap = overrides as Record<string, ArtworkOverride>;

/** Where the prebuild step writes the fetched collection. */
const MANIFEST_PATH = path.join(process.cwd(), "data", "cloudinary-manifest.json");

/**
 * Cloudinary asset-folder paths grouped by clean category id. Multiple physical
 * folders can fold into one category (the three digital selections → one
 * "opere-digitali"), exactly like the filesystem layer's CATEGORY_BY_DIR.
 */
const FOLDERS_BY_CATEGORY: Record<Category, string[]> = {
  dipinti: ["artworks/dipinti"],
  disegni: ["artworks/disegni"],
  "opere-digitali": [
    "artworks/opere-digitali-1-selezione_(2020)",
    "artworks/opere-digitali-2-selezione_(2020-2021)",
    "artworks/opere-digitali-3-selezione_(2022-2023)",
  ],
};

let configured = false;

/** Configure the SDK from env on first use; throws a clear error if unset. */
function ensureConfigured(): void {
  if (configured) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local " +
        "(see .env.local.example).",
    );
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
}

/** Cloudinary Admin API resource shape (the fields we consume). */
interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  /** Original upload filename without extension (when available). */
  filename?: string;
  format: string;
}

/**
 * List every image asset in one Cloudinary asset folder, following pagination.
 * `resources_by_asset_folder` lists by the *display* folder (the one shown in
 * the Media Library UI), not by public_id prefix — which is what you get when
 * you organise assets via the console.
 */
async function listFolder(folder: string): Promise<CloudinaryResource[]> {
  const out: CloudinaryResource[] = [];
  let next_cursor: string | undefined;

  do {
    const res = (await cloudinary.api.resources_by_asset_folder(folder, {
      resource_type: "image",
      max_results: 100,
      next_cursor,
      fields: "public_id,secure_url,width,height,format,filename",
    })) as { resources: CloudinaryResource[]; next_cursor?: string };

    out.push(...res.resources);
    next_cursor = res.next_cursor;
  } while (next_cursor);

  return out;
}

/**
 * Derive the filename stem we parse metadata from. Prefer the original upload
 * `filename`; fall back to the last segment of the public_id. Either way we
 * strip any trailing extension so parsing matches the filesystem layer.
 */
function stemOf(r: CloudinaryResource): string {
  const base = r.filename ?? r.public_id.split("/").pop() ?? r.public_id;
  return stripExtension(base);
}

let cache: Artwork[] | null = null;

/**
 * Live fetch + map of the whole collection straight from the Cloudinary Admin
 * API. Hits the network and is rate-limited (500 req/hr), so prefer
 * `getAllArtworks()`, which reads the prebuilt manifest first. Exposed for the
 * prebuild script (scripts/build-cloudinary-manifest.mjs) and as the runtime
 * fallback when no manifest is on disk.
 */
export async function fetchArtworksFromCloudinary(): Promise<Artwork[]> {
  ensureConfigured();

  const categories = Object.keys(FOLDERS_BY_CATEGORY) as Category[];

  const perCategory = await Promise.all(
    categories.map(async (category) => {
      const folders = FOLDERS_BY_CATEGORY[category];
      const resources = (await Promise.all(folders.map(listFolder))).flat();

      return resources
        .filter((r) => isImageFile(`${stemOf(r)}.${r.format}`))
        .map((r) =>
          buildArtwork({
            stem: stemOf(r),
            category,
            src: r.secure_url,
            width: r.width || 1000,
            height: r.height || 1250,
            overrides: overrideMap,
          }),
        );
    }),
  );

  return sortArtworks(perCategory.flat());
}

/**
 * Read the prebuilt manifest written by the prebuild step. Synchronous so the
 * common (built) path never awaits the network. Returns null when absent —
 * e.g. local dev before `npm run cloudinary:manifest`, or right after a new
 * upload — so the caller can fall back to a live fetch.
 */
function readManifest(): Artwork[] | null {
  try {
    const raw = readFileSync(MANIFEST_PATH, "utf8");
    const data = JSON.parse(raw) as { artworks: Artwork[] };
    return Array.isArray(data.artworks) ? data.artworks : null;
  } catch {
    return null;
  }
}

/**
 * The whole collection, memoised per process. Prefers the on-disk manifest
 * (fast, deterministic, zero Admin-API calls — so parallel build workers don't
 * each hammer the rate-limited API); falls back to a live Cloudinary fetch when
 * no manifest exists. Call `invalidateArtworksCache()` after editing the
 * library in a long-running process.
 */
export async function getAllArtworks(): Promise<Artwork[]> {
  if (cache) return cache;
  cache = readManifest() ?? (await fetchArtworksFromCloudinary());
  return cache;
}

/** Drop the in-process cache so the next fetch re-reads Cloudinary. */
export function invalidateArtworksCache(): void {
  cache = null;
}

export async function getArtworksByCategory(
  category: Category,
): Promise<Artwork[]> {
  return (await getAllArtworks()).filter((w) => w.category === category);
}

export async function getFeaturedArtworks(): Promise<Artwork[]> {
  return (await getAllArtworks()).filter((w) => w.featured);
}

export async function getArtworkBySlug(
  slug: string,
): Promise<Artwork | undefined> {
  return (await getAllArtworks()).find((w) => w.slug === slug);
}
