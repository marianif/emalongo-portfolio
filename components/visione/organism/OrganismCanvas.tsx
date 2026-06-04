"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";
import { useOrganism } from "./OrganismContext";
import { vertex, fragment } from "./shader";

/**
 * The organism's body — a single full-viewport WebGL plane running the field
 * shader. Fixed behind the reading column; eases its uniforms toward the shared
 * target every frame so beat transitions are felt, not snapped.
 *
 * Respects prefers-reduced-motion: renders ONE settled frame (no breath, no
 * fire, damped ink) and never starts the loop. Tears down fully on unmount and
 * pauses when the tab is hidden.
 */
export default function OrganismCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { targetRef, registerCanvas } = useOrganism();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const renderer = new Renderer({
      alpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 1.75),
      powerPreference: "low-power",
    });
    const gl = renderer.gl;
    gl.clearColor(0.925, 0.89, 0.824, 1);
    host.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(1, 1) },
        uBeat: { value: 0 },
        uIgnite: { value: 0 },
        uTurb: { value: 0 },
        uFlow: { value: 0 },
        uDepth: { value: 0 },
        uSeed: { value: 0 },
        uIntensity: { value: reduced ? 0.85 : 0 },
        uScroll: { value: 0 },
        uIgnitePos: { value: new Vec2(0.5, 0.5) },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const U = program.uniforms;

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h);
      (U.uResolution.value as Vec2).set(
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      );
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    registerCanvas(true);

    // Reduced motion: draw a single settled frame and stop.
    if (reduced) {
      const t = targetRef.current;
      U.uDepth.value = 0.25;
      U.uSeed.value = 0.12;
      (U.uIgnitePos.value as Vec2).set(t.ignitePos[0], t.ignitePos[1]);
      renderer.render({ scene: mesh });
      return () => {
        ro.disconnect();
        registerCanvas(false);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        host.contains(gl.canvas) && host.removeChild(gl.canvas);
      };
    }

    let raf = 0;
    let running = true;
    const start = performance.now();

    // Eased uniform state (we approach the target, never jump).
    const ease = (cur: number, to: number, k: number) => cur + (to - cur) * k;

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const t = targetRef.current;
      const time = (now - start) / 1000;
      U.uTime.value = time;

      // Approach targets at a slow, cinematic rate.
      U.uBeat.value = ease(U.uBeat.value as number, t.beat, 0.04);
      U.uIgnite.value = ease(U.uIgnite.value as number, t.ignite, 0.05);
      U.uTurb.value = ease(U.uTurb.value as number, t.turb, 0.045);
      U.uFlow.value = ease(U.uFlow.value as number, t.flow, 0.04);
      U.uDepth.value = ease(U.uDepth.value as number, t.depth, 0.04);
      U.uSeed.value = ease(U.uSeed.value as number, t.seed, 0.03);
      U.uIntensity.value = ease(U.uIntensity.value as number, 1, 0.02);
      (U.uIgnitePos.value as Vec2).set(t.ignitePos[0], t.ignitePos[1]);

      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      registerCanvas(false);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (host.contains(gl.canvas)) host.removeChild(gl.canvas);
    };
  }, [registerCanvas, targetRef]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
