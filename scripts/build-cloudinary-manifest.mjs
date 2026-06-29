/**
 * Prebuild step: fetch the whole collection from Cloudinary ONCE and write it to
 * data/cloudinary-manifest.json. The data layer (lib/cloudinary.ts) reads this
 * file at build time, so the 10 parallel Next build workers don't each hammer
 * the rate-limited Admin API (500 req/hr).
 *
 *   node scripts/build-cloudinary-manifest.mjs
 *
 * Run automatically before `next build` via the "prebuild" npm hook. Re-run it
 * by hand after uploading new works so the manifest reflects them.
 *
 * This mirrors lib/cloudinary.ts's fetch+map exactly (same folder map, same
 * filename parsing via lib/artwork-parse) so manifest data === live data.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import {
  buildArtwork,
  isImageFile,
  sortArtworks,
  stripExtension,
} from "../lib/artwork-parse.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "cloudinary-manifest.json");

// --- env (no dotenv dependency) ---------------------------------------------
try {
  for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* rely on ambient env */
}

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // No creds (e.g. a CI build relying on the committed manifest). Don't fail
  // the build — fall back to whatever manifest is already on disk.
  if (existsSync(OUT)) {
    console.warn(
      "No Cloudinary credentials — keeping the committed " +
        "data/cloudinary-manifest.json as-is.",
    );
    process.exit(0);
  }
  console.error(
    "Missing Cloudinary credentials and no committed manifest to fall back on.",
  );
  process.exit(1);
}
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

// Mirror of FOLDERS_BY_CATEGORY in lib/cloudinary.ts — keep in sync.
const FOLDERS_BY_CATEGORY = {
  dipinti: ["artworks/dipinti"],
  disegni: ["artworks/disegni"],
  "opere-digitali": [
    "artworks/opere-digitali-1-selezione_(2020)",
    "artworks/opere-digitali-2-selezione_(2020-2021)",
    "artworks/opere-digitali-3-selezione_(2022-2023)",
  ],
};

const overrides = JSON.parse(
  readFileSync(path.join(ROOT, "data", "artworks.json"), "utf8"),
);

async function listFolder(folder) {
  const out = [];
  let next_cursor;
  do {
    const res = await cloudinary.api.resources_by_asset_folder(folder, {
      resource_type: "image",
      max_results: 100,
      next_cursor,
      fields: "public_id,secure_url,width,height,format,filename",
    });
    out.push(...res.resources);
    next_cursor = res.next_cursor;
  } while (next_cursor);
  return out;
}

const stemOf = (r) =>
  stripExtension(r.filename ?? r.public_id.split("/").pop() ?? r.public_id);

const categories = Object.keys(FOLDERS_BY_CATEGORY);
const perCategory = await Promise.all(
  categories.map(async (category) => {
    const resources = (
      await Promise.all(FOLDERS_BY_CATEGORY[category].map(listFolder))
    ).flat();
    return resources
      .filter((r) => isImageFile(`${stemOf(r)}.${r.format}`))
      .map((r) =>
        buildArtwork({
          stem: stemOf(r),
          category,
          src: r.secure_url,
          width: r.width || 1000,
          height: r.height || 1250,
          overrides,
        }),
      );
  }),
);

const artworks = sortArtworks(perCategory.flat());

if (!existsSync(path.dirname(OUT))) mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), count: artworks.length, artworks },
    null,
    2,
  ),
);
console.log(`✓ Wrote ${artworks.length} artworks to data/cloudinary-manifest.json`);
