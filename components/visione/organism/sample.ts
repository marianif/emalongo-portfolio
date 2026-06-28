import type { ManifestoRole } from "@/lib/content";
import type { OrganismTarget } from "./OrganismContext";
import { ROLE_STATE } from "./roleState";

const ROLE_ORDER: ManifestoRole[] = [
  "thesis",
  "urgency",
  "labyrinth",
  "breath",
  "core",
  "call",
  "promise",
];

const KEYS = ["turb", "flow", "depth", "seed"] as const;

/**
 * Sample the organism's target from horizontal scroll progress (0..1) across the
 * manifesto. Progress maps onto the beat sequence; we blend the two nearest
 * beats so the field cross-fades continuously as the reader travels the columns,
 * rather than snapping between states.
 */
export function sampleOrganism(
  progress: number,
  count: number,
): Partial<OrganismTarget> {
  const n = Math.max(1, Math.min(count, ROLE_ORDER.length));
  const pos = Math.max(0, Math.min(1, progress)) * (n - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, n - 1);
  const f = pos - lo;

  const a = ROLE_STATE[ROLE_ORDER[lo]];
  const b = ROLE_STATE[ROLE_ORDER[hi]];

  const patch: Partial<OrganismTarget> = { beat: pos };
  for (const key of KEYS) {
    const av = (a[key] as number) ?? 0;
    const bv = (b[key] as number) ?? 0;
    patch[key] = av + (bv - av) * f;
  }
  return patch;
}
