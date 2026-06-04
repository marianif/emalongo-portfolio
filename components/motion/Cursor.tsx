"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: a single circle using mix-blend-mode:difference, so it inverts
 * whatever it sits over — bone over the crypt, dark over the paper. It trails
 * the pointer with a smooth lerp and swells over interactive elements (anything
 * with [data-cursor], links, buttons). Disabled for touch and reduced-motion;
 * the native cursor is restored there. Runs entirely on rAF + transforms, never
 * React state, so it stays off the render path.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || reduce) return;

    document.documentElement.classList.add("has-custom-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let x = mouseX;
    let y = mouseY;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
        // Jump to pointer on first move so it doesn't slide in from center.
        x = mouseX;
        y = mouseY;
      }
      const target = e.target as HTMLElement | null;
      // Large swell over images and explicit "view" affordances; a gentler
      // swell over readable text; default otherwise.
      if (target?.closest("a, button, [data-cursor], img, picture, figure")) {
        targetScale = 3;
      } else if (
        target?.closest("h1, h2, h3, p, blockquote, li, cite, span[data-word]")
      ) {
        targetScale = 1.9;
      } else {
        targetScale = 1;
      }
    };

    const onLeave = () => {
      el.style.opacity = "0";
      visible = false;
    };

    const onDown = () => {
      targetScale = Math.max(0.7, targetScale * 0.7);
    };

    const tick = () => {
      // Lerp position (smooth trail) and scale.
      x += (mouseX - x) * 0.18;
      y += (mouseY - y) * 0.18;
      scale += (targetScale - scale) * 0.15;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] h-6 w-6 rounded-full bg-bone opacity-0 mix-blend-difference will-change-transform"
      style={{ transition: "opacity 300ms ease" }}
    />
  );
}
