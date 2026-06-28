"use client";

import { useCallback, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/motion/Reveal";
import type { ManifestoBeat } from "@/lib/content";
import { OrganismProvider, useOrganism } from "./organism/OrganismContext";
import OrganismCanvas from "./organism/OrganismCanvas";
import { sampleOrganism } from "./organism/sample";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The manifesto as a living organism, impaginated like a book. The WebGL ink
 * field breathes behind everything. The epigraph is the vertical threshold;
 * past it the manifesto flows into equal book columns that the reader scrolls
 * through horizontally — text paginates itself, so every column is the same
 * measure and height, no uneven panels.
 *
 * Type is one steady voice: Besley, one reading size, throughout. The organism
 * state is sampled from horizontal scroll progress (0..1) across the seven beats,
 * cross-fading as the reader travels. The blood-and-fire line stays large inline
 * where it falls in the flow, and ignites the field as it's read.
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
  const flowRef = useRef<HTMLDivElement>(null);

  const handleIgnite = useCallback(
    (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      setTarget({ ignite: 1, ignitePos: [x, y] });
    },
    [setTarget],
  );

  // Drive the organism from vertical scroll through the descent, and ignite the
  // field when the fire line enters view.
  useGSAP(
    () => {
      const flow = flowRef.current;
      if (!flow) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      ScrollTrigger.create({
        trigger: flow,
        start: "top 80%",
        end: "bottom 20%",
        onUpdate: (self) =>
          setTarget(sampleOrganism(self.progress, beats.length)),
      });

      const fire = flow.querySelector<HTMLElement>("[data-fire]");
      if (fire) {
        ScrollTrigger.create({
          trigger: fire,
          start: "top 70%",
          onEnter: () => handleIgnite(fire),
          onEnterBack: () => handleIgnite(fire),
          onLeave: () => setTarget({ ignite: 0 }),
          onLeaveBack: () => setTarget({ ignite: 0 }),
        });
      }
    },
    { scope: flowRef, dependencies: [beats.length] },
  );

  // One reading voice, one size. Besley, generous, ink softened on bone.
  const VERSE =
    "font-serif text-[clamp(1.35rem,1.7vw,1.7rem)] font-normal leading-[1.7] tracking-[-0.003em] text-foreground/85";

  return (
    <article
      data-ground="catalogue"
      className="relative isolate bg-background text-foreground"
    >
      <OrganismCanvas />

      {/* Threshold + epigraph — vertical, left-aligned, the door into the manifesto. */}
      <div className="relative z-10 px-6 pt-[clamp(7rem,20vh,12rem)] sm:px-10 lg:px-16">
        <header className="mx-auto max-w-[58ch] lg:mr-0 lg:ml-[8vw]">
          <Reveal as="div" y={20} className="mb-[clamp(3rem,9vh,6rem)]">
            <p className="font-sans text-[0.8125rem] uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.015em]">
              {title}
            </h1>
          </Reveal>

          <Reveal
            as="figure"
            y={24}
            delay={0.08}
            className="border-l border-rule pl-6 sm:pl-8"
          >
            <blockquote className="font-serif text-[clamp(1.5rem,2.8vw,2.15rem)] italic leading-[1.34] text-foreground/90">
              {epigraph}
            </blockquote>
            <figcaption className="mt-5 font-sans text-[0.8125rem] tracking-[0.01em] text-muted">
              {attribution}
            </figcaption>
          </Reveal>
        </header>
      </div>

      {/* The descent — vertical scroll, each beat centred on its own axis. */}
      <div
        ref={flowRef}
        className="relative z-10 mx-auto flex max-w-[90ch] flex-col items-center gap-[clamp(6rem,22vh,14rem)] px-6 pb-[clamp(8rem,24vh,15rem)] pt-[clamp(6rem,18vh,11rem)] text-justify sm:px-10"
      >
        {beats.map((beat, i) => (
          <Reveal as="div" key={i} y={28} className={VERSE}>
            {beat.text}
            {beat.swell && (
              <>
                <span
                  data-fire
                  className="mx-auto my-[0.7em] block max-w-[14ch] font-serif text-[clamp(2.1rem,3.4vw,3.4rem)] font-medium leading-[1.12] tracking-[-0.01em] text-foreground"
                >
                  <FireLine text={beat.swell} />
                </span>
                {beat.swellTail}
              </>
            )}
          </Reveal>
        ))}

        <Reveal as="div" y={18} className="flex items-center gap-4">
          <span className="h-px w-10 bg-rule" aria-hidden />
          <span className="font-sans text-[0.8125rem] tracking-[0.06em] text-muted">
            {colophon}
          </span>
          <span className="h-px w-10 bg-rule" aria-hidden />
        </Reveal>
      </div>
    </article>
  );
}

/* The fire line, set inline at display scale; "fuoco / fire" catches the ember
   (and triggers the field bloom from the scroll handler above). */
function FireLine({ text }: { text: string }) {
  const words = text.split(" ");
  const last = words.pop() ?? "";
  return (
    <>
      {words.join(" ")}{" "}
      <span style={{ color: "var(--color-ember-bright)" }}>{last}</span>
    </>
  );
}
