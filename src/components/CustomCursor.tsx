"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

// ─────────────────────────────────────────────────────────────
// CustomCursor — "Comet Veil"
//
// Architecture:
//   L1  Veil × 3      — translucent silver radial wisps that trail behind
//                       the dot and stretch along the velocity vector.
//                       mix-blend-mode: screen → they glow on dark ground.
//                       Staggered quickTo durations give the layered comet
//                       tail (near / mid / far) without a rAF-driven trail
//                       queue.
//   L2  Hover ring    — hairline chalk ring, hidden at rest; fades in on
//                       interactive hover as the veils coalesce inward.
//   L3  Gold dot      — UNCHANGED. The "light following cursor" the user
//                       explicitly asked to preserve.
//   L4  Hover label   — "Explore" / "Navigate" via data-cursor-label.
//
// Velocity: tracked per mouse event (dx, dy between frames) and smoothed
// exponentially. Feeds rAF loop that writes scaleX / scaleY / rotation
// per veil — faster cursor → longer, thinner tail aligned with motion.
//
// Coalescence: on interactive hover, `hoverLocked` flag overrides the
// velocity stretch with a tight circular ring (scale 1, rotation 0).
// Part motion, part séance.
// ─────────────────────────────────────────────────────────────

export default function CustomCursor() {
  const veil1Ref = useRef<HTMLDivElement>(null); // near — brightest, shortest trail
  const veil2Ref = useRef<HTMLDivElement>(null); // mid
  const veil3Ref = useRef<HTMLDivElement>(null); // far — faintest, longest trail
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const hasPointer = useRef(false);

  const setup = useCallback(() => {
    const veil1 = veil1Ref.current;
    const veil2 = veil2Ref.current;
    const veil3 = veil3Ref.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!veil1 || !veil2 || !veil3 || !ring || !dot || !label) return;

    // ── Position tweens: staggered durations produce the comet tail ──
    // Near veil is tightest to cursor, far veil lags most.
    const mk = (el: HTMLElement, d: number) => ({
      x: gsap.quickTo(el, "x", { duration: d, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: d, ease: "power3.out" }),
    });

    const dotT = mk(dot, 0.12);
    const v1T = mk(veil1, 0.2);
    const v2T = mk(veil2, 0.32);
    const v3T = mk(veil3, 0.48);
    const ringT = mk(ring, 0.22);
    const labelT = mk(label, 0.6);

    // ── Velocity state (for comet stretch) ──
    let lastX = 0;
    let lastY = 0;
    let lastT = performance.now();
    let primed = false; // skip velocity calc on the very first move
    let vx = 0; // smoothed velocity x  (px/ms)
    let vy = 0; // smoothed velocity y
    let hoverLocked = false;

    // Per-veil visual state — scale + rotation lerp toward target every rAF
    type VState = { sx: number; sy: number; rot: number; tsx: number; tsy: number; trot: number };
    const makeVS = (): VState => ({ sx: 1, sy: 1, rot: 0, tsx: 1, tsy: 1, trot: 0 });
    const vs1 = makeVS();
    const vs2 = makeVS();
    const vs3 = makeVS();

    // ── Mouse move: update positions + velocity ──
    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();

      if (primed) {
        const dt = Math.max(1, now - lastT);
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        // Exponential smoothing — responsive but not jittery
        const alpha = 0.25;
        vx = vx * (1 - alpha) + (dx / dt) * alpha;
        vy = vy * (1 - alpha) + (dy / dt) * alpha;
      } else {
        primed = true;
      }

      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;

      dotT.x(e.clientX);
      dotT.y(e.clientY);
      v1T.x(e.clientX);
      v1T.y(e.clientY);
      v2T.x(e.clientX);
      v2T.y(e.clientY);
      v3T.x(e.clientX);
      v3T.y(e.clientY);
      ringT.x(e.clientX);
      ringT.y(e.clientY);
      labelT.x(e.clientX);
      labelT.y(e.clientY);
    };

    // ── rAF loop: velocity → stretch + rotation ──
    // Speed in px/ms; typical fast cursor ~2.5. Clamp to 4.
    let rafId = 0;
    const tick = () => {
      // Decay velocity so veils retract when cursor idles
      vx *= 0.9;
      vy *= 0.9;
      const speed = Math.hypot(vx, vy); // px/ms
      const ang = (Math.atan2(vy, vx) * 180) / Math.PI;

      // Normalised motion energy [0..1]
      const s = Math.min(1, speed / 2.5);

      if (hoverLocked) {
        // Coalesce — tight ring regardless of motion
        vs1.tsx = 0.55; vs1.tsy = 0.55; vs1.trot = 0;
        vs2.tsx = 0.7;  vs2.tsy = 0.7;  vs2.trot = 0;
        vs3.tsx = 0.85; vs3.tsy = 0.85; vs3.trot = 0;
      } else {
        // Stretch along velocity: sx grows, sy pinches; rotation tracks angle
        vs1.tsx = 1 + s * 1.2;  vs1.tsy = 1 - s * 0.2;  vs1.trot = ang;
        vs2.tsx = 1 + s * 1.8;  vs2.tsy = 1 - s * 0.3;  vs2.trot = ang;
        vs3.tsx = 1 + s * 2.6;  vs3.tsy = 1 - s * 0.4;  vs3.trot = ang;
      }

      // Lerp toward target — smooth transitions into/out of hover coalesce
      const L = 0.16;
      for (const v of [vs1, vs2, vs3]) {
        v.sx += (v.tsx - v.sx) * L;
        v.sy += (v.tsy - v.sy) * L;
        // Rotation needs shortest-angle lerp so it doesn't spin the long way
        let d = v.trot - v.rot;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        v.rot += d * L;
      }

      gsap.set(veil1, { scaleX: vs1.sx, scaleY: vs1.sy, rotation: vs1.rot });
      gsap.set(veil2, { scaleX: vs2.sx, scaleY: vs2.sy, rotation: vs2.rot });
      gsap.set(veil3, { scaleX: vs3.sx, scaleY: vs3.sy, rotation: vs3.rot });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // ── Hover states ──
    const onEnterInteractive = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const cursorLabel = target.getAttribute("data-cursor-label");
      hoverLocked = true;

      // Veils dim + tighten (rAF handles scale). Nudge opacity directly.
      gsap.to(veil1, { opacity: 0.5, duration: 0.35, ease: "power3.out" });
      gsap.to(veil2, { opacity: 0.35, duration: 0.35, ease: "power3.out" });
      gsap.to(veil3, { opacity: 0.2, duration: 0.35, ease: "power3.out" });

      // Hairline chalk ring emerges
      gsap.to(ring, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" });

      // Dot shrinks to a pinpoint — echoing the original hover feel
      gsap.to(dot, { scale: 0.2, opacity: 1, duration: 0.4, ease: "power3.out" });

      if (cursorLabel) {
        label.textContent = cursorLabel;
        gsap.to(label, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" });
      }
    };

    const onLeaveInteractive = () => {
      hoverLocked = false;

      gsap.to(veil1, { opacity: 0.75, duration: 0.45, ease: "power3.out" });
      gsap.to(veil2, { opacity: 0.5, duration: 0.45, ease: "power3.out" });
      gsap.to(veil3, { opacity: 0.3, duration: 0.45, ease: "power3.out" });

      gsap.to(ring, { opacity: 0, scale: 0.7, duration: 0.35, ease: "power2.in" });
      gsap.to(dot, { scale: 0.5, opacity: 0.72, duration: 0.4, ease: "power3.out" });
      gsap.to(label, { opacity: 0, scale: 0.8, duration: 0.25, ease: "power2.in" });
    };

    // ── Magnetic pull on [data-cursor-magnetic] elements ──
    const onMagneticMove = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      gsap.to(target, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: "power2.out" });
    };

    const onMagneticLeave = (e: Event) => {
      gsap.to(e.currentTarget as HTMLElement, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });
    };

    const interactiveSelector =
      "a, button, [data-cursor-hover], [data-cursor-label]";
    const magneticSelector = "[data-cursor-magnetic]";

    const attachListeners = () => {
      document.querySelectorAll(interactiveSelector).forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
      document.querySelectorAll(magneticSelector).forEach((el) => {
        el.addEventListener("mousemove", onMagneticMove as EventListener);
        el.addEventListener("mouseleave", onMagneticLeave);
      });
    };

    const detachListeners = () => {
      document.querySelectorAll(interactiveSelector).forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
      document.querySelectorAll(magneticSelector).forEach((el) => {
        el.removeEventListener("mousemove", onMagneticMove as EventListener);
        el.removeEventListener("mouseleave", onMagneticLeave);
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    attachListeners();

    const observer = new MutationObserver(() => {
      detachListeners();
      attachListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      detachListeners();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    hasPointer.current = true;

    // Initial state — hidden until first mousemove
    const els = [veil1Ref, veil2Ref, veil3Ref, dotRef].map((r) => r.current);
    els.forEach((el) => el && gsap.set(el, { opacity: 0 }));
    if (dotRef.current) gsap.set(dotRef.current, { scale: 0.5 });
    if (ringRef.current) gsap.set(ringRef.current, { opacity: 0, scale: 0.7 });

    const showCursor = () => {
      gsap.to(veil1Ref.current, { opacity: 0.75, duration: 0.5 });
      gsap.to(veil2Ref.current, { opacity: 0.5, duration: 0.6 });
      gsap.to(veil3Ref.current, { opacity: 0.3, duration: 0.8 });
      gsap.to(dotRef.current, { opacity: 0.72, duration: 0.4 });
      window.removeEventListener("mousemove", showCursor);
    };
    window.addEventListener("mousemove", showCursor, { once: true });

    const cleanup = setup();
    return () => {
      window.removeEventListener("mousemove", showCursor);
      cleanup?.();
    };
  }, [setup]);

  // ── Veil background: tight core fading to transparent.
  //    At idle the veils stack concentrically (radial symmetry); under
  //    motion the rAF scaleX stretches the same gradient into an ellipse,
  //    producing the tail without a per-frame canvas draw.
  //
  //    Colors come from --cursor-veil-* CSS vars so the void→day swap is
  //    automatic (silver on dark, warm umber on cream). Per-layer alpha
  //    is applied via color-mix with transparent so one set of vars can
  //    serve all three veils at different brightnesses.
  const veilBg = (coreAlpha: number) =>
    `radial-gradient(closest-side, ` +
    `color-mix(in srgb, var(--cursor-veil-core) ${coreAlpha * 100}%, transparent) 0%, ` +
    `color-mix(in srgb, var(--cursor-veil-mid) ${coreAlpha * 50}%, transparent) 38%, ` +
    `var(--cursor-veil-edge) 72%)`;

  return (
    <>
      {/* ── Veil 3 (far) — widest, faintest, longest trail ── */}
      {/* `cursor-veil` class supplies `mix-blend-mode: var(--cursor-veil-blend)`
          from globals.css — screen on void, multiply on day. Lives in CSS
          because React CSSProperties types reject var() for mix-blend-mode. */}
      <div
        ref={veil3Ref}
        className="cursor-veil pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block"
        style={{
          width: 80,
          height: 80,
          marginLeft: -40,
          marginTop: -40,
          borderRadius: "50%",
          background: veilBg(0.22),
          filter: "blur(6px)",
          willChange: "transform, opacity",
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* ── Veil 2 (mid) ── */}
      <div
        ref={veil2Ref}
        className="cursor-veil pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
        style={{
          width: 56,
          height: 56,
          marginLeft: -28,
          marginTop: -28,
          borderRadius: "50%",
          background: veilBg(0.32),
          filter: "blur(3px)",
          willChange: "transform, opacity",
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* ── Veil 1 (near) — brightest, closest ── */}
      <div
        ref={veil1Ref}
        className="cursor-veil pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
        style={{
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: "50%",
          background: veilBg(0.5),
          filter: "blur(1.5px)",
          willChange: "transform, opacity",
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* ── Hairline ring — hidden at rest; coalesces on hover.
          Chalk on void / deep-amber on day via --cursor-ring-* vars. ── */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:block"
        style={{
          width: 44,
          height: 44,
          marginLeft: -22,
          marginTop: -22,
          borderRadius: "50%",
          border: "1px solid var(--cursor-ring-line)",
          boxShadow: "0 0 14px var(--cursor-ring-shadow)",
          willChange: "transform, opacity",
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* ── Hover label — floats beside cursor ── */}
      <span
        ref={labelRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:block font-[family-name:var(--font-geist-mono)] text-[8px] uppercase tracking-[0.25em] text-v-chalk opacity-0"
        style={{
          marginLeft: 20,
          marginTop: -24,
          willChange: "transform",
          transform: "scale(0.8)",
        }}
        aria-hidden="true"
      >
        {""}
      </span>

      {/* ── Inner dot: accent gold — UNCHANGED (user's explicit constraint) ── */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:block"
        style={{
          width: 12,
          height: 12,
          marginLeft: -6,
          marginTop: -6,
          borderRadius: "50%",
          backgroundColor: "var(--v-accent)",
          willChange: "transform",
          transform: "scale(0.5)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
