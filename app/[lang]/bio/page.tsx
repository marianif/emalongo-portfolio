import { notFound } from "next/navigation";
import { hasLocale } from "../dictionaries";
import { getBio } from "@/lib/content";
import PageTransition from "@/components/motion/PageTransition";
import BioPageClient from "@/components/bio/BioPageClient";

export default async function BioPage({ params }: PageProps<"/[lang]/bio">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const { heading, paragraphs } = getBio(lang);

  return (
    <PageTransition>
      {/*
        The catalogue page: a black-and-white portrait leads as a hero that
        dissolves into the bone-paper ground, then the short biography reads as a
        single inked column. The artist statement is not here — it lives, in full,
        on /visione. Catalogue (light) ground throughout.
      */}
      <BioPageClient
        lang={lang}
        label={heading}
        name="Emanuele Longo"
        paragraphs={paragraphs}
      />
    </PageTransition>
  );
}
