"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import { registerShadowConsume } from "@/providers/ThemeProvider";
import { fragmentShader, vertexShader } from "@/shaders/shadowConsume";

// ─────────────────────────────────────────────────────────────
// ShadowConsumeOverlay
//
// Fullscreen WebGL overlay that runs the day → void transition
// as a living shadow devouring the viewport. A transparent
// R3F <Canvas> is mounted persistently at z-[9998]; when
// ThemeProvider calls the registered trigger, we animate a
// handful of shader uniforms from the first frame and let the
// GLSL in `shaders/shadowConsume.ts` do the heavy lifting.
//
// Lifecycle (timing in ms from trigger fire):
//   0           — uActive ramps in, uTime begins, origin stamped
//   0…1180      — uProgress eases 0 → 1 (ease-out-cubic);
//                 consume front expands to cover the viewport
//   1180…1420   — uPeak eases 0 → 1; shadow crossfades to solid
//                 black so any interior detail is gone
//   ~1420       — peakPromise resolves → ThemeProvider swaps
//                 data-theme + shader palette under full cover
//   1420…1720   — uPeak holds at 1 (pure black) so the viewer
//                 sees no hint of the palette swap
//   1720…1880   — uActive fades back to 0 (reveals new void)
//   1880        — finishedPromise resolves → ThemeProvider
//                 clears the flip lock and origin CSS vars
//
// Perf: frameloop="always" so the shader ticks smoothly
// regardless of React state. Idle cost is one transparent
// fullscreen quad per frame — same class of load as
// WebGLBackground, which also runs always-on.
// ─────────────────────────────────────────────────────────────

const EFFECT_DURATION_MS = 1880;
/** Fraction of duration spent expanding (before peak ramp begins). */
const PROGRESS_END = 0.63; // 0 → 1 eased over first ~63% of the timeline (~1180ms)
/** Fraction of duration where peak begins ramping to full black. */
const PEAK_START = 0.63;
/** Fraction of duration where peak is held at 1 until uActive fades out. */
const PEAK_FULL = 0.76;
/** Fraction of duration where uActive begins fading back out. */
const ACTIVE_FADE_OUT_START = 0.92;
/** ms of opening fade-in so the first frame isn't a hard cut. */
const FADE_IN_MS = 80;

type ActiveState = {
  startMs: number;
  originX: number;
  originY: number;
  resolvePeak: () => void;
  resolveFinished: () => void;
  peakResolved: boolean;
  finishedResolved: boolean;
};

type ShadowHandle = {
  peak: Promise<void>;
  finished: Promise<void>;
};

