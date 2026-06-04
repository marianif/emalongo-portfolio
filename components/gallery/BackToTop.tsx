"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";

// Ring geometry. The progress arc is an SVG circle whose stroke-dashoffset
// retreats from full (empty) to zero (complete) as the page is scrolled.
const SIZE = 56;
const STROKE = 1.5;
const R = (SIZE - STROKE) / 2 - 1;
const CIRC = 2 * Math.PI * R;
// Appear almost immediately: as soon as the wall has begun to move under the
// chrome, the seal is there to bring you back.
const SHOW_AT_PX = 120;

/**
 * The Progress Ring: a fixed bottom-right seal that doubles as a scroll-depth
 * indicator for the long gallery. A faint rule track holds an ember arc that
 * traces clockwise as you descend; a bone arrow sits at the centre. Clicking it
 * smooth-scrolls back to the top through Lenis (native fallback when Lenis or
 * reduced-motion is in play).
 *
 * Appears by fading + rising from below as soon as the page starts to scroll;
 * the ember is a thin arc only, within the Ember Scarcity Rule.
 */
export default function BackToTop({ label }: { label: string }) {
  const lenis = useLenis();
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    // Prefer Lenis's virtual scroll so the arc tracks the smooth position.
    // Source of truth for both showing and the arc: window.scrollY, which Lenis
    // keeps in sync with its virtual scroll. A single native listener works
    // whether or not Lenis is mounted, so the button never silently fails.
    const update = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setScrolled(y);
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Lenis emits its own tick; mirror it so the arc tracks the smooth position.
    if (lenis) lenis.on("scroll", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (lenis) lenis.off("scroll", update);
    };
  }, [lenis]);

  const toTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.1 });
      return;
    }
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const shown = scrolled > SHOW_AT_PX;
  const dashoffset = CIRC * (1 - progress);

  return (
    <button
      type="button"
      onClick={toTop}
      data-cursor="view"
      aria-label={label}
      className={`group fixed right-6 bottom-6 z-[80] grid place-items-center rounded-full bg-bone shadow-lg shadow-crypt-deep/40 outline-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:right-10 sm:bottom-10 ${
        shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        {/* Faint track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-crypt/15"
        />
        {/* Ember progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashoffset}
          className="text-accent transition-[stroke-dashoffset] duration-150 ease-linear"
        />
      </svg>
      {/* Up arrow: crypt-dark on the bone disc, lifts + warms to ember on hover */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        className="relative text-crypt-deep transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:text-accent"
      >
        <path
          d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
