"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/app/[lang]/dictionaries";
import MenuOverlay, { type MenuEntry, type MenuContact } from "./MenuOverlay";

/**
 * Site chrome: a fixed, transparent bar over the page — wordmark on the left,
 * the menu trigger on the right. The chrome blends against whatever scrolls
 * beneath it via mix-blend-mode: difference — white type inverts to the
 * negative of the content behind it, so it stays legible over any ground
 * (dark gallery, light catalogue, busy artwork) without per-route overrides.
 *
 * Only the wordmark and trigger live inside the blend bar; the full-screen
 * MenuOverlay is rendered as a sibling (controlled via `open`) so the blend
 * never bleeds into the menu.
 */
export default function Nav({
  lang,
  entries,
  menuLabels,
  contact,
}: {
  lang: Locale;
  entries: MenuEntry[];
  menuLabels: {
    open: string;
    close: string;
    label: string;
    tagline: string;
    contactTitle: string;
  };
  contact: MenuContact;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* The blend bar: white chrome that reads as the negative of the page
          behind it. isolation:auto keeps it blending against the page rather
          than sealing into its own stacking context. */}
      <nav
        style={{ mixBlendMode: "difference", isolation: "auto" }}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-6 py-5 text-white sm:px-10 lg:px-16"
      >
        <Link
          href={`/${lang}`}
          data-cursor="view"
          className="font-serif text-base tracking-tight transition-opacity hover:opacity-70"
        >
          Emanuele Longo
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          data-cursor="view"
          aria-expanded={open}
          className="group flex items-center gap-2.5 font-sans text-[0.8125rem] tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
        >
          <span aria-hidden className="flex h-3 w-5 flex-col justify-between">
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          {menuLabels.open}
        </button>
      </nav>

      <MenuOverlay
        lang={lang}
        entries={entries}
        labels={menuLabels}
        contact={contact}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
