"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The nervous system. Beats report which one is active (and the ignite point
 * for the fire bloom) into a shared mutable target; the canvas reads that target
 * each frame and eases its uniforms toward it. State lives in a ref (no React
 * re-render per scroll), with a tiny `enabled` flag in state for mount gating.
 */

export type OrganismTarget = {
  beat: number; // active beat index, 0..6
  ignite: number; // 0..1 blood-and-fire bloom
  turb: number; // 0..1 labyrinth turbulence
  flow: number; // 0..1 current
  depth: number; // 0..1 submersion
  seed: number; // 0..1 final cooled ember
  ignitePos: [number, number]; // normalized 0..1 (x,y), y from top
};

const REST: OrganismTarget = {
  beat: 0,
  ignite: 0,
  turb: 0,
  flow: 0,
  depth: 0,
  seed: 0,
  ignitePos: [0.5, 0.5],
};

type Ctx = {
  targetRef: React.MutableRefObject<OrganismTarget>;
  setTarget: (patch: Partial<OrganismTarget>) => void;
  registerCanvas: (enabled: boolean) => void;
  enabled: boolean;
};

const OrganismCtx = createContext<Ctx | null>(null);

export function OrganismProvider({ children }: { children: ReactNode }) {
  const targetRef = useRef<OrganismTarget>({ ...REST });
  const [enabled, setEnabled] = useState(false);

  const setTarget = useCallback((patch: Partial<OrganismTarget>) => {
    targetRef.current = { ...targetRef.current, ...patch };
  }, []);

  const registerCanvas = useCallback((on: boolean) => setEnabled(on), []);

  const value = useMemo(
    () => ({ targetRef, setTarget, registerCanvas, enabled }),
    [setTarget, registerCanvas, enabled],
  );

  return (
    <OrganismCtx.Provider value={value}>{children}</OrganismCtx.Provider>
  );
}

export function useOrganism() {
  const ctx = useContext(OrganismCtx);
  if (!ctx) throw new Error("useOrganism must be used within OrganismProvider");
  return ctx;
}
