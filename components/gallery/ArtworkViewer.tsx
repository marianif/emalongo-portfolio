"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Artwork } from "@/lib/artworks";
import { getImageSrc } from "@/lib/images";
import type { Locale } from "@/app/[lang]/dictionaries";

gsap.registerPlugin(useGSAP);

type Neighbor = { slug: string; title: string } | undefined;

/**
 * The single-work view: one painting glowing in the crypt. The page stays in
 * the dark room (no catalogue ground) so the work speaks first; title and
 * metadata sit quietly beneath it in bone and ash.
 *
 * Motion (continuous with the gallery card the visitor just clicked): a
 * clip-path inset wipes the frame open from the bottom while the image releases
 * from a slight zoom (expo.out), then the title and meta rise and fade in just
 * after. Reduced motion: everything present instantly, no wipe, no zoom.
 *
 * The whole collection is walkable from here: the ← / → arrow keys move to the
 * flanking works in the gallery's curated order, and quiet prev/next controls
 * carry the adjacent work's title so the visitor knows what's coming. Endpoints
 * simply omit the absent control; the collection does not wrap.
 */
export default function ArtworkViewer({
  artwork,
  lang,
  title,
  meta,
  prev,
  next,
  labels,
}: {
  artwork: Artwork;
  lang: Locale;
  /** Resolved (locale-aware) title of the current work. */
  title: string;
  /** Pre-joined "technique · dimensions · year" metadata rows. */
  meta: { label: string; value: string }[];
  prev: Neighbor;
  next: Neighbor;
  labels: { prev: string; next: string };
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // The work, its title AND its metadata must all fit within one screen — the
  // visitor never scrolls to learn what they're looking at. We cap the frame's
  // height to the viewport minus the chrome above (header + the compact back
  // link row) and the full caption below (title, which may wrap on long Italian
  // names, plus the metadata row). The budget is set as a CSS var so it can
  // differ per breakpoint (desktop reserves a little more for the larger type).
  // The frame holds the work's true aspect ratio, so capping height never crops
  // the image.
  const FRAME_VH_CAP = "var(--frame-cap)";

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;

      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        delay: 0.1,
      });
      // Frame wipes open from the bottom, the image eases out of a slow zoom —
      // the same vocabulary as the constellation card, so arriving here reads as
      // the clicked work stepping forward, not a new page loading.
      tl.fromTo(
        frame.current,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2 },
      )
        .fromTo(
          zoom.current,
          { scale: 1.14 },
          { scale: 1, duration: 1.5 },
          0,
        )
        // Title and meta rise in just behind the image's leading edge.
        .fromTo(
          "[data-reveal]",
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 },
          0.5,
        );
    },
    { scope: root },
  );

  // ← / → walk the collection from anywhere on the page (no need to focus the
  // controls first). Ignore when a modifier is held (browser nav / shortcuts)
  // or focus is in a field; honour the collection edges (no wrap). Prefetch the
  // neighbours so the jump is instant.
  useEffect(() => {
    if (prev) router.prefetch(`/${lang}/opere/${prev.slug}`);
    if (next) router.prefetch(`/${lang}/opere/${next.slug}`);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(`/${lang}/opere/${prev.slug}`);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(`/${lang}/opere/${next.slug}`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lang, prev, next, router]);

  return (
    <div
      ref={root}
      className="flex flex-col items-center [--frame-cap:calc(100svh-17rem)] sm:[--frame-cap:calc(100svh-19rem)]"
    >
      {/* The work, held in a pool of dark and capped to the viewport. */}
      <div
        ref={frame}
        className="relative w-full overflow-hidden bg-crypt-raise will-change-[clip-path]"
        style={{
          aspectRatio: artwork.aspect,
          // Height is bounded by the viewport budget so the title stays in view;
          // width is bounded both by the height cap (for tall works) and by a
          // sane column max (for wide works). The smaller bound wins.
          maxHeight: FRAME_VH_CAP,
          maxWidth: `min(100%, 64rem, calc(${FRAME_VH_CAP} * ${artwork.aspect}))`,
        }}
      >
        <div ref={zoom} className="absolute inset-0 will-change-transform">
          <Image
            src={getImageSrc(artwork.src, { width: 1600 })}
            alt={`${title}${meta.length ? ` — ${meta.map((m) => m.value).join(", ")}` : ""}`}
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1280px) 80vw, 1024px"
            className="object-contain"
            priority
          />
        </div>
        {/* A hairline plate edge so the work sits IN the dark, not on a card. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-[color-mix(in_oklab,var(--color-rule)_24%,transparent)]"
        />
      </div>

      {/* Caption: the title leads (Besley), metadata follows quietly (Hanken).
          Both ride within the reserved viewport budget, so they're always in
          view without scrolling. */}
      <div className="mt-6 w-full max-w-2xl text-center sm:mt-7">
        <h1
          data-reveal
          className="font-serif text-[clamp(1.625rem,3.4vw,2.75rem)] leading-[1.08] tracking-[-0.01em] text-balance text-bone"
        >
          {title}
        </h1>
        {meta.length > 0 && (
          <dl
            data-reveal
            className="mt-4 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1.5 font-sans text-[0.8125rem] lowercase tracking-[0.01em] text-muted"
          >
            {meta.map((m) => (
              <div key={m.label} className="flex items-baseline gap-2">
                <dt className="sr-only">{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Walk the collection: prev / next carry the adjacent work's title. */}
      {(prev || next) && (
        <nav
          data-reveal
          aria-label={labels.prev + " / " + labels.next}
          className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-6 border-t border-[color-mix(in_oklab,var(--color-rule)_24%,transparent)] pt-6 sm:mt-20"
        >
          {prev ? (
            <Link
              href={`/${lang}/opere/${prev.slug}`}
              data-cursor="view"
              className="group/nav flex min-h-11 flex-col items-start gap-1 outline-none focus-visible:ring-1 focus-visible:ring-ember"
            >
              <span className="font-sans text-[0.75rem] uppercase tracking-[0.12em] text-muted transition-colors duration-[240ms] ease-[var(--ease-exit)] group-hover/nav:text-ember group-focus-visible/nav:text-ember">
                ← {labels.prev}
              </span>
              <span className="font-serif text-[clamp(0.95rem,1.4vw,1.25rem)] leading-snug text-bone/80 transition-colors duration-[240ms] ease-[var(--ease-exit)] group-hover/nav:text-bone group-focus-visible/nav:text-bone">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span aria-hidden />
          )}
          {next ? (
            <Link
              href={`/${lang}/opere/${next.slug}`}
              data-cursor="view"
              className="group/nav flex min-h-11 flex-col items-end gap-1 text-right outline-none focus-visible:ring-1 focus-visible:ring-ember"
            >
              <span className="font-sans text-[0.75rem] uppercase tracking-[0.12em] text-muted transition-colors duration-[240ms] ease-[var(--ease-exit)] group-hover/nav:text-ember group-focus-visible/nav:text-ember">
                {labels.next} →
              </span>
              <span className="font-serif text-[clamp(0.95rem,1.4vw,1.25rem)] leading-snug text-bone/80 transition-colors duration-[240ms] ease-[var(--ease-exit)] group-hover/nav:text-bone group-focus-visible/nav:text-bone">
                {next.title}
              </span>
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </nav>
      )}
    </div>
  );
}
