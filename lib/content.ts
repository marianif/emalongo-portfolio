import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/app/[lang]/dictionaries";

export type ContentDoc = "bio" | "visione";

const CONTENT_DIR = path.join(process.cwd(), "lib", "content");

/**
 * Read a long-form markdown essay for a given locale. Falls back to Italian
 * (the authoritative source) if a localized file is missing.
 * Returns raw markdown — a renderer will be added in the design phase.
 */
export function getContent(doc: ContentDoc, locale: Locale): string {
  const localized = path.join(CONTENT_DIR, `${doc}.${locale}.md`);
  const fallback = path.join(CONTENT_DIR, `${doc}.it.md`);
  const file = fs.existsSync(localized) ? localized : fallback;
  return fs.readFileSync(file, "utf8");
}
