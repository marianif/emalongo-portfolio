"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The "lit page" — a fixed, paper-toned vignette that sits above the catalogue
 * ground but below the text. The reading column stays bright while the edges
 * fall toward shadow, so the page feels like a sheet under a lamp in a closed
 * room (Atmosphere-Not-Shadow). It does NOT paint a background colour; it only
 * pools warm dark at the margins, leaving the bone paper intact.
 *
 * On scroll the pool breathes a touch deeper toward the end of the read, the
 * dark room closing in as the manifesto descends. Fully inert under
 * prefers-reduced-motion: a single static vignette, no scroll work.
 */
export default function StatementAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Deepen the edge pooling as the reader descends the article.
      gsap.fromTo(
        el,
        { opacity: 0.55 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        // Warm soot pooled at the corners and lower edge; centre stays clear so
        // the reading column keeps the full bone paper behind it.
        background:
          "radial-gradient(120% 85% at 50% 28%, transparent 38%, rgba(20,17,13,0.10) 72%, rgba(13,11,8,0.24) 100%)",
        opacity: 0.55,
      }}
    />
  );
}
