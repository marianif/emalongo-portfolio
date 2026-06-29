/**
 * Quick health check: confirms the Cloudinary account authenticates and is
 * enabled. Run `npm run cloudinary:ping`. Exits 0 on success, 1 on failure.
 * Use this to tell when a "disabled customer" account has been re-enabled.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* rely on ambient env */
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

try {
  const res = await cloudinary.api.ping();
  console.log(`✓ Cloudinary OK (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`, res);
  process.exit(0);
} catch (err) {
  const e = err?.error ?? err;
  console.error(`✗ Cloudinary unreachable: ${e?.message ?? e} (http ${e?.http_code ?? "?"})`);
  process.exit(1);
}
