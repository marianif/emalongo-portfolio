"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Artwork, Category } from "@/lib/artworks";
import type { Locale } from "@/app/[lang]/dictionaries";
import GalleryGrid from "./GalleryGrid";

type Filter = Category | "all";

export interface GalleryLabels {
  title: string;
  all: string;
  categories: Record<Category, string>;
  /** singular/plural-agnostic noun for the count, e.g. "opere" / "works". */
  works: string;
}

const CATEGORY_ORDER: Category[] = ["dipinti", "disegni", "opere-digitali"];

/**
 * The salon-wall chrome + state. Filtering is instant and client-side (no
 * navigation, no flash), but the active filter is mirrored into the URL via
 * `?categoria=` with `router.replace` so menu deep-links land pre-filtered and
 * the view is shareable. The full collection ships once; we slice in memory.
 *
 * Hierarchy anchor: the live count under the title updates with the filter
 * ("155 opere" → "20 disegni"), giving the wall its sense of volume.
 */
export default function GalleryClient({
  artworks,
  lang,
  initial,
  labels,
}: {
  artworks: Artwork[];
  lang: Locale;
  initial: Filter;
  labels: GalleryLabels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<Filter>(initial);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: artworks.length,
      dipinti: 0,
      disegni: 0,
      "opere-digitali": 0,
    };
    for (const w of artworks) c[w.category] += 1;
    return c;
  }, [artworks]);

  const shown = useMemo(
    () =>
      active === "all" ? artworks : artworks.filter((w) => w.category === active),
    [artworks, active],
  );

  const select = useCallback(
    (next: Filter) => {
      if (next === active) return;
      setActive(next);
      const url =
        next === "all" ? pathname : `${pathname}?categoria=${next}`;
      // Mirror to the URL without scrolling or re-running the server render.
      router.replace(url, { scroll: false });
    },
    [active, pathname, router],
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: labels.all },
    ...CATEGORY_ORDER.map((c) => ({ key: c, label: labels.categories[c] })),
  ];

  return (
    <div>
      <header className="px-6 pt-28 pb-10 sm:px-10 sm:pt-32 lg:px-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] text-bone">
              {labels.title}
            </h1>
            <p className="mt-3 font-sans text-sm text-muted tabular-nums">
              {counts[active]} {labels.works}
            </p>
          </div>

          {/* The filter rail: quiet chrome, ember marks the active room. */}
          <nav
            aria-label={labels.title}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-2"
          >
            {filters.map((f) => {
              const on = f.key === active;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => select(f.key)}
                  data-cursor="view"
                  aria-pressed={on}
                  className={`group inline-flex items-baseline gap-1.5 font-sans text-[0.95rem] outline-none transition-colors ${
                    on ? "text-accent" : "text-muted hover:text-bone"
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[0.7rem] tabular-nums transition-colors ${
                      on ? "text-accent/70" : "text-rule"
                    }`}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* key=active remounts the wall so the reveal re-staggers per filter. */}
      <GalleryGrid key={active} artworks={shown} lang={lang} />
    </div>
  );
}
