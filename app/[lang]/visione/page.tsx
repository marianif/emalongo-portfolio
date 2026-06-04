import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getStatement } from "@/lib/content";
import PageTransition from "@/components/motion/PageTransition";
import Reveal from "@/components/motion/Reveal";
import StatementAtmosphere from "@/components/visione/StatementAtmosphere";

export default async function VisionePage({
  params,
}: PageProps<"/[lang]/visione">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const { eyebrow, title, colophon } = dict.visione;
  const { epigraph, attribution, paragraphs } = getStatement("visione", lang);

  return (
    <PageTransition>
      {/*
        The statement is long-form reading: catalogue (light) ground. The page
        itself is the work here — text stands alone, no plate. One flowing
        column under a fixed "lit page" vignette; each paragraph rises into view
        as the reader descends.
      */}
      <article
        data-ground="catalogue"
        lang={lang}
        className="relative isolate min-h-screen bg-background text-foreground"
      >
        <StatementAtmosphere />

        {/* The reading column: offset left of centre so it reads as set, not
            templated. ~62ch measure for a calm, monograph line. */}
        <div className="relative z-10 px-6 pb-[clamp(6rem,18vh,11rem)] pt-[clamp(7rem,20vh,12rem)] sm:px-10 lg:px-16">
          <div className="ml-0 max-w-[62ch] lg:ml-[8vw]">
            {/* Threshold: the artist's name for the piece, quiet in Hanken. */}
            <Reveal as="header" y={20} className="mb-[clamp(3rem,9vh,6rem)]">
              <p className="font-sans text-[0.8125rem] uppercase tracking-[0.18em] text-muted">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-serif text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.04] tracking-[-0.01em]">
                {title}
              </h1>
            </Reveal>

            {/* Epigraph — Besley italic, the door into the manifesto. */}
            <Reveal
              as="figure"
              y={24}
              delay={0.08}
              className="mb-[clamp(3.5rem,11vh,7rem)] border-l border-rule pl-6 sm:pl-8"
            >
              <blockquote className="font-serif text-[clamp(1.4rem,2.6vw,2rem)] italic leading-[1.34] text-foreground/90">
                {epigraph}
              </blockquote>
              <figcaption className="mt-5 font-sans text-[0.8125rem] tracking-[0.01em] text-muted">
                {attribution}
              </figcaption>
            </Reveal>

            {/* The manifesto. Each paragraph fades up on entry; rhythm varies so
                the descent breathes instead of marching. */}
            <div className="space-y-[clamp(1.75rem,4vh,2.75rem)]">
              {paragraphs.map((para, i) => (
                <Reveal
                  key={i}
                  as="p"
                  y={26}
                  duration={0.84}
                  className="font-sans text-[1.0625rem] leading-[1.72] text-foreground/95 sm:text-[1.125rem]"
                >
                  {para}
                </Reveal>
              ))}
            </div>

            {/* Colophon — the hand behind the page, after the last line. */}
            <Reveal
              as="footer"
              y={18}
              className="mt-[clamp(3.5rem,10vh,6rem)] flex items-center gap-4"
            >
              <span className="h-px w-12 bg-rule" aria-hidden />
              <span className="font-sans text-[0.8125rem] tracking-[0.06em] text-muted">
                {colophon}
              </span>
            </Reveal>
          </div>
        </div>
      </article>
    </PageTransition>
  );
}
