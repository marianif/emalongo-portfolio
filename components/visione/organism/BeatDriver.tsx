"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useOrganism, type OrganismTarget } from "./OrganismContext";
import type { ManifestoRole } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Each beat owns a stretch of the page. As that stretch crosses the viewport
 * centre, the beat drives the organism toward its state — turbulence for the
 * labyrinth, current for the flow, the fire bloom for blood-and-fire. Intensity
 * peaks when the beat is centred and falls off as it leaves, so the organism
 * cross-fades between states as one continuous body.
 */

// The state each role asks the organism to become at full intensity.
const ROLE_STATE: Record<ManifestoRole, Partial<OrganismTarget>> = {
  thesis: { turb: 0.05, flow: 0.1, depth: 0.0 },
  urgency: { depth: 0.85, flow: 0.05, turb: 0.0 },
  labyrinth: { turb: 1.0, flow: 0.0, depth: 0.25 },
  breath: { flow: 0.7, turb: 0.0, depth: 0.1 },
  core: { flow: 0.5, turb: 0.15, depth: 0.2 }, // ignite handled separately
  call: { turb: 0.1, flow: 0.0, depth: 0.35 },
  promise: { seed: 1.0, flow: 0.15, turb: 0.0, depth: 0.05 },
};

export default function BeatDriver({
  role,
  index,
  children,
  className,
}: {
  role: ManifestoRole;
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { setTarget } = useOrganism();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const base = ROLE_STATE[role];

      const apply = (k: number) => {
        // Scale this role's state by proximity-to-centre k (0..1) and push it
        // as the organism's target. Whichever beat is most centred wins.
        const patch: Partial<OrganismTarget> = { beat: index };
        for (const key of ["turb", "flow", "depth", "seed"] as const) {
          if (base[key] != null) patch[key] = (base[key] as number) * k;
        }
        setTarget(patch);
      };

      ScrollTrigger.create({
        trigger: el,
        start: "top 78%",
        end: "bottom 22%",
        onUpdate: (self) => {
          // Triangular weight: peak at the middle of this beat's pass.
          const k = 1 - Math.abs(self.progress - 0.5) * 2;
          apply(Math.max(0, k));
        },
        onLeave: () => apply(0),
        onLeaveBack: () => apply(0),
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-beat={role} data-index={index} className={className}>
      {children}
    </div>
  );
}
