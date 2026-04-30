"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type {
  ComponentProps,
  FocusEvent as ReactFocusEvent,
  PointerEvent as ReactPointerEvent,
  Ref,
} from "react";

// ─────────────────────────────────────────────────────────────
// MercuryMenuToggle  ✦  Liquid Mercury Fill (circular vessel)
//
// EXACT copy of the V Emblem's liquid mercury system,
// only the geometry changed from V-shape to circle.
// All physics, gradients, filters, shimmer, droplets,
// bubbles, and effects remain IDENTICAL.
// ─────────────────────────────────────────────────────────────

type MercuryMenuToggleProps = Omit<
  ComponentProps<"button">,
  "onClick" | "type" | "children"
> & {
  isOpen?: boolean;
  onToggle?: (next: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
};

export default function MercuryMenuToggle({
  ref,
  isOpen = false,
  onToggle,
  className = "",
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onFocus,
  onBlur,
  ...rest
}: MercuryMenuToggleProps) {
  const [hovered, setHovered] = useState(false);
  const [phase, setPhase] = useState<"rest" | "enter" | "active" | "exit">("rest");

  // ─── rAF Physics State (EXACT from V Emblem) ───────────────
  const fillRef = useRef(0);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const timeRef = useRef(0);
  const shimmerRef = useRef(0);
  const rafRef = useRef<number>(0);

  const [fillLevel, setFillLevel] = useState(0);
  const [clock, setClock] = useState(0);
  const [shimmerPos, setShimmerPos] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  // ─── Phase timers ──────────────────────────────────────────
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    [enterTimerRef, exitTimerRef, restTimerRef].forEach((r) => {
      if (r.current) { clearTimeout(r.current); r.current = null; }
    });
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const beginEnter = useCallback(() => {
    clearTimers();
    setPhase("enter");
    targetRef.current = 1;
    enterTimerRef.current = setTimeout(() => { setPhase("active"); enterTimerRef.current = null; }, 500);
  }, [clearTimers]);

  const beginExit = useCallback(() => {
    clearTimers();
    targetRef.current = 0;
    exitTimerRef.current = setTimeout(() => {
      setPhase("exit");
      exitTimerRef.current = null;
      restTimerRef.current = setTimeout(() => { setPhase("rest"); restTimerRef.current = null; }, 420);
    }, 280);
  }, [clearTimers]);

  const cancelExit = useCallback(() => {
    [exitTimerRef, restTimerRef].forEach((r) => { if (r.current) { clearTimeout(r.current); r.current = null; } });
  }, []);

  // ─── Events ────────────────────────────────────────────────
  const handlePointerEnter = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setHovered(true);
    if (phase === "rest") beginEnter();
    else { cancelExit(); if (phase === "exit") setPhase("active"); }
    onPointerEnter?.(e);
  }, [phase, beginEnter, cancelExit, onPointerEnter]);

  const handlePointerLeave = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setHovered(false);
    if (phase === "active" || phase === "enter") beginExit();
    onPointerLeave?.(e);
  }, [phase, beginExit, onPointerLeave]);

  const handleFocus = useCallback((e: ReactFocusEvent<HTMLButtonElement>) => {
    setHovered(true);
    if (phase === "rest" || phase === "exit") beginEnter(); else cancelExit();
    onFocus?.(e);
  }, [phase, beginEnter, cancelExit, onFocus]);

  const handleBlur = useCallback((e: ReactFocusEvent<HTMLButtonElement>) => {
    setHovered(false);
    if (phase === "active" || phase === "enter") beginExit();
    onBlur?.(e);
  }, [phase, beginExit, onBlur]);

  const handleClick = useCallback(() => { onToggle?.(!isOpen); }, [isOpen, onToggle]);

  const isActive = phase !== "rest";

  // ─── Momentum-based liquid physics (EXACT from V) ───────────
  const animateRef = useRef<() => void>(() => {});

  const animate = useCallback(() => {
    const diff = targetRef.current - fillRef.current;

    const spring = 0.0018;
    const damping = 0.92;
    const maxVel = 0.0045;

    velocityRef.current += diff * spring;
    velocityRef.current *= damping;
    velocityRef.current = Math.max(-maxVel, Math.min(maxVel, velocityRef.current));

    fillRef.current += velocityRef.current;

    if (Math.abs(velocityRef.current) > 0.0001) {
      fillRef.current += Math.sin(timeRef.current * 2.2) * 0.00008 * Math.sign(velocityRef.current);
    }

    fillRef.current = Math.max(0, Math.min(1, fillRef.current));

    const moving = Math.abs(velocityRef.current) > 0.00005 || Math.abs(diff) > 0.001;
    setIsMoving(moving);

    if (!moving && Math.abs(diff) < 0.001) {
      fillRef.current = targetRef.current;
      velocityRef.current = 0;
    }

    timeRef.current += 0.009;
    setFillLevel(fillRef.current);
    setClock(timeRef.current);

    if (fillRef.current > 0.02) {
      shimmerRef.current += 0.0018;
      if (shimmerRef.current > 1.15) shimmerRef.current = -0.15;
      setShimmerPos(shimmerRef.current);
    }

    rafRef.current = requestAnimationFrame(() => animateRef.current());
  }, []);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => animateRef.current());
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ─── Circle bounds at a given Y (radius = 22, center 24,24) ─
  function circleBoundsAtY(y: number) {
    const cy = 24;
    const r = 22;
    const dy = y - cy;
    if (Math.abs(dy) > r) return { left: 24, right: 24 };
    const dx = Math.sqrt(r * r - dy * dy);
    return { left: 24 - dx, right: 24 + dx };
  }

  // ─── Mercury fluid path (circle version, same logic) ───────
  const buildMercuryPath = () => {
    if (fillLevel < 0.005) return "";

    const bottomY = 46;
    const topY = bottomY - fillLevel * 44;
    const steps = 60;
    const waveAmp = isMoving ? 2.0 + fillLevel * 1.5 : 0.8 + fillLevel * 0.5;
    const t = clock;

    let d = `M 24 ${bottomY} `;

    // Left wall: UP from bottom
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const y = bottomY - frac * (bottomY - topY);
      const bounds = circleBoundsAtY(y);
      d += `L ${bounds.left.toFixed(1)} ${y.toFixed(1)} `;
    }

    // Wavy top surface (EXACT same wave formula as V)
    const topBounds = circleBoundsAtY(topY);
    const surfaceSteps = 80;
    const surfacePoints: [number, number][] = [];
    for (let i = 0; i <= surfaceSteps; i++) {
      const frac = i / surfaceSteps;
      const x = topBounds.left + frac * (topBounds.right - topBounds.left);
      const wave1 = Math.sin(frac * Math.PI * 4 + t * 1.2) * waveAmp;
      const wave2 = Math.sin(frac * Math.PI * 7 + t * 1.9 + 1.2) * waveAmp * 0.35;
      const wave3 = Math.sin(frac * Math.PI * 2 + t * 0.7 + 2.5) * waveAmp * 0.2;
      const edgeDamp = Math.sin(frac * Math.PI);
      const y = topY + (wave1 + wave2 + wave3) * edgeDamp;
      surfacePoints.push([x, y]);
    }

    d += `L ${surfacePoints[0][0].toFixed(1)} ${surfacePoints[0][1].toFixed(1)} `;
    for (let i = 1; i < surfacePoints.length - 1; i++) {
      const cpx = surfacePoints[i][0];
      const cpy = surfacePoints[i][1];
      const nx = (surfacePoints[i][0] + surfacePoints[i + 1][0]) / 2;
      const ny = (surfacePoints[i][1] + surfacePoints[i + 1][1]) / 2;
      d += `Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)} `;
    }
    const last = surfacePoints[surfacePoints.length - 1];
    d += `L ${last[0].toFixed(1)} ${last[1].toFixed(1)} `;

    // Right wall: DOWN to bottom
    for (let i = steps; i >= 0; i--) {
      const frac = i / steps;
      const y = bottomY - frac * (bottomY - topY);
      const bounds = circleBoundsAtY(y);
      d += `L ${bounds.right.toFixed(1)} ${y.toFixed(1)} `;
    }

    d += "Z";
    return d;
  };

  // ─── Surface highlight path (bright meniscus) ──────────────
  const buildSurfaceHighlight = () => {
    if (fillLevel < 0.01) return "";
    const bottomY = 46;
    const topY = bottomY - fillLevel * 44;
    const topBounds = circleBoundsAtY(topY);
    if (topBounds.right - topBounds.left < 4) return "";

    const t = clock;
    const amp = isMoving ? 1.6 : 0.6;
    let d = "";
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const x = topBounds.left + frac * (topBounds.right - topBounds.left);
      const wave = Math.sin(frac * Math.PI * 4 + t * 1.2 + 0.5) * amp * Math.sin(frac * Math.PI);
      const y = topY + wave;
      d += (i === 0 ? "M" : "L") + ` ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    return d;
  };

  // ─── Shimmer path: horizontal band rising through liquid ───
  const buildShimmerPath = () => {
    if (fillLevel < 0.03) return null;

    const bottomY = 46;
    const topY = bottomY - fillLevel * 44;
    const liquidHeight = bottomY - topY;
    const shimmerY = bottomY - shimmerPos * liquidHeight;

    if (shimmerY < topY - 5 || shimmerY > bottomY + 5) return null;

    const bounds = circleBoundsAtY(shimmerY);
    const bandHeight = 12;
    const topBand = shimmerY - bandHeight / 2;
    const botBand = shimmerY + bandHeight / 2;
    const topBoundsBand = circleBoundsAtY(topBand);
    const botBoundsBand = circleBoundsAtY(botBand);

    const d = `M ${botBoundsBand.left.toFixed(1)} ${botBand.toFixed(1)} `
      + `L ${topBoundsBand.left.toFixed(1)} ${topBand.toFixed(1)} `
      + `L ${topBoundsBand.right.toFixed(1)} ${topBand.toFixed(1)} `
      + `L ${botBoundsBand.right.toFixed(1)} ${botBand.toFixed(1)} Z`;

    return { d, centerY: shimmerY };
  };

  // ─── Droplets ──────────────────────────────────────────────
  const buildDroplets = () => {
    if (fillLevel < 0.08) return [];
    const bottomY = 46;
    const topY = bottomY - fillLevel * 44;
    const t = clock;
    const droplets: Array<{ cx: number; cy: number; r: number; opacity: number }> = [];

    const count = Math.floor(fillLevel * 6) + 1;
    for (let i = 0; i < count; i++) {
      const seed = i * 97.3 + 13;
      const xFrac = (Math.sin(seed) * 0.5 + 0.5);
      const topBounds = circleBoundsAtY(topY + 3);
      const x = topBounds.left + xFrac * (topBounds.right - topBounds.left);
      const bobY = Math.sin(t * (0.6 + i * 0.2) + seed) * 2;
      const y = topY + 2 + bobY;
      droplets.push({
        cx: x + Math.sin(t * 0.4 + seed) * 1.5,
        cy: y,
        r: 1.2 + Math.sin(seed * 3.1) * 0.5,
        opacity: (0.4 + Math.sin(t * 0.8 + seed) * 0.2) * fillLevel,
      });
    }
    return droplets;
  };

  const mercuryPath = buildMercuryPath();
  const surfaceHighlight = buildSurfaceHighlight();
  const droplets = buildDroplets();
  const shimmer = buildShimmerPath();

  const specX = 18 + Math.sin(clock * 0.4) * 14;
  const specY = 34 - fillLevel * 22 * 0.5;

  const liquidAlpha = 0.5;

  return (
    <button
      {...rest}
      ref={ref}
      data-state={isOpen ? "open" : isActive ? "hover" : "rest"}
      data-phase={phase}
      type="button"
      aria-label={rest["aria-label"] ?? (isOpen ? "Close menu" : "Open menu")}
      aria-expanded={isOpen}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={[
        "lens-button group/lens relative inline-flex h-12 w-12 shrink-0",
        "items-center justify-center rounded-full",
        "outline-none cursor-pointer select-none touch-manipulation",
        "bg-[var(--v-void)] border border-[rgba(55,55,62,0.28)]",
        "transition-colors duration-500",
        "hover:border-[rgba(100,100,110,0.45)]",
        "overflow-visible",
        className,
      ].join(" ")}
    >
      {/* ═══ IDLE SILVER HEARTBEAT ═══ */}
      {!isActive && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full motion-reduce:hidden"
            style={{ animation: "silver-heartbeat 3.2s ease-out infinite", border: "1.5px solid rgba(185,185,200,0.40)" }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full motion-reduce:hidden"
            style={{ animation: "silver-heartbeat 3.2s ease-out 1.06s infinite", border: "1px solid rgba(165,165,182,0.22)" }}
          />
        </>
      )}

      {/* ═══ HOVER HALO ═══ */}
      {isActive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-2px] rounded-full opacity-100"
          style={{ boxShadow: "inset 0 0 18px rgba(200,200,212,0.30), 0 0 24px 4px rgba(200,200,212,0.22)" }}
        />
      )}

      {/* ═══ GOLD BLOOM ═══ */}
      {isActive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-3px] rounded-full opacity-50"
          style={{ boxShadow: "0 0 28px 8px var(--accent-glow-soft)" }}
        />
      )}

      {/* ═══ MERCURY VESSEL (SVG — EXACT same defs & render as V) ═══ */}
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-[2px] h-[calc(100%-4px)] w-[calc(100%-4px)] overflow-hidden rounded-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* ═══════ MERCURY GRADIENTS ═══════ */}
          {/* Main mercury body */}
          <linearGradient id="mBody" x1="20%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stopColor="#3a3a48" />
            <stop offset="15%" stopColor="#5a5a6e" />
            <stop offset="30%" stopColor="#8a8aa0" />
            <stop offset="45%" stopColor="#b8b8cc" />
            <stop offset="60%" stopColor="#d8d8e8" />
            <stop offset="75%" stopColor="#c0c0d4" />
            <stop offset="90%" stopColor="#e4e4f0" />
            <stop offset="100%" stopColor="#f0f0fa" />
          </linearGradient>

          {/* Mercury depth layer */}
          <linearGradient id="mDeep" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="20%" stopColor="#2e2e44" />
            <stop offset="40%" stopColor="#4a4a66" />
            <stop offset="60%" stopColor="#7a7a98" />
            <stop offset="80%" stopColor="#a8a8c4" />
            <stop offset="100%" stopColor="#d0d0e4" />
          </linearGradient>

          {/* Specular highlight */}
          <radialGradient id="mSpec" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#e8e8f8" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#b0b0cc" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#686880" stopOpacity="0" />
          </radialGradient>

          {/* Secondary specular */}
          <radialGradient id="mSpecCool" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c8c8e8" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#9090b0" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#50506a" stopOpacity="0" />
          </radialGradient>

          {/* Surface meniscus gradient */}
          <linearGradient id="mSurface" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a0a0b8" />
            <stop offset="15%" stopColor="#d0d0e4" />
            <stop offset="30%" stopColor="#f0f0ff" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f0f0ff" />
            <stop offset="85%" stopColor="#d0d0e4" />
            <stop offset="100%" stopColor="#a0a0b8" />
          </linearGradient>

          {/* Droplet gradient */}
          <radialGradient id="mDrop" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#d8d8ec" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#8888a4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3a3a50" stopOpacity="0.3" />
          </radialGradient>

          {/* Shimmer gradient */}
          <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0e0f0" stopOpacity="0" />
            <stop offset="25%" stopColor="#e8e8f8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#f4f4ff" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#e8e8f8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e0e0f0" stopOpacity="0" />
          </linearGradient>

          {/* ═══════ FILTERS ═══════ */}
          <filter id="mGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b" />
            <feFlood floodColor="#b0b0d0" floodOpacity={fillLevel > 0.1 ? 0.4 : 0} result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="specBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softBlur">
            <feGaussianBlur stdDeviation="0.3" />
          </filter>

          <filter id="shimmerBlur" x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Circle clip path */}
          <clipPath id="circleClip">
            <circle cx="24" cy="24" r="22" />
          </clipPath>
        </defs>

        {/* Ghost at rest */}
        {phase === "rest" && (
          <g className="lens-ghost">
            <circle cx="24" cy="24" r="19" fill="var(--v-smoke)" fillOpacity="0.10" />
          </g>
        )}

        {/* ═══════ LAYER 2: MERCURY FLUID ═══════ */}
        <g clipPath="url(#circleClip)">
          {mercuryPath && (
            <g filter={fillLevel > 0.08 ? "url(#mGlow)" : "none"}>
              {/* Deep shadow layer */}
              <path d={mercuryPath} fill="url(#mDeep)" opacity={liquidAlpha * 0.65} />
              {/* Main mercury body */}
              <path d={mercuryPath} fill="url(#mBody)" opacity={liquidAlpha} />
              {/* Specular highlight */}
              {fillLevel > 0.12 && (
                <ellipse
                  cx={specX}
                  cy={specY}
                  rx={25 + fillLevel * 15}
                  ry={18 + fillLevel * 10}
                  fill="url(#mSpec)"
                  opacity={0.55}
                  filter="url(#specBloom)"
                />
              )}
              {/* Cool blue secondary reflection */}
              {fillLevel > 0.2 && (
                <ellipse
                  cx={specX + 6}
                  cy={specY - 3}
                  rx={18}
                  ry={12}
                  fill="url(#mSpecCool)"
                  opacity={0.3}
                />
              )}
              {/* Shimmer band */}
              {shimmer && fillLevel > 0.03 && (
                <path
                  d={shimmer.d}
                  fill="url(#shimmerGrad)"
                  opacity={liquidAlpha * 0.7}
                  filter="url(#shimmerBlur)"
                />
              )}
            </g>
          )}

          {/* Surface highlight — meniscus */}
          {surfaceHighlight && (
            <>
              <path d={surfaceHighlight} fill="none" stroke="#d8d8f0" strokeWidth="6" strokeLinecap="round" opacity={0.15 * fillLevel} />
              <path d={surfaceHighlight} fill="none" stroke="url(#mSurface)" strokeWidth="2.5" strokeLinecap="round" opacity={0.9 * fillLevel} />
              <path d={surfaceHighlight} fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity={0.5 * fillLevel} />
            </>
          )}

          {/* Droplets */}
          {droplets.map((d, i) => (
            <circle key={`drop-${i}`} cx={d.cx} cy={d.cy} r={d.r} fill="url(#mDrop)" opacity={d.opacity} />
          ))}

          {/* Rising bubbles */}
          {fillLevel > 0.05 && (
            <g clipPath="url(#circleClip)">
              <circle r="2" fill="none" stroke="#c0c0d8" strokeWidth="0.5" filter="url(#softBlur)" opacity="0">
                <animateMotion dur="3.5s" repeatCount="indefinite" path="M 24 46 L 24 24 L 24 4" />
                <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="r" values="2;1.5;2.4;2" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle r="1.5" fill="none" stroke="#d0d0e4" strokeWidth="0.4" opacity="0">
                <animateMotion dur="4s" repeatCount="indefinite" begin="0.6s" path="M 24 46 L 12 30 L 8 8" />
                <animate attributeName="opacity" values="0;0.6;0.6;0" dur="4s" repeatCount="indefinite" begin="0.6s" />
              </circle>
              <circle r="1.2" fill="none" stroke="#b0b0c8" strokeWidth="0.35" opacity="0">
                <animateMotion dur="3s" repeatCount="indefinite" begin="1.2s" path="M 24 46 L 36 30 L 40 8" />
                <animate attributeName="opacity" values="0;0.55;0.55;0" dur="3s" repeatCount="indefinite" begin="1.2s" />
              </circle>
              <circle r="0.8" fill="#d8d8ec" opacity="0">
                <animateMotion dur="2.6s" repeatCount="indefinite" begin="1.8s" path="M 22 44 L 18 22 L 16 6" />
                <animate attributeName="opacity" values="0;0.45;0.45;0" dur="2.6s" repeatCount="indefinite" begin="1.8s" />
              </circle>
              <circle r="2.8" fill="#a0a0bc" filter="url(#softBlur)" opacity="0">
                <animateMotion dur="4.5s" repeatCount="indefinite" path="M 24 46 L 24 28 L 24 10" />
                <animate attributeName="opacity" values="0;0.6;0.5;0" dur="4.5s" repeatCount="indefinite" />
              </circle>
              <circle r="0.7" fill="#c8c8e0" opacity="0">
                <animateMotion dur="2.2s" repeatCount="indefinite" path="M 20 42 L 10 26 L 6 10" />
                <animate attributeName="opacity" values="0;0.4;0.4;0" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle r="0.7" fill="#c8c8e0" opacity="0">
                <animateMotion dur="2.2s" repeatCount="indefinite" begin="0.4s" path="M 28 42 L 38 26 L 42 10" />
                <animate attributeName="opacity" values="0;0.4;0.4;0" dur="2.2s" repeatCount="indefinite" begin="0.4s" />
              </circle>
            </g>
          )}
        </g>

        {/* Inner rim */}
        <circle cx="24" cy="24" r="21" fill="none" stroke="var(--v-smoke)" strokeWidth="0.5" strokeOpacity="0.22" />
      </svg>

      {/* ═══ DOT → X ICON ═══ */}
      <svg viewBox="0 0 48 48" className="relative h-full w-full" aria-hidden="true" style={{ zIndex: 10 }}>
        <g style={{ transformOrigin: "24px 24px", transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          transform={isOpen ? "rotate(45)" : "rotate(0)"}>
          <circle
            cx="24" cy="24"
            r={isOpen ? 11 : 3.5}
            fill="none"
            stroke="var(--v-chalk)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ transition: "r 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          />
          <line
            x1="18" y1="18" x2="30" y2="30"
            stroke="var(--v-chalk)" strokeWidth="1.2" strokeLinecap="round"
            style={{ opacity: isOpen ? 1 : 0, transition: "opacity 0.4s ease-out" }}
          />
          <line
            x1="30" y1="18" x2="18" y2="30"
            stroke="var(--v-chalk)" strokeWidth="1.2" strokeLinecap="round"
            style={{ opacity: isOpen ? 1 : 0, transition: "opacity 0.4s ease-out" }}
          />
        </g>
      </svg>
    </button>
  );
}