function easeOutCubic(x: number): number {
  const t = 1 - x;
  return 1 - t * t * t;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

interface ShadowPlaneProps {
  activeRef: MutableRefObject<ActiveState | null>;
}

/**
 * The single mesh/material that renders the shader. Lives inside
 * the R3F Canvas and drives uniforms via useFrame.
 *
 * activeRef is a ref (not state) so the parent can stamp a new
 * trigger without forcing the Canvas subtree to re-render —
 * uniform writes happen entirely inside the frame loop.
 */
function ShadowPlane({ activeRef }: ShadowPlaneProps) {
  // Single useThree call — pulling multiple slices via separate
  // useThree(...) invocations adds hooks per call and triggers
  // React's "hooks order changed" check on HMR.
  const { size, setSize } = useThree();

  // Direct fix for the initial-sizing race. R3F's internal
  // ResizeObserver sometimes returns 0×0 (or stale 300×150) on the
  // first measurement when multiple Canvases mount in parallel —
  // see the comment on the parent useLayoutEffect. Calling setSize
  // from inside the R3F context here is authoritative: it updates
  // gl.setSize, the camera projection, and the size store atom in
  // one shot, regardless of what the observer reports. We only run
  // this once on mount because subsequent resizes are correctly
  // handled by the observer once it has a baseline.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > 0 && h > 0 && (size.width !== w || size.height !== h)) {
      setSize(w, h);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Uniforms are a single stable object — useFrame mutates
  // `.value` fields each frame. Replacing the object would
  // invalidate the shader material's uniform bindings.
  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uOrigin: { value: new THREE.Vector2(size.width / 2, size.height * 0.12) },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPeak: { value: 0 },
      uActive: { value: 0 },
      uAspectBias: { value: 0.25 },
    }),
    // We intentionally compute initial size from the first useThree
    // snapshot, then keep the Vector2 in place and .set() below.
    // Disable deps lint since swapping the object is exactly what
    // we must avoid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Keep uResolution in sync with the actual canvas size — the
  // shader's radial math depends on it for aspect correction.
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms]);

  useFrame(({ clock }) => {
    const a = activeRef.current;
    if (!a) {
      // Idle: clamp active low so the quad is fully transparent
      // even if the browser somehow schedules a frame.
      uniforms.uActive.value = 0;
      uniforms.uProgress.value = 0;
      uniforms.uPeak.value = 0;
      return;
    }

    const now = performance.now();
    const t = (now - a.startMs) / EFFECT_DURATION_MS; // 0..1+

    // Progress: eased expansion of the consume front
    const progressNorm = clamp01(t / PROGRESS_END);
    uniforms.uProgress.value = easeOutCubic(progressNorm);

    // Peak: ramps after progress completes, lands on full black
    // before ACTIVE_FADE_OUT_START so there's no visible swap flash
    const peakNorm = clamp01((t - PEAK_START) / (PEAK_FULL - PEAK_START));
    uniforms.uPeak.value = easeInOutCubic(peakNorm);

    // Active: fast fade in at the start, fade out at the tail
    const fadeIn = clamp01((now - a.startMs) / FADE_IN_MS);
    const fadeOut = t > ACTIVE_FADE_OUT_START
      ? clamp01((1 - t) / (1 - ACTIVE_FADE_OUT_START))
      : 1;
    uniforms.uActive.value = Math.min(fadeIn, fadeOut);

    // Animation time — driven off the Three clock so sub-frame
    // scheduling jitter doesn't show up as stutter in the ink flow.
    uniforms.uTime.value = clock.getElapsedTime();

    // Pin the origin once per trigger — writing every frame is
    // fine but unnecessary.
    if (!a.peakResolved) {
      uniforms.uOrigin.value.set(a.originX, a.originY);
    }

    // Resolve peak once the shadow is solid black. ThemeProvider
    // awaits this to swap data-theme under cover.
    if (uniforms.uPeak.value >= 0.999 && !a.peakResolved) {
      a.peakResolved = true;
      a.resolvePeak();
    }

    // Resolve finished after the full envelope completes.
    if (t >= 1 && !a.finishedResolved) {
      a.finishedResolved = true;
      a.resolveFinished();
    }
  });

  return (
    // Plane [2, 2] in clip space — the vertex shader writes
    // gl_Position directly from position.xy so camera state is
    // irrelevant. See comments in `shaders/shadowConsume.ts`.
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Mount once near the top of the tree (see layout.tsx). The
 * component registers itself with ThemeProvider via the module-
 * level shadow-consume bridge; ThemeProvider triggers it on
 * day → void flips.
 */
export default function ShadowConsumeOverlay() {
  const activeRef = useRef<ActiveState | null>(null);

  // R3F sizes its <canvas> via an internal ResizeObserver on the
  // wrapper div. When two Canvas instances mount in the same React
  // commit (here: WebGLBackground first, then us), the second
  // observer can fire BEFORE the wrapper has a measured layout box,
  // leaving the canvas stuck at the HTML default 300×150 instead of
  // the viewport. The shader still runs, but only paints a tiny
  // patch in the top-left corner — which reads as "no shader at all".
  //
  // R3F also listens to window resize as a fallback, so a single
  // dispatched event nudges it to re-measure both Canvases and snap
  // their buffers to the actual viewport size.
  //
  // We schedule TWO dispatches:
  //   1. Synchronously in useLayoutEffect — runs after DOM mutation
  //      but before first paint, so the canvas is correct on frame 1
  //      in normal (visible) tabs.
  //   2. setTimeout(0) — survives in hidden tabs where rAF is paused
  //      entirely, and also covers any debounce R3F applies on top
  //      of its resize handler. Either dispatch is harmless on its
  //      own — R3F's measurement is idempotent.
  useLayoutEffect(() => {
    window.dispatchEvent(new Event("resize"));
    const tid = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 0);
    return () => clearTimeout(tid);
  }, []);

  useEffect(() => {
    // Register the trigger. The callback creates a fresh active
    // state and returns two promises: `peak` for the theme swap,
    // `finished` for final cleanup. Both are consumed by
    // ThemeProvider.toggleTheme.
    return registerShadowConsume((originX: number, originY: number): ShadowHandle => {
      let resolvePeak!: () => void;
      let resolveFinished!: () => void;
      const peak = new Promise<void>((r) => {
        resolvePeak = r;
      });
      const finished = new Promise<void>((r) => {
        resolveFinished = r;
      });

      // Reduced-motion short-circuit — resolve both promises on the
      // next microtask so ThemeProvider's peak.then() / finished.then()
      // fire in order (promise ordering is preserved across
      // Promise.resolve chains). No shader envelope runs, no uniform
      // lerps — accessibility wins, and the theme swap still lands.
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        Promise.resolve().then(() => {
          resolvePeak();
          resolveFinished();
        });
        return { peak, finished };
      }

      activeRef.current = {
        startMs: performance.now(),
        originX,
        originY,
        resolvePeak,
        resolveFinished,
        peakResolved: false,
        finishedResolved: false,
      };

      // Clear the ref after the envelope completes so the shader
      // returns to pure idle. Any later trigger overwrites ref
      // fresh — no cross-contamination between consecutive flips.
      finished.then(() => {
        if (activeRef.current && activeRef.current.finishedResolved) {
          activeRef.current = null;
        }
      });

      return { peak, finished };
    });
  }, []);

  return (
    <div
      // z-[9998]: above page content (z-10), above Navbar (z-50),
      // below body::after grain (z-9999) and CustomCursor debug
      // layer (z-10000). The grain is intentionally on top — it
      // reads as a subtle texture over even pitch-black moments,
      // which is the desired premium feel.
      //
      // `pointer-events-none` on the wrapper alone is NOT enough —
      // pointer-events isn't inherited, so R3F's inner <canvas>
      // (default pointer-events: auto) would still swallow clicks
      // at z-9998, sitting on top of the Navbar at z-50. The
      // arbitrary `[&_canvas]:pointer-events-none` selector pushes
      // the rule onto every descendant <canvas> so the shadow
      // overlay is transparent to the pointer in every state,
      // including idle (when it's fully see-through anyway — the
      // user never wants to "click the darkness").
      className="pointer-events-none fixed inset-0 z-[9998] [&_canvas]:pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        // Belt-and-braces: the R3F wrapper div also opts out so
        // there's nothing along the hit-test chain catching events.
        style={{ pointerEvents: "none" }}
        gl={{
          // Alpha must be true so non-shadow regions read through to
          // the page beneath.
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
          // Premultiplied alpha keeps the black fragment tint clean
          // when the shader's alpha channel is < 1 during the
          // dissolve band — without this, edges can gain a grey
          // halo from unpremultiplied RGBA compositing.
          premultipliedAlpha: true,
        }}
        dpr={[1, 2]}
        // Fullscreen clip-space quad — camera is unused but R3F
        // needs one mounted; the default is fine.
        frameloop="always"
      >
        <ShadowPlane activeRef={activeRef} />
      </Canvas>
    </div>
  );
}
