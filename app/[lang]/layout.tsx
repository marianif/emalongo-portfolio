import type { Metadata } from "next";
import { Besley, Hanken_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, hasLocale, LOCALES } from "./dictionaries";
import LenisProvider from "@/components/motion/LenisProvider";
import Nav from "@/components/layout/Nav";
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

  return (
    <html
      lang={lang}
      className={`${besley.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-crypt">
        <LenisProvider>
          <Nav lang={lang} labels={dict.nav} />
          <main className="flex-1">{children}</main>
          <Footer
            lang={lang}
            rights={dict.footer.rights}
            contattiLabel={dict.nav.contatti}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
