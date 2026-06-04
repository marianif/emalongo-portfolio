"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Artwork } from "@/lib/artworks";
import { getImageSrc } from "@/lib/images";
import type { Locale } from "@/app/[lang]/dictionaries";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Offset measures down an editorial column. Two tiers of size for rhythm; the
// final width is aspect-corrected below so landscape works don't read as small.
const SIZE = ["lg", "md", "lg", "md", "lg", "md", "lg", "md"] as const;
const SHIFTS = ["0%", "18%", "6%", "24%", "3%", "16%", "9%", "20%"];

// Cap on rendered image width per tier (px). Landscape works push toward these.
const MAX_W = { lg: 880, md: 680 } as const;
// Base column fraction per tier (a portrait reference); widened for landscape.
const BASE_VW = { lg: 58, md: 44 } as const;

/**
 * A featured work that materializes from the dark: a clip-path inset wipes open
 * (top-down) while the image eases down from a slight zoom. Title + quiet meta
 * settle in after. Hover clears the brightness. Reduced motion: fully present.
 */
export default function FeaturedWork({
  artwork,
  lang,
  index,
}: {
  artwork: Artwork;
  lang: Locale;
  index: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);

  const title =
    lang === "en" && artwork.titleEn ? artwork.titleEn : artwork.title;
  const meta = [artwork.technique, artwork.dimensions, artwork.year]
    .filter(Boolean)
    .join(", ");

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;

      // Cinematic unveil: mask wipes open + image releases from a zoom.
      // toggleActions reverses the whole timeline when scrolling back up, so the
      // work re-veils into the dark instead of staying revealed.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: frame.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
      tl.fromTo(
        frame.current,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.1,
          ease: "expo.out",
        },
      )
        .fromTo(
          img.current,
          { scale: 1.18 },
          { scale: 1.0, duration: 1.4, ease: "expo.out" },
          0,
        )
        .fromTo(
          caption.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" },
          0.35,
        );
    },
    { scope: root },
  );

  const alignRight = index % 2 === 1;
  const tier = SIZE[index % SIZE.length];
  const shift = SHIFTS[index % SHIFTS.length];

  // Aspect correction: landscape works (aspect > 1) get extra width so their
  // (shorter) height still reads large. Portrait works stay near the base.
  const landscapeBoost = artwork.aspect > 1 ? Math.min(artwork.aspect, 1.5) : 1;
  const widthVw = Math.min(BASE_VW[tier] * landscapeBoost, 92);
  const maxW = Math.round(MAX_W[tier] * (artwork.aspect > 1 ? 1.15 : 1));

  return (
    <article
      ref={root}
      className="flex"
      style={{
        justifyContent: alignRight ? "flex-end" : "flex-start",
      }}
    >
      <Link
        href={`/${lang}/opere/${artwork.slug}`}
        data-cursor="view"
        className="group block outline-none"
        style={
          {
            width: `min(${widthVw}vw, ${maxW}px)`,
            marginLeft: alignRight ? undefined : `min(${shift}, 18vw)`,
            marginRight: alignRight ? `min(${shift}, 18vw)` : undefined,
            textAlign: alignRight ? "right" : "left",
          } as React.CSSProperties
        }
      >
        <div
          ref={frame}
          className="relative w-full overflow-hidden bg-crypt-raise will-change-[clip-path]"
          style={{ aspectRatio: artwork.aspect }}
        >
          {/* Scale wrapper for the zoom-out; image keeps true ratio (no crop). */}
          <div
            ref={img}
            className="absolute inset-0 will-change-transform"
          >
            <Image
              src={getImageSrc(artwork.src, { width: 1200 })}
              alt={`${title}${meta ? ` — ${meta}` : ""}`}
              fill
              sizes="(max-width: 768px) 90vw, 45vw"
              className="object-contain transition-[filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [filter:brightness(0.82)] group-hover:[filter:brightness(1.02)] group-focus-visible:[filter:brightness(1.02)]"
            />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-rule/30 transition-colors duration-500 group-hover:border-accent/60 group-focus-visible:border-accent"
          />
        </div>
        <div ref={caption} className="mt-3">
          <h3 className="font-serif text-[clamp(1rem,1.6vw,1.4rem)] leading-tight text-bone">
            {title}
          </h3>
          {meta && (
            <p className="mt-1 font-sans text-[0.75rem] text-muted lowercase">
              {meta}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
