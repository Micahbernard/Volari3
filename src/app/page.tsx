"use client";

import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TheDescent from "@/components/TheDescent";


gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// VOLARI — Hero character config
// ─────────────────────────────────────────────────────────────
const HERO_WORD = "VOLARI";

const CHAR_EASE = "expo.out";
const CHAR_DURATION = 1.6;
const CHAR_STAGGER = 0.07;

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const taglineWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const rulesRef = useRef<{
    top: HTMLDivElement | null;
    bottom: HTMLDivElement | null;
  }>({ top: null, bottom: null });
  const cornerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const metaLeftRef = useRef<HTMLDivElement>(null);
  const metaRightRef = useRef<HTMLDivElement>(null);

  const taglineWords = useMemo(
    () => "Digital Experiences Studio — Bespoke Creative Technology".split(" "),
    []
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      const master = gsap.timeline({
        defaults: { ease: CHAR_EASE },
      });

      // ── Beat 0–1: Curtain lift ──
      if (overlayRef.current) {
        master.to(
          overlayRef.current,
          {
            yPercent: -100,
            duration: 1.2,
            ease: "power4.inOut",
          },
          0.2
        );
      }

      // ── Beat 2: Horizontal rules ──
      if (rulesRef.current.top) {
        master.fromTo(
          rulesRef.current.top,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.4,
            ease: "expo.out",
            transformOrigin: "center center",
          },
          0.5
        );
      }
      if (rulesRef.current.bottom) {
        master.fromTo(
          rulesRef.current.bottom,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.4,
            ease: "expo.out",
            transformOrigin: "center center",
          },
          0.55
        );
      }

      // ── Beat 3: Character reveal ──
      const chars = charRefs.current.filter(Boolean);
      if (chars.length) {
        master.fromTo(
          chars,
          {
            yPercent: 120,
            rotateX: -40,
            opacity: 0,
          },
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: CHAR_DURATION,
            stagger: {
              each: CHAR_STAGGER,
              from: "start",
            },
            ease: CHAR_EASE,
          },
          0.7
        );
      }

      // ── Beat 4: Tagline words ──
      const words = taglineWordsRef.current.filter(Boolean);
      if (words.length) {
        master.fromTo(
          words,
          {
            yPercent: 100,
            opacity: 0,
          },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.04,
            ease: "power3.out",
          },
          1.5
        );
      }

      // ── Beat 5: Corner marks + side metadata ──
      const corners = cornerRefs.current.filter(Boolean);
      if (corners.length) {
        master.fromTo(
          corners,
          { opacity: 0, scale: 0 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.06,
            ease: "back.out(2)",
          },
          1.6
        );
      }

      const metaEls = [metaLeftRef.current, metaRightRef.current].filter(
        Boolean
      );
      if (metaEls.length) {
        master.fromTo(
          metaEls,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power2.out",
          },
          1.7
        );
      }

      // ── Hero scroll parallax ──
      if (heroRef.current) {
        const heroContent = heroRef.current.querySelector(
          "[data-hero-content]"
        );
        if (heroContent) {
          gsap.to(heroContent, {
            yPercent: -8,
            opacity: 0.45,
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          });
        }
      }
    });

    return () => ctx.revert();
  }, []);

  // ── Hero cursor gravity ──
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const chars = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!chars.length) return;

    let active = false;
    const startTimeout = window.setTimeout(() => {
      active = true;
    }, 3000);

    type CharState = {
      tx: number; ty: number; tz: number; rx: number; ry: number; glow: number;
      ttx: number; tty: number; ttz: number; trx: number; tryy: number; tglow: number;
    };
    const state: CharState[] = chars.map(() => ({
      tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, glow: 0,
      ttx: 0, tty: 0, ttz: 0, trx: 0, tryy: 0, tglow: 0,
    }));

    let mouseX = -99999, mouseY = -99999, lastActivity = -Infinity, idleAmp = 0;

    const onMove = (e: PointerEvent) => { mouseX = e.clientX; mouseY = e.clientY; lastActivity = performance.now(); };
    const onLeave = () => { mouseX = -99999; mouseY = -99999; };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    const MAX_DIST = 320, LERP = 0.09, AMBIENT_PERIOD = 5.5;
    let raf = 0;

    const tick = () => {
      const now = performance.now() / 1000;
      const phase = (now / AMBIENT_PERIOD) % 1;
      const sinE = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      const sinD = sinE - 0.5;

      const cursorPresent = mouseX !== -99999 && performance.now() - lastActivity < 2000;
      const targetIdleAmp = active && !cursorPresent ? 1 : 0;
      idleAmp += (targetIdleAmp - idleAmp) * 0.04;

      for (let i = 0; i < chars.length; i++) {
        const el = chars[i];
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = mouseX - cx, dy = mouseY - cy;
        const dist = Math.hypot(dx, dy);
        const t = 1 - Math.min(1, dist / MAX_DIST);
        const soft = t * t * (3 - 2 * t);

        if (active) {
          const s = state[i];
          s.trx = (-dy / MAX_DIST) * 14 * soft;
          s.tryy = (dx / MAX_DIST) * 14 * soft;
          s.ttz = 28 * soft;
          s.ttx = (dx / MAX_DIST) * 5 * soft;
          s.tty = (dy / MAX_DIST) * 5 * soft;
          s.tglow = soft;
        }

        const grainX = phase * 72, grainY = phase * 56;
        const bokAx = 45 + sinD * 34, bokAy = 45 + sinD * 14;
        const bokBx = 55 - sinD * 34, bokBy = 55 - sinD * 14;
        const specAmbX = 140 - phase * 185;
        const steelX = sinE * 100;

        const cDx = Math.max(-1, Math.min(1, dx / 220));
        const cDy = Math.max(-1, Math.min(1, dy / 140));
        const cursorSpecX = 50 + cDx * 50, cursorSpecY = 50 + cDy * 50;
        const specX = specAmbX * (1 - soft) + cursorSpecX * soft;
        const specY = 50 * (1 - soft) + cursorSpecY * soft;

        el.style.backgroundPosition =
          `${grainX.toFixed(1)}px ${grainY.toFixed(1)}px,` +
          ` ${bokAx.toFixed(1)}% ${bokAy.toFixed(1)}%,` +
          ` ${bokBx.toFixed(1)}% ${bokBy.toFixed(1)}%,` +
          ` ${specX.toFixed(1)}% ${specY.toFixed(1)}%,` +
          ` ${steelX.toFixed(1)}% 50%`;
      }

      for (let i = 0; i < chars.length; i++) {
        const el = chars[i], s = state[i];
        s.tx += (s.ttx - s.tx) * LERP;
        s.ty += (s.tty - s.ty) * LERP;
        s.tz += (s.ttz - s.tz) * LERP;
        s.rx += (s.trx - s.rx) * LERP;
        s.ry += (s.tryy - s.ry) * LERP;
        s.glow += (s.tglow - s.glow) * LERP;

        const skip = !active && idleAmp < 0.005 &&
          Math.abs(s.tx) < 0.02 && Math.abs(s.ty) < 0.02 &&
          Math.abs(s.tz) < 0.02 && Math.abs(s.rx) < 0.02 &&
          Math.abs(s.ry) < 0.02 && s.glow < 0.005;

        if (!skip) {
          const ph = i * 0.42;
          const idleRx = Math.sin(now * 0.55 + ph) * 0.3 * idleAmp;
          const idleRy = Math.sin(now * 0.37 + ph + 1.3) * 0.4 * idleAmp;
          const idleScale = 1 + Math.sin(now * 0.42 + ph) * 0.008 * idleAmp;
          const idleTy = Math.sin(now * 0.31 + ph + 0.7) * 0.6 * idleAmp;

          el.style.transform = `translate3d(${s.tx.toFixed(2)}px, ${(s.ty + idleTy).toFixed(2)}px, ${s.tz.toFixed(2)}px) rotateX(${(s.rx + idleRx).toFixed(2)}deg) rotateY(${(s.ry + idleRy).toFixed(2)}deg) scale(${idleScale.toFixed(4)})`;

          const g = s.glow;
          const rySoft = Math.min(1, Math.abs(s.ry) / 14);
          const signY = s.ry >= 0 ? 1 : -1;
          const parts: string[] = [];

          if (rySoft > 0.03) {
            const off = 1 * rySoft, ca = (0.2 * rySoft).toFixed(3);
            parts.push(`drop-shadow(${(signY * off).toFixed(2)}px 0 0 rgba(255,132,110,${ca}))`);
            parts.push(`drop-shadow(${(-signY * off).toFixed(2)}px 0 0 rgba(110,180,240,${ca}))`);
          }

          if (g >= 0.008) {
            const a1 = (0.55 * g).toFixed(3), a2 = (0.35 * g).toFixed(3);
            const r1 = (1.2 * g).toFixed(2), r2 = (3 * g).toFixed(2);
            const br = (1 + 0.12 * g).toFixed(3);
            parts.push(`drop-shadow(0 0 ${r1}px rgba(225,232,240,${a1}))`);
            parts.push(`drop-shadow(0 0 ${r2}px rgba(207,216,226,${a2}))`);
            parts.push(`brightness(${br})`);
          }

          el.style.filter = parts.length ? parts.join(" ") : "";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(startTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  // ── Ref setters ──
  const setCharRef = (i: number) => (el: HTMLSpanElement | null) => {
    charRefs.current[i] = el;
  };
  const setTaglineWordRef = (i: number) => (el: HTMLSpanElement | null) => {
    taglineWordsRef.current[i] = el;
  };
  const setCornerRef = (i: number) => (el: HTMLDivElement | null) => {
    cornerRefs.current[i] = el;
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          CURTAIN OVERLAY — Solid black, lifts to reveal hero
          ═══════════════════════════════════════════════════════ */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-v-black"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      />

      {/* ═══════════════════════════════════════════════════════
          HERO — Full viewport, cinematic entrance
          ═══════════════════════════════════════════════════════ */}
      <section
        id="about"
        ref={heroRef}
        className="relative flex min-h-screen scroll-mt-20 flex-col items-center justify-center overflow-hidden"
      >
        <div data-hero-content className="relative w-full">
          {/* Corner marks */}
          <div className="pointer-events-none absolute inset-6 md:inset-12">
            <div ref={setCornerRef(0)} className="absolute top-0 left-0 h-6 w-6 border-t border-l border-v-smoke/40 opacity-0" />
            <div ref={setCornerRef(1)} className="absolute top-0 right-0 h-6 w-6 border-t border-r border-v-smoke/40 opacity-0" />
            <div ref={setCornerRef(2)} className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-v-smoke/40 opacity-0" />
            <div ref={setCornerRef(3)} className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-v-smoke/40 opacity-0" />
          </div>

          {/* Top rule */}
          <div className="flex items-center justify-center px-6 md:px-12">
            <div ref={(el) => { rulesRef.current.top = el; }} className="h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-v-smoke/40 to-transparent" style={{ transform: "scaleX(0)" }} />
          </div>

          {/* Main title */}
          <div className="flex flex-col items-center py-16 md:py-24">
            <h1 className="hero-volari-heading flex select-none items-center justify-center text-[clamp(4rem,17vw,15rem)] leading-none gap-x-[0.05em] sm:gap-x-[0.055em] md:gap-x-[0.06em]" style={{ perspective: "1000px" }}>
              {HERO_WORD.split("").map((char, i) => (
                <span key={i} className="relative inline-block overflow-hidden" style={{ lineHeight: 1 }}>
                  <span ref={setCharRef(i)} className="hero-volari-letter inline-block font-[family-name:var(--font-playfair)] font-normal tracking-[0.012em] opacity-0" style={{ willChange: "transform, opacity", transformStyle: "preserve-3d", animationDelay: `${i * 0.09}s` }}>
                    {char}
                  </span>
                </span>
              ))}
            </h1>

            {/* Tagline */}
            <p ref={taglineRef} className="mt-6 flex flex-wrap items-center justify-center gap-x-[0.45em] gap-y-1 overflow-hidden px-4 md:mt-8">
              {taglineWords.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden">
                  <span ref={setTaglineWordRef(i)} className="inline-block font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.35em] text-v-silver opacity-0 md:text-xs" style={{ willChange: "transform, opacity" }}>
                    {word}
                  </span>
                </span>
              ))}
            </p>
          </div>

          {/* Studio metadata */}
          <div id="studio" className="mx-auto mt-10 flex w-full max-w-6xl scroll-mt-20 flex-col items-center justify-between gap-3 px-6 sm:flex-row sm:items-center md:mt-12 md:px-12">
            <div ref={metaLeftRef} className="opacity-0">
              <span className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.5em] text-v-smoke">Est. 2024</span>
            </div>
            <div ref={metaRightRef} className="opacity-0">
              <span className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.5em] text-v-smoke">Creative Studio</span>
            </div>
          </div>

          {/* Bottom rule */}
          <div className="flex items-center justify-center px-6 md:px-12">
            <div ref={(el) => { rulesRef.current.bottom = el; }} className="h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-v-smoke/40 to-transparent" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE DESCENT — Parallax void descent into the Abyss
          ═══════════════════════════════════════════════════════ */}
      <TheDescent />
    </>
  );
}
