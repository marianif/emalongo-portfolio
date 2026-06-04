import type { Metadata } from "next";
import { Besley, Hanken_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, hasLocale, LOCALES } from "./dictionaries";
import {
  CATEGORIES,
  getAllArtworks,
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

  // The Index entries: each voice borrows a curated artwork face. Opere carries
  // a count · years meta line and nests the three bodies of work.
  const totalWorks = getAllArtworks().length;
  const yearsFor = (works: { year?: string }[]) => {
    const ys = works
      .flatMap((w) => (w.year ? w.year.split("-") : []))
      .map((y) => parseInt(y, 10))
      .filter((y) => !Number.isNaN(y));
    return ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : undefined;
  };
  const allYears = yearsFor(getAllArtworks());

  const menuEntries: MenuEntry[] = [
    {
      key: "opere",
      href: `/${lang}/opere`,
      label: dict.nav.opere,
      cover: getMenuFace("opere")?.src,
      meta: `${totalWorks}${allYears ? ` · ${allYears}` : ""}`,
      children: CATEGORIES.map((category) => {
        const works = getArtworksByCategory(category);
        return {
          key: category,
          href: `/${lang}/opere?categoria=${category}`,
          label: dict.categories[category],
          meta: String(works.length),
        };
      }),
    },
    {
      key: "bio",
      href: `/${lang}/bio`,
      label: dict.nav.bio,
      cover: getMenuFace("bio")?.src,
    },
    {
      key: "visione",
      href: `/${lang}/visione`,
      label: dict.nav.visione,
      cover: getMenuFace("visione")?.src,
    },
  ];

  // Contatti lives inside the menu (no page of its own): an expandable row
  // revealing email + Instagram, with its own curated cover behind it.
  const contact = {
    label: dict.nav.contatti,
    cover: getMenuFace("contatti")?.src,
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
