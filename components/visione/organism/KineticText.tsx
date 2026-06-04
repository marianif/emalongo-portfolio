"use client";

import { useRef, type ElementType } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Words that behave like what they mean. The passage is split into words that
 * surface clause-by-clause as the reader descends (the base reading motion);
 * charged words matched by `acts` get a treatment enacting their sense — a word
 * for fire catches an ember, a word for shattering comes apart, a word for
 * surfacing rises from beneath the line.
 *
 * All effects are transform/opacity/colour only. Under prefers-reduced-motion
 * every word renders fully present in ink, no surfacing, no enactment — the
 * meaning lives in the prose, which is intact and in order regardless.
 */

export type ActKind =
  | "glow"
  | "sink"
  | "scatter"
  | "strike"
  | "rise"
  | "bleed"
  | "ignite";

export type WordAct = { match: RegExp; kind: ActKind };

const EMBER = "var(--color-ember)";
const FIRE = "var(--color-ember-bright)";

function matchAct(word: string, acts: WordAct[]): ActKind | null {
  for (const a of acts) if (a.match.test(word)) return a.kind;
  return null;
}

export default function KineticText({
  text,
  acts = [],
  className,
  as: Tag = "p",
  start = "top 80%",
  onIgnite,
}: {
  text: string;
  acts?: WordAct[];
  className?: string;
  as?: ElementType;
  start?: string;
  /** Fires when an `ignite` word reaches the viewport — drives the canvas bloom. */
  onIgnite?: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(/(\s+)/); // keep whitespace tokens for natural flow

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const wordEls = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-w]"));

      // Base surfacing: every word gathers in with a soft stagger.
      gsap.set(wordEls, { opacity: 0, y: 14, filter: "blur(3px)" });
      gsap.to(wordEls, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        ease: "expo.out",
        duration: 0.8,
        stagger: 0.035,
        scrollTrigger: { trigger: el, start, toggleActions: "play none none reverse" },
      });

      // Per-act enactment, layered on top of the base surfacing.
      wordEls.forEach((w) => {
        const kind = w.dataset.act as ActKind | undefined;
        if (!kind) return;

        const tl = gsap.timeline({
          scrollTrigger: { trigger: w, start: "top 72%", toggleActions: "play none none reverse" },
        });

        switch (kind) {
          case "glow":
            tl.fromTo(w, { color: "inherit" }, { color: EMBER, duration: 0.9, ease: "sine.inOut" })
              .to(w, { textShadow: `0 0 18px ${EMBER}55`, duration: 0.6 }, "<");
            break;
          case "sink":
            tl.fromTo(w, { y: -6, opacity: 1 }, { y: 16, opacity: 0.45, duration: 1.0, ease: "power2.in" });
            break;
          case "rise":
            tl.fromTo(w, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0, ease: "expo.out" });
            break;
          case "bleed":
            tl.fromTo(w, { color: "inherit" }, { color: EMBER, duration: 1.1, ease: "power1.inOut" });
            break;
          case "ignite":
            tl.fromTo(w, { color: "inherit" }, { color: FIRE, duration: 0.5, ease: "power2.out" })
              .to(w, { textShadow: `0 0 26px ${FIRE}, 0 0 8px ${EMBER}`, duration: 0.4 }, "<")
              .to(w, { textShadow: `0 0 14px ${EMBER}88`, duration: 1.2, ease: "sine.inOut" });
            break;
          case "scatter": {
            const dx = (Math.sin(w.offsetLeft) * 40) | 0;
            const dy = (Math.cos(w.offsetTop) * 26) | 0;
            const rot = (Math.sin(w.offsetLeft * 0.3) * 14) | 0;
            tl.fromTo(
              w,
              { x: dx, y: dy, rotate: rot, opacity: 0, filter: "blur(5px)" },
              { x: 0, y: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.1, ease: "expo.out" },
            );
            break;
          }
          case "strike":
            tl.set(w, { textDecoration: "line-through", color: "var(--color-muted)" })
              .to(w, { textDecoration: "none", color: "inherit", duration: 0.8, ease: "power2.out", delay: 0.25 });
            break;
        }
      });

      // Drive the canvas fire bloom from the first ignite word's position.
      if (onIgnite) {
        const ignite = el.querySelector<HTMLElement>('[data-act="ignite"]');
        if (ignite) {
          ScrollTrigger.create({
            trigger: ignite,
            start: "top 70%",
            onEnter: () => onIgnite(ignite.getBoundingClientRect()),
            onEnterBack: () => onIgnite(ignite.getBoundingClientRect()),
          });
        }
      }
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {words.map((tok, i) => {
        if (/^\s+$/.test(tok)) return tok;
        const kind = matchAct(tok, acts);
        return (
          <span
            key={i}
            data-w
            data-act={kind ?? undefined}
            style={{ display: "inline-block", willChange: "transform, opacity" }}
          >
            {tok}
          </span>
        );
      })}
    </Tag>
  );
}
