"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getImageSrc } from "@/lib/images";
import type { Locale } from "@/app/[lang]/dictionaries";

gsap.registerPlugin(useGSAP);

export type MenuEntry = {
  /** Stable key (also the voice key used to resolve its curated face). */
  key: string;
  href: string;
  label: string;
  /** Curated cover image src for this voice, if any. */
  cover?: string;
  /** Sub-entries (the bodies of work under Opere), each with its count. */
  children?: { key: string; href: string; label: string; meta?: string }[];
};

/** Contatti has no page of its own — it lives in the menu's colophon band. */
export type MenuContact = {
  email: string;
  emailLabel: string;
  instagramHandle: string;
  instagramUrl: string;
  instagramLabel: string;
};

/**
 * The Index — a full-screen typographic menu. Routes stack as large Besley
 * rows, like a catalogue's contents page, left-aligned on a baseline grid. The
 * hovered row's curated artwork cross-fades in behind the type (deeply dimmed,
 * heavily scrimmed so words always read); the other rows recede to muted, and a
 * thin ember rule draws under the active word — the accent marks position
 * without ever tinting the giant word, which stays bone for full contrast.
 * Reduced motion: instant open/close. Closes on route change, Escape, the close
 * control, and clicking the empty right gutter.
 */
export default function MenuOverlay({
  lang,
  entries,
  labels,
  contact,
}: {
  lang: Locale;
  entries: MenuEntry[];
  labels: {
    open: string;
    close: string;
    label: string;
    tagline: string;
    contactTitle: string;
  };
  contact: MenuContact;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);

  const otherLang: Locale = lang === "it" ? "en" : "it";
  const switchHref =
    pathname.replace(/^\/(it|en)/, `/${otherLang}`) || `/${otherLang}`;

  const close = () => setOpen(false);

  // Close on route change (a link was followed).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape to close; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Open animation: rows clip-reveal up in stagger. Visibility/pointer-events
  // are driven by React classes (not GSAP autoAlpha) so close is always
  // reliable; GSAP only animates the inner motion.
  useGSAP(
    () => {
      if (!open) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const rows = gsap.utils.toArray<HTMLElement>("[data-menu-rowtext]");
      if (reduce) {
        gsap.set(rows, { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0 });
        return;
      }
      gsap.fromTo(
        rows,
        { clipPath: "inset(0% 0% 100% 0%)", yPercent: 14 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          yPercent: 0,
          duration: 0.85,
          ease: "expo.out",
          stagger: 0.07,
        },
      );
    },
    { dependencies: [open], scope: overlay },
  );

  // Background faces for the index voices. Contatti lives in the colophon band
  // (its own ground), so it has no backdrop here.
  const faces = entries
    .map((e) => ({ key: e.key, cover: e.cover }))
    .filter((f) => f.cover);

  // The image behind the type: the active voice's face, or the first as a
  // resting state so the stage is never empty.
  const shownKey = active ?? faces[0]?.key;
  // Lift the scrim once a row is engaged, so the artwork actually reads.
  const engaged = active !== null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-cursor="view"
        aria-expanded={open}
        className="group flex items-center gap-2.5 font-sans text-[0.8125rem] tracking-[0.06em] text-bone uppercase transition-colors hover:text-accent"
      >
        <span aria-hidden className="flex h-3 w-5 flex-col justify-between">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current transition-transform duration-300 group-hover:translate-x-1" />
        </span>
        {labels.open}
      </button>

      {/* Overlay. Mounted always; shown/hidden + click-through via React state,
          so closing is deterministic regardless of in-flight animations. */}
      <div
        ref={overlay}
        role="dialog"
        aria-modal="true"
        aria-label={labels.label}
        onClick={(e) => {
          // Click on the backdrop itself (not a child) closes.
          if (e.target === e.currentTarget) close();
        }}
        style={{
          // Opacity fades immediately; visibility flips only after the fade so
          // the close transition is still seen. When hidden, the whole subtree
          // (including pointer-events-auto children) is removed from hit-testing
          // so it can never intercept clicks on the Menu button.
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: open
            ? "opacity 300ms ease, visibility 0ms"
            : "opacity 300ms ease, visibility 0ms 300ms",
        }}
        className="fixed inset-0 z-[120] bg-crypt-deep"
      >
        {/* Cross-fading curated image behind the type. Brightness lifts when a
            row is engaged so the artwork is clearly visible. */}
        <div className="pointer-events-none absolute inset-0">
          {faces.map((f) => (
            <Image
              key={f.key}
              src={getImageSrc(f.cover as string, { width: 1600 })}
              alt=""
              fill
              sizes="100vw"
              aria-hidden
              className={`object-cover transition-[opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                engaged
                  ? "[filter:brightness(0.62)_saturate(0.95)]"
                  : "[filter:brightness(0.4)_saturate(0.85)]"
              } ${f.key === shownKey ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          {/* Left-weighted scrim so rows always read. It lifts on engage so the
              image change is visible, staying heaviest at the left edge where
              the type sits. */}
          <span
            aria-hidden
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              background:
                "linear-gradient(to right, rgba(13,11,8,0.92) 0%, rgba(13,11,8,0.6) 42%, rgba(13,11,8,0.2) 100%)",
              opacity: engaged ? 0.72 : 1,
            }}
          />
        </div>

        {/* Top bar: index label + close. Highest layer so it's always hit. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
          <span className="font-sans text-[0.8125rem] tracking-[0.16em] text-muted uppercase">
            {labels.label}
          </span>
          <button
            type="button"
            onClick={close}
            data-cursor="view"
            aria-label={labels.close}
            className="group pointer-events-auto flex items-center gap-2.5 font-sans text-[0.8125rem] tracking-[0.06em] text-bone uppercase transition-colors hover:text-accent"
          >
            {labels.close}
            <span aria-hidden className="relative block h-3.5 w-3.5">
              <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 rotate-45 bg-current transition-transform duration-300 group-hover:rotate-[135deg]" />
              <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 -rotate-45 bg-current transition-transform duration-300 group-hover:rotate-45" />
            </span>
          </button>
        </div>

        {/* The index rows — left-aligned, vertically centered between the top
            bar and the colophon band (top/bottom padding keeps clear of both). */}
        <nav className="relative flex h-full flex-col justify-center px-6 pt-20 pb-32 sm:px-10 lg:px-16">
          <ul
            className="flex w-full max-w-5xl flex-col"
            onMouseLeave={() => setActive(null)}
          >
            {entries.map((entry) => {
              const dimmed = active !== null && active !== entry.key;
              const isActive = active === entry.key;
              return (
                <li
                  key={entry.key}
                  className="border-t border-rule/15"
                  onMouseEnter={() => setActive(entry.key)}
                >
                  {/* Title + bodies-of-work. The children are a numbered
                      catalogue sub-index: inline beside the big word on lg+
                      (aligned to its foot), stacked beneath on smaller screens.
                      The list reveals on the active row only and is always shown
                      on touch. It sits on its own solid plate so it stays
                      legible over the artwork. Title and child links are
                      siblings (never nested anchors). */}
                  <div className="flex flex-col gap-x-10 py-[clamp(0.6rem,1.8vh,1.3rem)] lg:flex-row lg:items-end lg:justify-between">
                    <Link
                      href={entry.href}
                      data-cursor="view"
                      onFocus={() => setActive(entry.key)}
                      className="group block outline-none"
                    >
                      {/* No overflow-hidden: the GSAP reveal uses clipPath on
                          the inner span, which clips to the glyph box (descenders
                          included) and never permanently crops them. */}
                      <span
                        data-menu-rowtext
                        className={`inline-block font-serif text-[clamp(2rem,7.5vw,5.5rem)] leading-[1.1] text-bone transition-opacity duration-300 ${
                          dimmed ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        {entry.label}
                      </span>
                    </Link>

                    {entry.children && (
                      <ul
                        className={`mb-[clamp(0.4rem,1.1vh,1rem)] flex flex-col gap-[0.15em] transition-opacity duration-300 max-lg:mt-3 max-lg:opacity-100 lg:items-end lg:text-right ${
                          isActive ? "lg:opacity-100" : "lg:opacity-0"
                        }`}
                      >
                        {entry.children.map((child) => (
                          <li key={child.key}>
                            <Link
                              href={child.href}
                              data-cursor="view"
                              className="group inline-flex items-baseline gap-2 font-serif text-[clamp(1.05rem,1.7vw,1.5rem)] leading-tight text-bone/85 transition-colors hover:text-accent [text-shadow:0_1px_12px_rgba(13,11,8,0.9)]"
                            >
                              {child.label}
                              {child.meta && (
                                <span className="font-sans text-[0.65em] text-muted tabular-nums [text-shadow:0_1px_10px_rgba(13,11,8,0.95)]">
                                  {child.meta}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* The Colophon: a contact band at the foot of the menu, on solid crypt
            ground (no image behind) so the channels are always legible — like
            the contact line in a catalogue's colophon. Hairline rule separates
            it from the index above. */}
        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-rule/15 bg-crypt-deep">
          <div className="flex flex-col gap-4 px-6 py-5 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16">
            {/* Channels: email + Instagram, comfortably readable. */}
            <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  data-cursor="view"
                  className="group inline-flex items-baseline gap-2.5 font-sans text-[0.9375rem] text-bone transition-colors hover:text-accent"
                >
                  <span className="font-sans text-[0.6875rem] tracking-[0.14em] text-rule uppercase">
                    {contact.emailLabel}
                  </span>
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="view"
                  className="group inline-flex items-baseline gap-2.5 font-sans text-[0.9375rem] text-bone transition-colors hover:text-accent"
                >
                  <span className="font-sans text-[0.6875rem] tracking-[0.14em] text-rule uppercase">
                    {contact.instagramLabel}
                  </span>
                  {contact.instagramHandle}
                </a>
              </li>
            </ul>

            {/* Tagline + language toggle. */}
            <div className="flex items-center gap-5">
              <span className="hidden font-serif text-sm text-muted italic lg:inline">
                {labels.tagline}
              </span>
              <div className="flex items-center gap-1.5 font-sans text-[0.8125rem]">
                <span className="text-accent">{lang.toUpperCase()}</span>
                <span className="text-rule" aria-hidden>
                  /
                </span>
                <Link
                  href={switchHref}
                  data-cursor="view"
                  className="text-muted transition-colors hover:text-bone"
                  aria-label={`Switch to ${otherLang === "it" ? "Italiano" : "English"}`}
                >
                  {otherLang.toUpperCase()}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
