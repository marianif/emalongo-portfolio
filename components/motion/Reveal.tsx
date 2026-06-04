"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-reveal: a slow, deliberate rise + fade as the element enters view.
 * Honors prefers-reduced-motion by rendering content fully present (no stuck
 * opacity:0). Easing matches the design token --ease-exit (expo-out feel).
 */
export default function Reveal({
  children,
  className,
  as: Tag = "div",
  y = 28,
  delay = 0,
  duration = 0.72,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  y?: number;
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          delay,
          duration,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
