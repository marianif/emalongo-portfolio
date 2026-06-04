/**
 * Single point of indirection for artwork image sources.
 *
 * NOW: images live in `public/artworks/...` and `src` is already a usable
 * public path, so `getImageSrc` is the identity function.
 *
 * LATER (Cloudinary): change ONLY this file — map the local path to a
 * Cloudinary delivery URL and add the host to `next.config.ts` remotePatterns.
 * No call site needs to change.
 */

export interface ImageOptions {
  /** Target width hint; a future Cloudinary loader can use this. */
  width?: number;
  /** Quality hint (1-100). */
  quality?: number;
}

export function getImageSrc(src: string, _options: ImageOptions = {}): string {
  // Local mode: the stored path is already correct.
  return src;

  // --- Cloudinary mode (enable later) ---------------------------------------
  // const base = process.env.NEXT_PUBLIC_CLOUDINARY_BASE;
  // if (!base) return src;
  // const params = ["f_auto", "c_limit"];
  // if (_options.width) params.push(`w_${_options.width}`);
  // params.push(`q_${_options.quality ?? "auto"}`);
  // const publicId = src.replace(/^\/artworks\//, "").replace(/\.[^.]+$/, "");
  // return `${base}/${params.join(",")}/artworks/${publicId}`;
}
