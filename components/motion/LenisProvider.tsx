"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Smooth-scroll backbone. Wraps the app so GSAP ScrollTrigger and native
 * scroll listeners share Lenis's virtual scroll. Honors reduced-motion via
 * the `prefers-reduced-motion` query (Lenis falls back to native scroll).
 */
export default function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
