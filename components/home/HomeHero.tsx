"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Artwork } from "@/lib/artworks";
import { getImageSrc } from "@/lib/images";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The hero: one commanding work fills the crypt-dark viewport. The name and
 * discipline sit quietly in the lower third (never centered). On scroll, the
 * image drifts slowly (parallax) while the title layer settles — a signature
 * moment, so it uses the immersive timing tier. Reduced motion: static.
 */
export default function HomeHero({
  artwork,
  name,
  role,
  tagline,
  scrollCue,
  altText,
}: {
  artwork: Artwork;
  name: string;
  role: string;
  tagline: string;
  scrollCue: string;
  altText: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const imageWrap = useRef<HTMLDivElement>(null);
  const titleWrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Entrance: the title surfaces from the dark after a slow veil.
      if (!reduce && titleWrap.current) {
        gsap.from(titleWrap.current.children, {
          opacity: 0,
          y: 24,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.12,
          delay: 0.15,
        });
      }

      if (reduce) return;

      // Parallax: image drifts up slower than scroll; title fades as we leave.
      gsap.to(imageWrap.current, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(titleWrap.current, {
        opacity: 0,
        y: -32,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "60% top",
          scrub: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative h-[100svh] w-full overflow-hidden bg-crypt-deep"
      aria-label={`${name}, ${tagline}`}
    >
      {/* Image layer (over-tall for parallax headroom) */}
      <div ref={imageWrap} className="absolute inset-0 -bottom-[18%]">
        <Image
          src={getImageSrc(artwork.src, { width: 2000 })}
          alt={altText}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Vignette: the work glows from pooled dark, no hard edges. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 30%, transparent 30%, rgba(13,11,8,0.55) 78%, rgba(13,11,8,0.92) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "linear-gradient(to top, var(--crypt-soot) 4%, transparent 100%)",
          }}
        />
      </div>

      {/* Title layer: lower-left, asymmetric, quiet. */}
      <div
        ref={titleWrap}
        className="absolute inset-x-0 bottom-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10 sm:pb-12 lg:px-16 lg:pb-16"
      >
        <p className="mb-3 font-sans text-xs tracking-[0.18em] text-muted uppercase">
          {role}
        </p>
        <h1 className="max-w-[18ch] font-serif text-[clamp(2.75rem,9vw,7rem)] leading-[0.98] tracking-[-0.01em] text-bone">
          {name}
        </h1>
        <p className="mt-4 max-w-[40ch] font-serif text-[clamp(1.05rem,2.2vw,1.5rem)] text-bone/80 italic">
          {tagline}
        </p>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-5 flex justify-center"
      >
        <span className="animate-pulse font-sans text-[0.7rem] tracking-[0.3em] text-muted uppercase">
          {scrollCue}
        </span>
      </div>
    </section>
  );
}
