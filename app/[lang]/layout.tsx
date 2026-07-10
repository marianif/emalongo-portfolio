import type { Metadata } from "next";
import { Besley, Hanken_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, hasLocale, LOCALES } from "./dictionaries";
import {
  CATEGORIES,
  getArtworksByCategory,
  getMenuFace,
} from "@/lib/artworks";
import LenisProvider from "@/components/motion/LenisProvider";
import Cursor from "@/components/motion/Cursor";
import Nav from "@/components/layout/Nav";
import type { MenuEntry } from "@/components/layout/MenuOverlay";
import Footer from "@/components/layout/Footer";

// The artist's voice: an inked slab serif (Clarendon lineage), not an airy
// editorial text-serif. Italic carries the manifesto's emphatic passages.
const besley = Besley({
  variable: "--font-besley",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Institutional chrome: a quiet humanist grotesque for nav, labels, metadata.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Emanuele Longo",
  description: "Espressionismo visionario — Emanuele Longo",
  other: {
    "color-scheme": "light",
  },
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  // The Index entries: each voice borrows a curated artwork face. Opere nests
  // the three bodies of work (each with its count) as a hover-revealed sub-row.
  const categoryCounts = await Promise.all(
    CATEGORIES.map(async (category) => ({
      key: category,
      href: `/${lang}/opere?categoria=${category}`,
      label: dict.categories[category],
      meta: String((await getArtworksByCategory(category)).length),
    })),
  );

  const menuEntries: MenuEntry[] = [
    {
      key: "opere",
      href: `/${lang}/opere`,
      label: dict.nav.opere,
      cover: getMenuFace("opere"),
      children: categoryCounts,
    },
    {
      key: "bio",
      href: `/${lang}/bio`,
      label: dict.nav.bio,
      // Biografia is the one voice that's a person, not a painting: the artist's
      // own portrait faces it in the Index, the same image that leads /bio.
      cover: "/artist-photo.jpg",
    },
    {
      key: "visione",
      href: `/${lang}/visione`,
      label: dict.nav.visione,
      cover: getMenuFace("visione"),
    },
  ];

  // Contatti lives in the menu's colophon band (no page of its own): email +
  // Instagram on solid ground at the foot of the open menu.
  const contact = {
    email: dict.menu.email,
    emailLabel: dict.menu.emailLabel,
    instagramHandle: dict.menu.instagramHandle,
    instagramUrl: dict.menu.instagramUrl,
    instagramLabel: dict.menu.instagramLabel,
  };

  return (
    <html
      lang={lang}
      className={`${besley.variable} ${hanken.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (ColorZilla, Grammarly,
          etc.) inject attributes like cz-shortcut-listen onto <body> before
          React hydrates, which otherwise trips a hydration mismatch and can
          stop event handlers from attaching. */}
      <body
        className="min-h-full flex flex-col bg-crypt"
        suppressHydrationWarning
      >
        <LenisProvider>
          <Cursor />
          <Nav
            lang={lang}
            entries={menuEntries}
            menuLabels={dict.menu}
            contact={contact}
          />
          <main className="flex-1">{children}</main>
          <Footer rights={dict.footer.rights} email={dict.menu.email} />
        </LenisProvider>
      </body>
    </html>
  );
}
