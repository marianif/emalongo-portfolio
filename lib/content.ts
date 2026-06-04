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

/**
 * A long-form statement parsed into its parts: an opening epigraph and its
 * attribution (the first two lines), then the manifesto as paragraphs split
 * on blank lines. The artist's prose is the work here; this just gives the
 * reader the shape — a threshold quote, then the descent.
 */
export type Statement = {
  epigraph: string;
  attribution: string;
  paragraphs: string[];
};

export function getStatement(doc: ContentDoc, locale: Locale): Statement {
  const raw = getContent(doc, locale);

  // Drop any leading HTML comment (e.g. a translation-status note) and trim.
  const text = raw.replace(/<!--[\s\S]*?-->/g, "").trim();

  // First two non-empty lines are the epigraph and its attribution; the rest,
  // split on blank lines, are the body paragraphs.
  const lines = text.split("\n");
  const epigraph = (lines.shift() ?? "").trim().replace(/^["“]|["”]$/g, "");
  const attribution = (lines.shift() ?? "").trim();

  const paragraphs = lines
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  return { epigraph, attribution, paragraphs };
}
