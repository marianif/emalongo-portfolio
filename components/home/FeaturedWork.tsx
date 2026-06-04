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

/**
 * A single featured work: a tall framed image that drifts on scroll, with the
 * title (serif) and quiet metadata (sans) beside or beneath it. Hover lifts the
 * image tonally (no scale-pop, no shadow) per the Atmosphere-Not-Shadow rule.
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
  const imageWrap = useRef<HTMLDivElement>(null);

  const title =
    lang === "en" && artwork.titleEn ? artwork.titleEn : artwork.title;
  const meta = [artwork.technique, artwork.dimensions, artwork.year]
    .filter(Boolean)
    .join(", ");

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Slow intra-frame parallax: the image breathes inside its frame.
      gsap.fromTo(
        imageWrap.current,
        { yPercent: -6 },
        {
          yPercent: 6,
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

  // Alternate alignment for asymmetric rhythm; vary measure by index.
  const alignRight = index % 2 === 1;

  return (
    <article
      ref={root}
      className={`group flex flex-col ${
        alignRight ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <Link
        href={`/${lang}/opere/${artwork.slug}`}
        className="block w-full max-w-[var(--w)] outline-none"
        style={
          {
            // Varied widths break the uniform-grid reflex.
            "--w": index % 3 === 0 ? "100%" : index % 3 === 1 ? "62%" : "78%",
          } as React.CSSProperties
        }
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-crypt-raise">
          <div ref={imageWrap} className="absolute inset-[-6%]">
            <Image
              src={getImageSrc(artwork.src, { width: 1400 })}
              alt={`${title} — ${meta}`}
              fill
              sizes="(max-width: 768px) 100vw, 70vw"
              className="object-cover transition-[filter,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [filter:brightness(0.82)] group-hover:[filter:brightness(1)] group-focus-visible:[filter:brightness(1)]"
            />
          </div>
          {/* Hairline frame; ember edge on hover/focus (scarce accent). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-rule/40 transition-colors duration-500 group-hover:border-accent/60 group-focus-visible:border-accent"
          />
        </div>
        <div className="mt-4">
          <h3 className="font-serif text-[clamp(1.15rem,2vw,1.6rem)] leading-tight text-bone">
            {title}
          </h3>
          {meta && (
            <p className="mt-1 font-sans text-[0.8125rem] text-muted lowercase">
              {meta}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
