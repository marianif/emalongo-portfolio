/**
 * Single point of indirection for artwork image sources.
 *
 * Sources are now Cloudinary delivery URLs (see lib/cloudinary.ts), shaped like
 *   https://res.cloudinary.com/<cloud>/image/upload/v123/artworks/<folder>/<id>
 *
 * `getImageSrc` injects Cloudinary transformation params right after
 * `/upload/`, so every <Image> gets auto-format (AVIF/WebP), auto-quality, and
 * a width-capped variant — the CDN does the responsive work, not the browser.
 * A non-Cloudinary src (e.g. the local `/artist-photo.jpg`) is returned
 * untouched, so the helper is safe to call on any source.
 */

export interface ImageOptions {
  /** Target width hint; becomes Cloudinary `w_<n>,c_limit`. */
  width?: number;
  /** Quality hint (1-100). Defaults to Cloudinary `q_auto`. */
  quality?: number;
}

const CLOUDINARY_UPLOAD = "/image/upload/";

export function getImageSrc(src: string, options: ImageOptions = {}): string {
  const marker = src.indexOf(CLOUDINARY_UPLOAD);
  if (!src.includes("res.cloudinary.com") || marker === -1) {
    // Not a Cloudinary URL (local asset, external) — use as-is.
    return src;
  }

  const params = ["f_auto"];
  if (options.width) params.push(`w_${options.width}`, "c_limit");
  params.push(`q_${options.quality ?? "auto"}`);

  const head = src.slice(0, marker + CLOUDINARY_UPLOAD.length);
  const tail = src.slice(marker + CLOUDINARY_UPLOAD.length);
  return `${head}${params.join(",")}/${tail}`;
}
