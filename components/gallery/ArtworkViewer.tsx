"use client";

import { useEffect, useRef, useState } from "react";
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
  const plate = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const router = useRouter();

  // The reveal must wipe open over the ACTUAL painting, not an empty frame — so
  // we hold the animation until the image has decoded. `loaded` flips on the
  // <Image> onLoad (or a safety timeout for cache hits / stalled loads, so the
  // frame can never stay sealed shut). The frame stays clipped closed until then.
  const [loaded, setLoaded] = useState(false);

  // The work, its title AND its metadata must all fit within one screen — the
  // visitor never scrolls to learn what they're looking at. We cap the frame's
  // height to the viewport minus the chrome above (header + the compact back
  // link row) and the full caption below (title, which may wrap on long Italian
  // names, plus the metadata row). The budget is set as a CSS var so it can
  // differ per breakpoint (desktop reserves a little more for the larger type).
  // The frame holds the work's true aspect ratio, so capping height never crops
  // the image.
  const FRAME_VH_CAP = "var(--frame-cap)";

  // Walking prev/next keeps this component mounted while the work changes, so
  // reset the load gate when the slug changes — the new painting re-seals the
  // frame and re-plays the reveal rather than appearing instantly. If the new
  // image is ALREADY decoded (prefetched neighbour, back-button), its onLoad
  // won't fire again, so check `.complete` synchronously and reveal at once.
  useEffect(() => {
    if (img.current?.complete) setLoaded(true);
    else setLoaded(false);
  }, [artwork.slug]);

  // Safety net only: if onLoad never fires (decode error, an already-complete
  // cached image whose event React missed), reveal anyway after a beat so the
  // frame can never stay sealed shut. The real trigger is the image's onLoad —
  // this is the long-stop fallback, not the fast path. Re-armed per work.
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setLoaded(true), 2500);
    return () => clearTimeout(t);
  }, [loaded, artwork.slug]);

  // Pre-seal the frame whenever a fresh work is loading (mount, or walking to a
  // new slug before its image decodes), so the empty dark frame is never
  // visible. Reduced motion skips this — everything stays present.
  useGSAP(
    () => {
      if (loaded) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;
      gsap.set(frame.current, { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(zoom.current, { scale: 1.14 });
      gsap.set("[data-reveal]", { y: 18, opacity: 0 });
      // The plate (title + meta) surfaces softly to fill the wait, breathing
      // faintly so the dark never feels stalled.
      gsap.fromTo(
        plate.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.15 },
      );
    },
    { scope: root, dependencies: [loaded] },
  );

  // Play the reveal only once the painting has actually decoded, so the
  // clip-path wipe and the slow zoom-out happen OVER the work — the clicked
  // piece stepping forward — instead of over an empty frame the image then
  // pops into. Reduced motion: no-op (the pre-seal didn't run either).
  useGSAP(
    () => {
      if (!loaded) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      // The plate dims out as the work surfaces — words giving way to the image.
      tl.to(
        plate.current,
        { opacity: 0, duration: 0.5, ease: "power2.in" },
        0,
      )
        .to(
          frame.current,
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2 },
          0,
        )
        .to(zoom.current, { scale: 1, duration: 1.5 }, 0)
        // Title and meta rise in just behind the image's leading edge.
        .to(
          "[data-reveal]",
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 },
          0.5,
        );
    },
    { scope: root, dependencies: [loaded] },
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
      {/* The work, held in a pool of dark and capped to the viewport. The frame
          and its loading placeholder share one footprint, so the caption below
          never shifts when the image arrives. */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: artwork.aspect,
          maxHeight: FRAME_VH_CAP,
          maxWidth: `min(100%, 64rem, calc(${FRAME_VH_CAP} * ${artwork.aspect}))`,
        }}
      >
        {/* While the painting loads, the frame is sealed shut; rather than show
            an empty dark rectangle, hold the work's "plate" — title and
            metadata, like a catalogue page turned before the image resolves.
            It sits UNDER the frame (which clips closed over it) and fades as the
            wipe begins, so the words give way to the work. aria-hidden: the same
            text is the real caption below; this copy is purely atmospheric. */}
        <div
          ref={plate}
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center opacity-0"
        >
          <span className="font-serif text-[clamp(1.1rem,2.2vw,1.6rem)] leading-tight tracking-[-0.01em] text-balance text-bone/55">
            {title}
          </span>
          {meta.length > 0 && (
            <span className="font-sans text-[0.75rem] lowercase tracking-[0.06em] text-muted/70">
              {meta.map((m) => m.value).join("  ·  ")}
            </span>
          )}
        </div>

        <div
          ref={frame}
          className="absolute inset-0 overflow-hidden bg-crypt-raise will-change-[clip-path]"
        >
          <div ref={zoom} className="absolute inset-0 will-change-transform">
            <Image
              ref={img}
              src={getImageSrc(artwork.src, { width: 1600 })}
              alt={`${title}${meta.length ? ` — ${meta.map((m) => m.value).join(", ")}` : ""}`}
              fill
              sizes="(max-width: 768px) 92vw, (max-width: 1280px) 80vw, 1024px"
              className="object-contain"
              priority
              onLoad={() => setLoaded(true)}
            />
          </div>
          {/* A hairline plate edge so the work sits IN the dark, not on a card. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-[color-mix(in_oklab,var(--color-rule)_24%,transparent)]"
          />
        </div>
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
