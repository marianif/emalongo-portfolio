/**
 * Bulk-upload public/artworks/** to Cloudinary, mirroring the folder hierarchy.
 *
 *   node scripts/upload-to-cloudinary.mjs            # upload (skip existing)
 *   node scripts/upload-to-cloudinary.mjs --dry-run  # list what WOULD upload
 *   node scripts/upload-to-cloudinary.mjs --force     # re-upload / overwrite
 *
 * Each local file public/artworks/<folder>/<name>.<ext> becomes a Cloudinary
 * asset in the asset folder "artworks/<folder>" with public_id "<name>" — the
 * exact layout lib/cloudinary.ts reads back via resources_by_asset_folder.
 *
 * Idempotent by default: assets that already exist are skipped, so you can
 * re-run after adding a few works. Needs CLOUDINARY_* in .env.local.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTWORKS_DIR = path.join(ROOT, "public", "artworks");

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const CONCURRENCY = 4;

// --- load .env.local (no dependency on dotenv) ------------------------------
function loadEnv() {
  try {
    const raw = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // no .env.local — rely on the ambient environment
  }
}
loadEnv();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

if (
  !DRY_RUN &&
  (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
) {
  console.error(
    "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, " +
      "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local " +
      "(copy from .env.local.example).",
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

// --- collect the upload work-list -------------------------------------------
/** @returns {{file:string, folder:string, publicId:string, assetFolder:string}[]} */
function collect() {
  const jobs = [];
  for (const folder of readdirSync(ARTWORKS_DIR)) {
    const abs = path.join(ARTWORKS_DIR, folder);
    if (!statSync(abs).isDirectory()) continue;
    for (const name of readdirSync(abs)) {
      if (!IMAGE_RE.test(name)) continue; // skips .~tmp and non-images
      const publicId = name.replace(IMAGE_RE, "");
      jobs.push({
        file: path.join(abs, name),
        folder,
        publicId,
        assetFolder: `artworks/${folder}`,
      });
    }
  }
  return jobs;
}

// The Cloudinary free plan hard-caps stored images at 10MB (upload_large does
// NOT bypass this — it's an account limit, not a request limit). For oversized
// originals we generate a web-optimized copy under the cap with macOS `sips`,
// upload that, and leave the full-res master untouched on disk.
const MAX_BYTES = 10 * 1024 * 1024;
const SCRATCH = path.join(ROOT, ".cloudinary-tmp");

/** Downscale `src` into SCRATCH until it fits under MAX_BYTES; return the path. */
function makeWebCopy(src, publicId) {
  if (!existsSync(SCRATCH)) mkdirSync(SCRATCH, { recursive: true });
  // Re-encode as JPEG; step the long edge down until the result fits.
  const out = path.join(SCRATCH, `${publicId.replace(/[/\\]/g, "_")}.jpg`);
  for (const maxEdge of [4500, 3500, 2800, 2200]) {
    execFileSync("sips", [
      "-Z", String(maxEdge),
      "-s", "format", "jpeg",
      "-s", "formatOptions", "90",
      src,
      "--out", out,
    ], { stdio: "ignore" });
    if (statSync(out).size <= MAX_BYTES) return out;
  }
  return out; // smallest attempt; upload will surface an error if still too big
}

async function uploadOne(job) {
  // public_id is RELATIVE to the asset_folder, so the displayed name stays the
  // original stem and the asset lands in artworks/<folder>.
  const opts = {
    asset_folder: job.assetFolder,
    public_id: job.publicId,
    use_filename: false,
    unique_filename: false,
    overwrite: FORCE,
    resource_type: "image",
  };

  const source =
    statSync(job.file).size > MAX_BYTES
      ? makeWebCopy(job.file, job.publicId)
      : job.file;

  return cloudinary.uploader.upload(source, opts);
}

/** Run jobs with a small concurrency pool. */
async function run(jobs) {
  let done = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const total = jobs.length;
  const queue = [...jobs];

  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      const label = `${job.assetFolder}/${job.publicId}`;
      try {
        const res = await uploadOne(job);
        // When overwrite:false and the asset exists, Cloudinary returns the
        // existing resource (existing:true on some plans) rather than erroring.
        if (res.existing) {
          skipped++;
          console.log(`· skip   ${label}`);
        } else {
          uploaded++;
          console.log(`✓ upload ${label}`);
        }
      } catch (err) {
        failed++;
        console.error(`✗ FAIL   ${label} — ${err?.message ?? err}`);
      } finally {
        done++;
        if (done % 25 === 0) console.log(`  …${done}/${total}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, worker),
  );
  return { uploaded, skipped, failed, total };
}

const jobs = collect();
console.log(
  `Found ${jobs.length} image(s) under public/artworks/` +
    (DRY_RUN ? "  (DRY RUN — nothing will upload)" : "") +
    (FORCE ? "  (FORCE — existing assets overwritten)" : ""),
);

if (DRY_RUN) {
  const byFolder = {};
  for (const j of jobs) (byFolder[j.assetFolder] ??= []).push(j.publicId);
  for (const [f, ids] of Object.entries(byFolder)) {
    console.log(`\n${f}  (${ids.length})`);
    for (const id of ids) console.log(`  → ${id}`);
  }
  process.exit(0);
}

const summary = await run(jobs);
console.log(
  `\nDone. uploaded=${summary.uploaded} skipped=${summary.skipped} ` +
    `failed=${summary.failed} of ${summary.total}.`,
);
process.exit(summary.failed ? 1 : 0);
