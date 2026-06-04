"use client";

import { useCallback } from "react";
import Reveal from "@/components/motion/Reveal";
import type { ManifestoBeat } from "@/lib/content";
import {
  OrganismProvider,
  useOrganism,
} from "./organism/OrganismContext";
import OrganismCanvas from "./organism/OrganismCanvas";
import BeatDriver from "./organism/BeatDriver";
import KineticText from "./organism/KineticText";
import { WORD_ACTS } from "./organism/acts";

/**
 * The manifesto as a living organism. One WebGL field breathes behind the
 * column and changes state per beat; the words enact their own meaning as they
 * surface. Type stays a single, steady reading voice throughout — the cinema is
 * the organism and the words, not arbitrary font sizes.
 */

type Props = {
  eyebrow: string;
  title: string;
  colophon: string;
  epigraph: string;
  attribution: string;
  beats: ManifestoBeat[];
};

export default function Manifesto(props: Props) {
  return (
    <OrganismProvider>
      <Inner {...props} />
    </OrganismProvider>
  );
}

function Inner({
  eyebrow,
  title,
  colophon,
  epigraph,
  attribution,
  beats,
}: Props) {
  const { setTarget } = useOrganism();

  // When the fire word reaches view, bloom the canvas at its screen position.
  const handleIgnite = useCallback(
    (rect: DOMRect) => {
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      setTarget({ ignite: 1, ignitePos: [x, y] });
    },
    [setTarget],
  );

  const PROSE = "font-sans text-[1.0625rem] leading-[1.72] text-foreground/95 sm:text-[1.125rem]";

  return (
    <article
      data-ground="catalogue"
      className="relative isolate min-h-screen bg-background text-foreground"
    >
      <OrganismCanvas />

      <div className="relative z-10 px-6 pb-[clamp(7rem,22vh,13rem)] pt-[clamp(7rem,20vh,12rem)] sm:px-10 lg:px-16">
        {/* Threshold + epigraph. */}
        <header className="mx-auto max-w-[66ch] lg:mr-0 lg:ml-[8vw]">
          <Reveal as="div" y={20} className="mb-[clamp(3rem,9vh,6rem)]">
            <p className="font-sans text-[0.8125rem] uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.04] tracking-[-0.01em]">
              {title}
            </h1>
          </Reveal>

          <Reveal
            as="figure"
            y={24}
            delay={0.08}
            className="mb-[clamp(4rem,13vh,8rem)] border-l border-rule pl-6 sm:pl-8"
          >
            <blockquote className="font-serif text-[clamp(1.4rem,2.6vw,2rem)] italic leading-[1.34] text-foreground/90">
              {epigraph}
            </blockquote>
            <figcaption className="mt-5 font-sans text-[0.8125rem] tracking-[0.01em] text-muted">
              {attribution}
            </figcaption>
          </Reveal>
        </header>

        {/* The descent. Same measure throughout; the organism and words move. */}
        <div className="mx-auto flex max-w-[62ch] flex-col gap-[clamp(5rem,15vh,10rem)] lg:mr-0 lg:ml-[8vw]">
          {beats.map((beat, i) => (
            <BeatDriver key={i} role={beat.role} index={i}>
              <KineticText
                text={beat.text}
                acts={WORD_ACTS[beat.role]}
                className={PROSE}
              />

              {beat.swell && (
                <Swell
                  text={beat.swell}
                  tail={beat.swellTail}
                  onIgnite={handleIgnite}
                />
              )}
            </BeatDriver>
          ))}
        </div>

        {/* Colophon. */}
        <Reveal
          as="footer"
          y={18}
          className="mx-auto mt-[clamp(4rem,12vh,7rem)] flex max-w-[62ch] items-center gap-4 lg:mr-0 lg:ml-[8vw]"
        >
          <span className="h-px w-12 bg-rule" aria-hidden />
          <span className="font-sans text-[0.8125rem] tracking-[0.06em] text-muted">
            {colophon}
          </span>
        </Reveal>
      </div>
    </article>
  );
}

/* The blood-and-fire line — Besley display, the charged head breaking across
   lines; the fire word ignites both the type and the canvas bloom. The tail
   returns to body voice. */
function Swell({
  text,
  tail,
  onIgnite,
}: {
  text: string;
  tail?: string;
  onIgnite: (rect: DOMRect) => void;
}) {
  return (
    <div className="mt-[clamp(2.5rem,7vh,4.5rem)]">
      <KineticText
        as="p"
        text={text}
        acts={[
          { match: /sangue|blood/i, kind: "bleed" },
          { match: /fuoco|fire/i, kind: "ignite" },
        ]}
        onIgnite={onIgnite}
        start="top 76%"
        className="max-w-[20ch] font-serif text-[clamp(2rem,5vw,3.6rem)] leading-[1.08] tracking-[-0.01em] text-foreground"
      />
      {tail && (
        <Reveal
          as="p"
          y={22}
          delay={0.12}
          className="mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[44ch] font-sans text-[1.0625rem] leading-[1.74] text-foreground/80"
        >
          {tail}
        </Reveal>
      )}
    </div>
  );
}
