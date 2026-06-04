"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A manifesto fragment threaded between works, with the same cinematic register
 * as the artworks: the line unveils word by word via a clip-mask wipe, rising
 * as it resolves, the painter's voice surfacing from the dark. Reduced motion:
 * fully present, no animation.
 */
export default function VoiceFragment({ text }: { text: string }) {
  const root = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const words = el.querySelectorAll<HTMLElement>("[data-word]");
      gsap.fromTo(
        words,
        { clipPath: "inset(0% 0% 110% 0%)", y: 18, opacity: 0.15 },
        {
          clipPath: "inset(0% 0% -10% 0%)",
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: root },
  );

  const words = text.split(" ");

  return (
    <p
      ref={root}
      className="mx-auto max-w-[24ch] py-[clamp(4rem,12vh,9rem)] text-center font-serif text-[clamp(1.6rem,4.2vw,3rem)] leading-[1.18] text-bone/60 italic"
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="mr-[0.25em] inline-block overflow-hidden align-top last:mr-0"
        >
          <span data-word className="inline-block will-change-transform">
            {word}
          </span>
        </span>
      ))}
    </p>
  );
}
