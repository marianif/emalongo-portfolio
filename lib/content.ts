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

/**
 * The manifesto as composed beats. The prose is one descent, but it has an arc —
 * thesis, the inward turn, the labyrinth, the held breath, the blood-and-fire
 * core, the call, the promise — and each beat earns a distinct typographic
 * treatment in the reading column.
 *
 * Beat 5 carries the manifesto's most charged sentence ("un'arte che nasce dal
 * sangue, dal fuoco"). We split it from its paragraph so it can swell into a
 * display line on its own; `lead` is the run-up, `swell` the lifted line.
 */
export type ManifestoRole =
  | "thesis"
  | "urgency"
  | "labyrinth"
  | "breath"
  | "core"
  | "call"
  | "promise";

export type ManifestoBeat = {
  role: ManifestoRole;
  text: string;
  /** Only on the "core" beat: the charged head, lifted to a display swell. */
  swell?: string;
  /** Only on the "core" beat: the qualifying tail, returned to body voice. */
  swellTail?: string;
};

// The blood-and-fire sentence opens differently per locale; match its start.
const SWELL_MARKERS = [/\bSono per un['’]arte\b/, /\bI am for an art\b/];

// Cut the swell after its charged head ("...dal fuoco" / "...of fire") so only
// that line goes to display scale; the qualifying clause stays body-sized.
const SWELL_HEAD_END = [/dal fuoco\b/, /of fire\b/];

const ROLE_ORDER: ManifestoRole[] = [
  "thesis",
  "urgency",
  "labyrinth",
  "breath",
  "core",
  "call",
  "promise",
];

export function getManifestoBeats(
  doc: ContentDoc,
  locale: Locale,
): ManifestoBeat[] {
  const { paragraphs } = getStatement(doc, locale);

  return paragraphs.map((text, i) => {
    const role = ROLE_ORDER[i] ?? "promise";
    if (role !== "core") return { role, text };

    // Lift the blood-and-fire sentence out of the core paragraph.
    const marker = SWELL_MARKERS.find((re) => re.test(text));
    if (!marker) return { role, text };
    const at = text.search(marker);
    const lead = text.slice(0, at).trim();
    const swellFull = text.slice(at).trim();

    // Split the swell into its charged head and qualifying tail.
    const headEnd = SWELL_HEAD_END.find((re) => re.test(swellFull));
    if (!headEnd) return { role, text: lead, swell: swellFull };
    const m = headEnd.exec(swellFull)!;
    const cut = m.index + m[0].length;
    return {
      role,
      text: lead,
      swell: swellFull.slice(0, cut).trim(),
      swellTail: swellFull.slice(cut).replace(/^[\s,]+/, "").trim(),
    };
  });
}
