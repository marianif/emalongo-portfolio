import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getStatement, getManifestoBeats } from "@/lib/content";
import PageTransition from "@/components/motion/PageTransition";
import Manifesto from "@/components/visione/Manifesto";

export default async function VisionePage({
  params,
}: PageProps<"/[lang]/visione">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const { eyebrow, title, colophon } = dict.visione;
  const { epigraph, attribution } = getStatement("visione", lang);
  const beats = getManifestoBeats("visione", lang);

  return (
    <PageTransition>
      {/*
        The artist statement read as a living organism: a WebGL ink field breathes
        behind a single steady reading column and shifts state per beat, while the
        charged words enact their own meaning as they surface. Catalogue (light)
        ground throughout; the field stains within it, never repainting it.
      */}
      <div lang={lang}>
        <Manifesto
          eyebrow={eyebrow}
          title={title}
          colophon={colophon}
          epigraph={epigraph}
          attribution={attribution}
          beats={beats}
        />
      </div>
    </PageTransition>
  );
}
