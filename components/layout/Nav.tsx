"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/app/[lang]/dictionaries";
import MenuOverlay, { type MenuEntry, type MenuContact } from "./MenuOverlay";

// Routes that render on a catalogue (light paper) ground.
const CATALOGUE_ROUTES = ["/bio"];

/**
 * Site chrome: a fixed, transparent bar over the page — wordmark on the left,
 * the menu trigger on the right. On catalogue (light) pages the nav adopts the
 * catalogue ground via data-ground so text-foreground resolves to ink instead
 * of bone, keeping contrast correct without any hard-coded colour overrides.
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
  const pathname = usePathname();
  const isCatalogue = CATALOGUE_ROUTES.some((r) => pathname.endsWith(r));

  return (
    <nav
      data-ground={isCatalogue ? "catalogue" : undefined}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-6 py-5 sm:px-10 lg:px-16"
    >
      <Link
        href={`/${lang}`}
        data-cursor="view"
        className="font-serif text-base tracking-tight text-foreground transition-colors hover:text-accent"
      >
        Emanuele Longo
      </Link>

      <MenuOverlay
        lang={lang}
        entries={entries}
        labels={menuLabels}
        contact={contact}
        isCatalogue={isCatalogue}
      />
    </nav>
  );
}
