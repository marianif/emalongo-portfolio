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

export type Tier = "lg" | "md" | "sm";

// Each tier renders at a fraction of its column's width and sits inset to one
// side, so works never share an edge — the row reads as a scattered
// constellation, not a grid line.
const TIER_WIDTH: Record<Tier, number> = { lg: 1, md: 0.82, sm: 0.6 };
// Parallax depth (px of drift over the scroll). Smaller works drift more, so
// they read as nearer/lighter — the floating-at-different-depths effect.
const TIER_PARALLAX: Record<Tier, number> = { lg: 40, md: 70, sm: 110 };

/**
 * One floating work in the constellation. The image keeps its intrinsic aspect
 * ratio (never cropped). Its tier sets the width fraction and the parallax
 * depth; `lean` insets it left or right within the column so neighbours stagger.
 *
 * Motion (home vocabulary): a clip-path inset wipes the frame open while the
 * image releases from a slight zoom; then the work drifts with the scroll at a
 * tier-dependent speed, like a thing suspended in the dark. Hover brightens it
 * and warms the frame to ember. Reduced motion: fully present, no drift.
 */
export default function ArtworkCard({
  artwork,
  lang,
  tier,
  lean,
  offset,
  priority = false,
}: {
  artwork: Artwork;
  lang: Locale;
  tier: Tier;
  /** Which side the inset work hugs (ignored when tier is lg / full width). */
  lean: "left" | "right";
  /** Extra top margin (rem) so works start at varied heights. */
  offset: number;
  priority?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);

  const title =
    lang === "en" && artwork.titleEn ? artwork.titleEn : artwork.title;
  const meta = [artwork.dimensions, artwork.year].filter(Boolean).join(" · ");

  const widthPct = TIER_WIDTH[tier] * 100;
  const insetSide = tier === "lg" ? null : lean;

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;

      // Reveal: mask wipes open + image eases out of a zoom (home language).
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: frame.current,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });
      tl.fromTo(
        frame.current,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.0, ease: "expo.out" },
      ).fromTo(
        img.current,
        { scale: 1.16 },
        { scale: 1.0, duration: 1.3, ease: "expo.out" },
        0,
      );

      // Float: the whole card drifts up as it passes, tier-dependent speed.
      gsap.fromTo(
        root.current,
        { y: TIER_PARALLAX[tier] },
        {
          y: -TIER_PARALLAX[tier],
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="flex"
      style={{
        marginTop: `${offset}rem`,
        justifyContent:
          insetSide === "right" ? "flex-end" : "flex-start",
      }}
    >
      <Link
        href={`/${lang}/opere/${artwork.slug}`}
        data-cursor="view"
        className="group/card block outline-none"
        style={{ width: `${widthPct}%` }}
      >
        <div
          ref={frame}
          className="relative w-full overflow-hidden bg-crypt-raise will-change-[clip-path]"
          style={{ aspectRatio: artwork.aspect }}
        >
          <div ref={img} className="absolute inset-0 will-change-transform">
            <Image
              src={getImageSrc(artwork.src, { width: tier === "lg" ? 1000 : 700 })}
              alt={`${title}${meta ? ` — ${meta}` : ""}`}
              fill
              sizes={
                tier === "lg"
                  ? "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 33vw"
                  : "(max-width: 640px) 70vw, (max-width: 1024px) 38vw, 26vw"
              }
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className="object-cover transition-[filter] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] [filter:brightness(0.78)] group-hover/card:[filter:brightness(1.04)] group-focus-visible/card:[filter:brightness(1.04)]"
            />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-rule/20 transition-colors duration-500 group-hover/card:border-accent/50 group-focus-visible/card:border-accent"
          />
        </div>
        <div
          className="mt-2.5"
          style={{ textAlign: insetSide === "right" ? "right" : "left" }}
        >
          <h3 className="font-serif text-[clamp(0.95rem,1.05vw,1.2rem)] leading-snug text-bone transition-colors duration-300 group-hover/card:text-accent">
            {title}
          </h3>
          {meta && (
            <p className="mt-0.5 font-sans text-[0.7rem] tracking-wide text-muted lowercase tabular-nums">
              {meta}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
