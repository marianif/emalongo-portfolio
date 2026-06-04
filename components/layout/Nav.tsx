"use client";

import Link from "next/link";
import type { Locale } from "@/app/[lang]/dictionaries";
import MenuOverlay, {
  type MenuEntry,
  type MenuContact,
} from "./MenuOverlay";

/**
 * Site chrome: a fixed, transparent bar over the crypt — wordmark on the left,
 * the menu trigger on the right. The full navigation lives in MenuOverlay (The
 * Index): a full-screen typographic menu, openable on every breakpoint. No
 * persistent link row and no hidden hamburger-drawer compromise — one
 * deliberate, cinematic opening.
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
  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-6 py-5 sm:px-10 lg:px-16">
      <Link
        href={`/${lang}`}
        data-cursor="view"
        className="font-serif text-base tracking-tight text-bone transition-colors hover:text-accent"
      >
        E. Longo
      </Link>

      <MenuOverlay
        lang={lang}
        entries={entries}
        labels={menuLabels}
        contact={contact}
      />
    </nav>
  );
}
