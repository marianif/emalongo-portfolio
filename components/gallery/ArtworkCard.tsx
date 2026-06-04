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
// Max pointer-tilt of the focused work (degrees). Subtle: it leans toward you.
const TILT = 4;

/**
 * One floating work in the constellation. The image keeps its intrinsic aspect
 * ratio (never cropped). Its tier sets the width fraction and the parallax
 * depth; `lean` insets it left or right within the column so neighbours stagger.
 *
 * Motion (home vocabulary): a clip-path inset wipes the frame open while the
 * image releases from a slight zoom; then the work drifts with the scroll at a
 * tier-dependent speed, like a thing suspended in the dark.
 *
 * Hover is a spotlight: when any work is engaged, the others recede (dim +
 * desaturate + sink), while the focused piece holds full brightness, lifts, and
 * leans toward the cursor (a touch of pointer-tilt) — alive, turning to face
 * you. Reduced motion: fully present, no drift, no tilt.
 */
export default function ArtworkCard({
  artwork,
  lang,
  tier,
  lean,
  offset,
  priority = false,
  engaged,
  focused,
  onEnter,
  onLeave,
}: {
  artwork: Artwork;
  lang: Locale;
  tier: Tier;
  /** Which side the inset work hugs (ignored when tier is lg / full width). */
  lean: "left" | "right";
  /** Extra top margin (rem) so works start at varied heights. */
  offset: number;
  priority?: boolean;
  /** Some work on the wall is hovered (this one may or may not be it). */
  engaged: boolean;
  /** This work is the hovered one. */
  focused: boolean;
  onEnter: (slug: string) => void;
  onLeave: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  // Innermost wrapper GSAP owns for the reveal zoom, kept separate from the
  // hover-scale wrapper so React inline styles and GSAP never fight one element.
  const zoom = useRef<HTMLDivElement>(null);
  // Imperative tilt setters (GSAP quickTo) for buttery pointer follow.
  const rotX = useRef<((v: number) => void) | null>(null);
  const rotY = useRef<((v: number) => void) | null>(null);
  const reduceRef = useRef(false);

  const title =
    lang === "en" && artwork.titleEn ? artwork.titleEn : artwork.title;
  const meta = [artwork.dimensions, artwork.year].filter(Boolean).join(" · ");

  const widthPct = TIER_WIDTH[tier] * 100;
  const insetSide = tier === "lg" ? null : lean;

  // Spotlight state → the un-focused works recede; the focused one steps forward.
  const recede = engaged && !focused;

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      reduceRef.current = reduce;
      if (reduce) return;

      // Smooth pointer-tilt setters for the focused frame.
      rotX.current = gsap.quickTo(frame.current, "rotationX", {
        duration: 0.5,
        ease: "power3.out",
      });
      rotY.current = gsap.quickTo(frame.current, "rotationY", {
        duration: 0.5,
        ease: "power3.out",
      });

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
        zoom.current,
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

  // Lean the focused frame toward the pointer (subtle, capped at TILT degrees).
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduceRef.current || !frame.current || !rotX.current || !rotY.current)
      return;
    const r = frame.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotY.current(px * TILT * 2);
    rotX.current(-py * TILT * 2);
  };

  const resetTilt = () => {
    rotX.current?.(0);
    rotY.current?.(0);
  };

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
        className="group/card block outline-none [perspective:1000px]"
        style={{ width: `${widthPct}%` }}
        onMouseEnter={() => onEnter(artwork.slug)}
        onMouseLeave={() => {
          onLeave();
          resetTilt();
        }}
        onPointerMove={onPointerMove}
        onFocus={() => onEnter(artwork.slug)}
        onBlur={() => {
          onLeave();
          resetTilt();
        }}
      >
        <div
          ref={frame}
          className="relative w-full overflow-hidden bg-crypt-raise transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[clip-path,transform] [transform-style:preserve-3d]"
          style={{
            aspectRatio: artwork.aspect,
            opacity: recede ? 0.7 : 1,
          }}
        >
          {/* Spotlight scale rides the image wrapper so GSAP keeps sole
              ownership of the frame's transform (clip-path reveal + tilt). */}
          <div
            ref={img}
            className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
            style={{
              transform: focused
                ? "scale(1.04)"
                : recede
                  ? "scale(0.98)"
                  : "scale(1)",
            }}
          >
            <div ref={zoom} className="absolute inset-0 will-change-transform">
              <Image
                src={getImageSrc(artwork.src, {
                  width: tier === "lg" ? 1000 : 700,
                })}
                alt={`${title}${meta ? ` — ${meta}` : ""}`}
                fill
                sizes={
                  tier === "lg"
                    ? "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 33vw"
                    : "(max-width: 640px) 70vw, (max-width: 1024px) 38vw, 26vw"
                }
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className="object-cover transition-[filter] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  filter: focused
                    ? "brightness(1.05) saturate(1.05)"
                    : recede
                      ? "brightness(0.72) saturate(0.78)"
                      : "brightness(0.8)",
                }}
              />
            </div>
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border transition-colors duration-500"
            style={{
              borderColor: focused
                ? "transparent"
                : "color-mix(in oklab, var(--color-rule) 20%, transparent)",
            }}
          />
        </div>
        <div
          className="mt-2.5 transition-opacity duration-500"
          style={{
            textAlign: insetSide === "right" ? "right" : "left",
            opacity: recede ? 0.45 : 1,
          }}
        >
          <h3
            className="font-serif text-[clamp(0.95rem,1.05vw,1.2rem)] leading-snug transition-colors duration-300"
            style={{ color: focused ? "var(--color-accent)" : "var(--color-bone)" }}
          >
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
