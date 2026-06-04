"use client";

import { useMemo, useState, useEffect } from "react";
import type { Artwork } from "@/lib/artworks";
import type { Locale } from "@/app/[lang]/dictionaries";
import ArtworkCard, { type Tier } from "./ArtworkCard";

// Deterministic tier rhythm: large works anchor, mediums and smalls float
// between them. Repeating (not random) so the field is stable across renders
// and the eye reads it as composed, not accidental.
const TIER_PATTERN: Tier[] = [
  "lg",
  "sm",
  "md",
  "sm",
  "lg",
  "md",
  "sm",
  "md",
  "lg",
  "sm",
];
// Top-offset rhythm (rem) so works in a column start at varied heights.
const OFFSET_PATTERN = [0, 2.5, 1, 3.5, 0.5, 2, 4, 1.5];

type Placed = {
  artwork: Artwork;
  tier: Tier;
  lean: "left" | "right";
  offset: number;
  priority: boolean;
};

/** Effective height weight of a work given its tier (for column balancing). */
function heightWeight(artwork: Artwork, tier: Tier): number {
  const widthFrac = tier === "lg" ? 1 : tier === "md" ? 0.82 : 0.6;
  // Taller (low-aspect) works weigh more; scaled by rendered width fraction.
  return (1 / artwork.aspect) * widthFrac + 0.4; // +caption/gap constant
}

/** Columns by breakpoint, observed from the viewport. */
function useColumnCount(): number {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 639px)");
    const mqTablet = window.matchMedia("(max-width: 1023px)");
    const update = () =>
      setCols(mqMobile.matches ? 1 : mqTablet.matches ? 2 : 3);
    update();
    mqMobile.addEventListener("change", update);
    mqTablet.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqTablet.removeEventListener("change", update);
    };
  }, []);
  return cols;
}

/**
 * The constellation: works fall into balanced columns by shortest-column
 * packing, each carrying its own size tier, side-lean, and vertical offset so
 * the field reads as scattered, floating bodies rather than a grid. Each card
 * owns its reveal + parallax drift (see ArtworkCard). True aspect ratios — no
 * crops. Remounted per filter (key in GalleryClient) so the reveal re-runs.
 */
export default function GalleryGrid({
  artworks,
  lang,
}: {
  artworks: Artwork[];
  lang: Locale;
}) {
  const cols = useColumnCount();

  const columns = useMemo(() => {
    // Assign a deterministic tier/lean/offset per work first.
    const placed: Placed[] = artworks.map((artwork, i) => ({
      artwork,
      tier: TIER_PATTERN[i % TIER_PATTERN.length],
      lean: i % 2 === 0 ? "left" : "right",
      offset: OFFSET_PATTERN[i % OFFSET_PATTERN.length],
      priority: i < cols, // first visible row paints eagerly
    }));

    // Shortest-column packing keeps the columns balanced in height.
    const buckets: Placed[][] = Array.from({ length: cols }, () => []);
    const heights = new Array(cols).fill(0);
    for (const p of placed) {
      let shortest = 0;
      for (let c = 1; c < cols; c++) {
        if (heights[c] < heights[shortest]) shortest = c;
      }
      buckets[shortest].push(p);
      heights[shortest] += heightWeight(p.artwork, p.tier) + p.offset * 0.12;
    }
    return buckets;
  }, [artworks, cols]);

  if (artworks.length === 0) {
    return (
      <p className="px-6 py-24 text-center font-serif text-lg text-muted italic sm:px-10 lg:px-16">
        —
      </p>
    );
  }

  return (
    <div className="flex items-start gap-[clamp(1.5rem,4vw,4.5rem)] px-6 pb-40 sm:px-10 lg:px-16">
      {columns.map((bucket, c) => (
        <div
          key={c}
          className="flex flex-1 flex-col gap-[clamp(2rem,5vw,5rem)]"
        >
          {bucket.map((p) => (
            <ArtworkCard
              key={p.artwork.slug}
              artwork={p.artwork}
              lang={lang}
              tier={p.tier}
              lean={p.lean}
              offset={p.offset}
              priority={p.priority}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
