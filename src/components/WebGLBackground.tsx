"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "@/shaders/fluidBackground";
import {
  registerShaderFlip,
  type Theme,
  FLIP_DURATION_MS,
} from "@/providers/ThemeProvider";

// ─────────────────────────────────────────────────────────────
// Performance constants
// ─────────────────────────────────────────────────────────────
const DPR_RANGE: [number, number] = [1, 1.5];
const MOUSE_LERP = 0.04;
const PLANE_SEGMENTS = 160;

// Ripple ring buffer — must match `uniform vec4 uRipples[6]` in shader.
const RIPPLE_COUNT = 6;
const RIPPLE_LIFETIME = 3.6; // seconds, matches shader guard

// Theme flip: per-frame exponential lerp rate for uFlip.
// ~0.035 at 60fps crosses 0↔1 in roughly the same ~1.5s window as
// the CSS transition in body.theme-flipping, so DOM + shader land together.
const FLIP_LERP = 0.035;

/** Parse resolved CSS length (--flip-ox/oy) to px for current viewport. */
function parseCssLengthToPx(
  s: string,
  viewportW: number,
  viewportH: number,
  remPx: number
): number {
  const t = s.trim();
  const px = t.match(/^([-\d.]+)px$/);
  if (px) return parseFloat(px[1]);
  const vw = t.match(/^([-\d.]+)vw$/);
  if (vw) return (parseFloat(vw[1]) / 100) * viewportW;
  const vh = t.match(/^([-\d.]+)vh$/);
  if (vh) return (parseFloat(vh[1]) / 100) * viewportH;
  const rem = t.match(/^([-\d.]+)rem$/);
  if (rem) return parseFloat(rem[1]) * remPx;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

/** Read :root --flip-ox/--flip-oy into shader UV (bottom-up Y, matches uMouse). */
function stampTransitionOriginFromCss(target: THREE.Vector2) {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const oxStr = cs.getPropertyValue("--flip-ox").trim();
  const oyStr = cs.getPropertyValue("--flip-oy").trim();
  const w = Math.max(window.innerWidth, 1);
  const h = Math.max(window.innerHeight, 1);
  const remPx = parseFloat(cs.fontSize) || 16;
  const ox = parseCssLengthToPx(oxStr || "50vw", w, h, remPx);
  const oy = parseCssLengthToPx(oyStr || "5.5rem", w, h, remPx);
  target.set(ox / w, 1.0 - oy / h);
}

/** Read the theme attribute set by the pre-hydration script (layout.tsx). */
function readInitialFlip(): number {
  if (typeof document === "undefined") return 0;
  return document.documentElement.getAttribute("data-theme") === "day"
    ? 1
    : 0;
}

// ─────────────────────────────────────────────────────────────
// FluidPlane — 128×128 segmented mesh with vertex displacement
//
// All state in useRef. Zero re-renders during animation.
// Uniforms mutated directly in useFrame.
// Plane auto-scales to viewport via useThree().viewport.
// ─────────────────────────────────────────────────────────────
/** Time scale for shader uTime: full motion vs reduced-motion (see volari-engineering-constraints). */
const FULL_MOTION_TIME_SCALE = 1;
const REDUCED_MOTION_TIME_SCALE = 0.1;

function FluidPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Mutable animation state
  const mouseTarget = useRef({ x: 0.5, y: 0.5 });
  const mouseCurrent = useRef({ x: 0.5, y: 0.5 });
  const scrollProgress = useRef(0);
  const motionTimeScale = useRef(FULL_MOTION_TIME_SCALE);
  // Shader time, mirrored into ref so pointerdown can stamp ripple startTime
  // without racing the frame loop.
  const shaderTime = useRef(0);
  // Next slot in the ripple ring buffer — overwrites oldest click.
  const rippleSlot = useRef(0);
  // Theme flip target (0 = void, 1 = day). uFlip lerps toward this
  // each frame. Initialized from the DOM so SSR + pre-hydration script
  // agree with the first shader frame.
  const flipTarget = useRef<number>(readInitialFlip());
  /** Bell-shaped warp over FLIP_DURATION_MS (View Transitions snap uFlip; this stays time-based). */
  const transitionWarp = useRef<{ startMs: number | null; dir: number }>({
    startMs: null,
    dir: 1,
  });
  const prefersReducedMotion = useRef(false);

  // Shader uniforms — created once, mutated per-frame
  const uniforms = useMemo(() => {
    const ripples = Array.from(
      { length: RIPPLE_COUNT },
      // z = -1000 keeps age huge so inactive slots stay dead even if w check fails
      () => new THREE.Vector4(0, 0, -1000, 0)
    );
    const initialFlip = readInitialFlip();
    return {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScrollProgress: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(
          typeof window !== "undefined" ? window.innerWidth : 1920,
          typeof window !== "undefined" ? window.innerHeight : 1080
        ),
      },
      uRipples: { value: ripples },
      // uFlip: 0.0 = void palette, 1.0 = day palette. Shader mixes
      // between two constant palettes using this scalar.
      uFlip: { value: initialFlip },
      uTransitionWarp: { value: 0 },
      uTransitionDir: { value: 1 },
      uTransitionOrigin: { value: new THREE.Vector2(0.5, 0.88) },
    };
  }, []);

  // ── DOM event handlers (passive, ref-only) ──
  /** Pointer covers mouse, pen, and touch — mousemove alone misses touch drag. */
  const onPointerMove = useCallback((e: PointerEvent) => {
    mouseTarget.current.x = e.clientX / window.innerWidth;
    mouseTarget.current.y = 1.0 - e.clientY / window.innerHeight;
  }, []);

  const onScroll = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.current = max > 0 ? window.scrollY / max : 0;
  }, []);

  const onResize = useCallback(() => {
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }, [uniforms]);

  // ── Left-click → spawn ripple ──
  // Writes into next ring-buffer slot. Y is flipped to match uMouse
  // convention (1.0 - clientY / h → bottom-up).
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return; // left button only
      const slot = rippleSlot.current;
      const ripple = uniforms.uRipples.value[slot] as THREE.Vector4;
      ripple.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight,
        shaderTime.current,
        1.0
      );
      rippleSlot.current = (slot + 1) % RIPPLE_COUNT;
    },
    [uniforms]
  );

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    onResize();
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onPointerMove, onScroll, onResize, onPointerDown]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduced = mq.matches;
      prefersReducedMotion.current = reduced;
      motionTimeScale.current = reduced
        ? REDUCED_MOTION_TIME_SCALE
        : FULL_MOTION_TIME_SCALE;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── Shader theme bridge ──
  // ThemeProvider invokes this callback with the new theme when the
  // crest is pressed. Update flipTarget; the per-frame loop lerps
  // uFlip toward it, so the shader crossfade is frame-locked to the
  // CSS transition window.
  //
  // `instant` is set by the View Transitions path: the browser snapshots
  // <html> at the end of the update callback, and that snapshot freezes
  // whatever uFlip is at that instant. If we only update flipTarget, the
  // snapshot captures uFlip ≈ old-value (lerp hasn't run yet) and the
  // horizon-rise reveal exposes a frozen pre-flip shader. Snapping uFlip
  // to the target directly makes the snapshot honest.
  useEffect(() => {
    const unregister = registerShaderFlip(
      (target: Theme, instant?: boolean) => {
        const targetValue = target === "day" ? 1 : 0;
        flipTarget.current = targetValue;
        transitionWarp.current = {
          startMs: performance.now(),
          dir: target === "day" ? 1 : -1,
        };
        if (materialRef.current) {
          stampTransitionOriginFromCss(
            materialRef.current.uniforms.uTransitionOrigin.value as THREE.Vector2
          );
        }
        if (instant && materialRef.current) {
          materialRef.current.uniforms.uFlip.value = targetValue;
        }
      }
    );
    return unregister;
  }, []);

  // ── Per-frame uniform updates ──
  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;

    const t = clock.getElapsedTime() * motionTimeScale.current;
    shaderTime.current = t;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uScrollProgress.value = scrollProgress.current;

    mouseCurrent.current.x +=
      (mouseTarget.current.x - mouseCurrent.current.x) * MOUSE_LERP;
    mouseCurrent.current.y +=
      (mouseTarget.current.y - mouseCurrent.current.y) * MOUSE_LERP;

    mat.uniforms.uMouse.value.set(
      mouseCurrent.current.x,
      mouseCurrent.current.y
    );

    // Theme crossfade — exponential lerp toward flipTarget.
    // Snap once |delta| drops below 1e-3 so uFlip actually reaches
    // 0 or 1 (prevents asymptotic ~0.001 residue in the shader mix).
    const flipCurrent = mat.uniforms.uFlip.value as number;
    const flipNext = flipCurrent + (flipTarget.current - flipCurrent) * FLIP_LERP;
    mat.uniforms.uFlip.value =
      Math.abs(flipTarget.current - flipNext) < 1e-3
        ? flipTarget.current
        : flipNext;

    let warp = 0;
    const tw = transitionWarp.current;
    if (tw.startMs !== null && !prefersReducedMotion.current) {
      const elapsed = performance.now() - tw.startMs;
      if (elapsed >= FLIP_DURATION_MS) {
        tw.startMs = null;
      } else {
        const u = elapsed / FLIP_DURATION_MS;
        warp = Math.sin(u * Math.PI);
      }
    }
    mat.uniforms.uTransitionWarp.value = warp;
    mat.uniforms.uTransitionDir.value = tw.startMs !== null ? tw.dir : 1;

    // Retire expired ripples so the shader loop skips them cheaply.
    const ripples = mat.uniforms.uRipples.value as THREE.Vector4[];
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      if (r.w > 0.5 && t - r.z > RIPPLE_LIFETIME) r.w = 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry
        args={[viewport.width, viewport.height, PLANE_SEGMENTS, PLANE_SEGMENTS]}
      />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// WebGLBackground — Public component
//
// Fixed behind all content at -z-1 (see volari-engineering-constraints.mdc).
// Canvas GL config stripped to minimum for fullscreen shader:
//   antialias: false, alpha: false, stencil: false, depth: false
// ─────────────────────────────────────────────────────────────
export default function WebGLBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-1"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 0, 1],
          near: 0.1,
          far: 10,
          fov: 75,
        }}
        dpr={DPR_RANGE}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        frameloop="always"
        flat
        // Canvas paints opaque every frame (alpha:false), so this bg is
        // a pre-init fallback. Use the themed var so cold-start matches
        // whichever theme the pre-hydration script chose.
        style={{ background: "var(--v-black)" }}
      >
        <FluidPlane />
      </Canvas>
    </div>
  );
}
