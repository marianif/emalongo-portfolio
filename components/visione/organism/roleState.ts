import type { ManifestoRole } from "@/lib/content";
import type { OrganismTarget } from "./OrganismContext";

/**
 * The organism state each beat asks for at full intensity. Whichever panel is
 * most centred during the horizontal traverse wins; the field cross-fades
 * between these as one continuous body.
 */
export const ROLE_STATE: Record<ManifestoRole, Partial<OrganismTarget>> = {
  thesis: { turb: 0.05, flow: 0.1, depth: 0.0 },
  urgency: { depth: 0.85, flow: 0.05, turb: 0.0 },
  labyrinth: { turb: 1.0, flow: 0.0, depth: 0.25 },
  breath: { flow: 0.7, turb: 0.0, depth: 0.1 },
  core: { flow: 0.5, turb: 0.15, depth: 0.2 },
  call: { turb: 0.1, flow: 0.0, depth: 0.35 },
  promise: { seed: 1.0, flow: 0.15, turb: 0.0, depth: 0.05 },
};
