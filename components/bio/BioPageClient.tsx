"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Props {
  lang: string;
  /** Section label, e.g. "Biografia" / "Biography". */
  label: string;
  /** The artist's name — the page title. */
  name: string;
  /** Reading paragraphs of the short biography. */
  paragraphs: string[];
}

/**
 * Render light inline emphasis (`_word_`) within a biography paragraph. The
 * English file carries an italic translation note; the Italian prose is plain.
 * Anything more than emphasis would be over-engineering for this content.
 */
function renderParagraph(text: string) {
  return text.split(/(_[^_]+_)/g).map((part, i) => {
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return (
        <em key={i} className="text-muted">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export default function BioPageClient({ lang, label, name, paragraphs }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageWrap = useRef<HTMLDivElement>(null);
  const titleWrap = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Hero frame wipes open from the bottom — the portrait arrives first.
      if (!reduce && heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.2,
            ease: "expo.out",
            delay: 0.1,
          },
        );
      }

      // Label + title surface from the dark after the image leads.
      if (!reduce && titleWrap.current) {
        gsap.from(titleWrap.current.children, {
          opacity: 0,
          y: 24,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.12,
          delay: 0.35,
        });
      }

      if (reduce) return;

      // Parallax: the portrait drifts up slower than the scroll.
      gsap.to(imageWrap.current, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Title eases away as the hero scrolls past.
      gsap.to(titleWrap.current, {
        opacity: 0,
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "40% top",
          scrub: true,
        },
      });

      // The biography surfaces paragraph by paragraph as it enters the page.
      if (bodyRef.current) {
        gsap.from(bodyRef.current.children, {
          opacity: 0,
          y: 28,
          duration: 1,
          ease: "expo.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: bodyRef.current,
            start: "top 80%",
          },
        });
      }
    },
    { scope: root },
  );

  return (
    <article
      ref={root}
      data-ground="catalogue"
      className="bg-background text-foreground"
      lang={lang}
    >
      {/* ── Hero: the portrait immerses into the paper ── */}
      <div
        ref={heroRef}
        className="relative h-[65vh] min-h-[400px] w-full overflow-hidden will-change-[clip-path] sm:h-[72vh]"
      >
        <div ref={imageWrap} className="absolute inset-0 -bottom-[15%]">
          <Image
            src="/artist-photo.jpg"
            alt={`${name}, ritratto`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_30%]"
          />
        </div>

        {/* Atmospheric veil: the image dissolves into the bone-paper ground. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(115% 85% at 50% 32%, transparent 28%, color-mix(in srgb, var(--background) 50%, transparent) 82%, var(--background) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-background via-background/40 to-transparent"
        />

        {/* Label + title, lower-left, sitting on the veil. */}
        <div
          ref={titleWrap}
          className="absolute inset-x-0 bottom-0 px-6 pb-[clamp(2rem,5vh,4rem)] sm:px-10 lg:px-16"
        >
          <p className="mb-3 font-sans text-[0.8125rem] uppercase tracking-[0.18em] text-muted">
            {label}
          </p>
          <h1 className="max-w-[18ch] font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.015em]">
            {name}
          </h1>
        </div>
      </div>

      {/* ── Biography: a single reading column ── */}
      <div className="pb-[clamp(5rem,15vh,10rem)]">
        <div
          ref={bodyRef}
          className="mx-auto max-w-[60ch] px-6 pt-[clamp(3rem,9vh,5.5rem)] sm:px-10 lg:px-16"
        >
          {/* Opening rule: the catalogue page begins. */}
          <span
            aria-hidden
            className="mb-[clamp(2rem,5vh,3rem)] block h-px w-16 bg-rule"
          />
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="mb-[1.4em] font-serif text-[clamp(1.0625rem,1.45vw,1.25rem)] leading-[1.7] text-foreground last:mb-0 [&:first-of-type]:first-letter:float-left [&:first-of-type]:first-letter:mr-[0.08em] [&:first-of-type]:first-letter:font-medium [&:first-of-type]:first-letter:text-[3.4em] [&:first-of-type]:first-letter:leading-[0.82] [&:first-of-type]:first-letter:text-ember"
            >
              {renderParagraph(p)}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
