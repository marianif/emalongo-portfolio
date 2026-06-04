"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getImageSrc } from "@/lib/images";
import type { Artwork, Category } from "@/lib/artworks";
import type { Locale } from "@/app/[lang]/dictionaries";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Gateway = {
  category: Category;
  label: string;
  description: string;
  cover?: Artwork;
  count: number;
  years?: string;
};

/**
 * Triptych panels: three full-height vertical wings (altarpiece / hanging
 * banners) into the three bodies of work. On scroll the panels clip-reveal in
 * sequence (the page's cinematic language). On hover/focus the active wing
 * widens via flex-grow while the others recede, with an ember seam between
 * them. Mobile: panels stack full-bleed, no expansion. Reduced motion: present.
 */
export default function BodiesOfWork({
  title,
  gateways,
  enterLabel,
  lang,
}: {
  title: string;
  gateways: Gateway[];
  enterLabel: string;
  lang: Locale;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
      gsap.fromTo(
        panels,
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="bg-crypt-deep px-6 pt-[clamp(4rem,12vh,9rem)] pb-[clamp(4rem,12vh,9rem)] sm:px-10 lg:px-16"
    >
      <h2 className="mb-8 font-serif text-[clamp(1.6rem,3.5vw,2.6rem)] text-bone">
        {title}
      </h2>

      {/* Triptych: row of expanding wings on md+, stacked full-bleed below. */}
      <div
        className="flex flex-col gap-px md:h-[78vh] md:flex-row"
        onMouseLeave={() => setActive(null)}
      >
        {gateways.map((g, i) => {
          // flex-grow drives the expansion (animatable, no layout-width jank).
          const grow = active === null ? 1 : active === i ? 2.4 : 0.7;
          return (
            <Link
              key={g.category}
              data-panel
              href={`/${lang}/opere?categoria=${g.category}`}
              data-cursor="view"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="group relative flex h-[58vh] items-end overflow-hidden bg-crypt-raise outline-none transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-auto md:min-w-0"
              style={{ flexGrow: grow, flexBasis: 0 }}
            >
              {g.cover && (
                <Image
                  src={getImageSrc(g.cover.src, { width: 1100 })}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-[filter,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] [filter:brightness(0.5)] group-hover:[filter:brightness(0.92)] group-hover:scale-[1.03] group-focus-visible:[filter:brightness(0.92)]"
                />
              )}

              {/* Bottom veil so the label always reads. */}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, var(--crypt-deep) 4%, rgba(13,11,8,0.62) 32%, transparent 64%)",
                }}
              />

              {/* Label block. Title stays bone (readable). Count top-right;
                  description, years, and the enter affordance reveal on active. */}
              <span
                aria-hidden
                className="absolute top-6 right-6 z-10 font-sans text-xs tracking-[0.08em] text-muted tabular-nums lg:top-8 lg:right-8"
              >
                {g.count} {g.years ? `· ${g.years}` : ""}
              </span>

              <div className="relative z-10 w-full p-6 lg:p-8">
                <h3 className="font-serif text-[clamp(1.5rem,2.6vw,2.8rem)] leading-[0.95] text-bone">
                  {g.label}
                </h3>

                {/* Revealed detail: present when this wing is active. */}
                <div
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] max-md:mt-4 max-md:grid-rows-[1fr] max-md:opacity-100 ${
                    active === i
                      ? "mt-4 grid-rows-[1fr] opacity-100"
                      : "mt-0 grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[34ch] font-sans text-sm leading-relaxed text-bone/75">
                      {g.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs tracking-[0.12em] text-accent uppercase">
                      {enterLabel}
                      <span
                        aria-hidden
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Ember seam on the leading edge of the active wing. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors duration-500 ${
                  active === i ? "bg-accent" : "bg-rule/25"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
