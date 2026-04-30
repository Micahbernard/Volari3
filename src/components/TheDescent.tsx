"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// THE DESCENT — Parallax void descent inspired by Hollow Knight's Abyss
//
// Scroll = descent. Fog thickens, light fades, architecture passes,
// void ash drifts upward, ghost text breathes in and out of the mist.
// ─────────────────────────────────────────────────────────────

const GHOST_LINES = [
  { text: "Below the surface, something stirs.", at: 0.15 },
  { text: "The deeper you go, the darker it remembers.", at: 0.4 },
  { text: "In the void, even silence has weight.", at: 0.7 },
];

export default function TheDescent() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const fog1Ref = useRef<HTMLDivElement>(null);
  const fog2Ref = useRef<HTMLDivElement>(null);
  const fog3Ref = useRef<HTMLDivElement>(null);
  const archL1Ref = useRef<HTMLDivElement>(null);
  const archL2Ref = useRef<HTMLDivElement>(null);
  const archR1Ref = useRef<HTMLDivElement>(null);
  const archR2Ref = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // ── Particle system ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0,
      h = 0;
    const PARTICLE_COUNT = 120;
    const particles: {
      x: number;
      y: number;
      r: number;
      speed: number;
      opacity: number;
      drift: number;
      phase: number;
    }[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles spread across the canvas
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.35 + 0.1,
        opacity: Math.random() * 0.45 + 0.05,
        drift: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const now = performance.now() / 1000;

      for (const p of particles) {
        // Drift upward (creates sinking illusion)
        p.y -= p.speed;
        // Gentle horizontal sway
        p.x += Math.sin(now * 0.5 + p.phase) * p.drift;

        // Reset at top
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 220, ${p.opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── GSAP Scroll-driven descent ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      // ── Light beam: fades and narrows ──
      if (lightRef.current) {
        tl.fromTo(
          lightRef.current,
          { opacity: 0.7, scaleX: 1 },
          { opacity: 0, scaleX: 0.3, ease: "none" },
          0
        );
      }

      // ── Fog thickens (opacity increases, spreads) ──
      if (fog1Ref.current) {
        tl.fromTo(
          fog1Ref.current,
          { opacity: 0.15 },
          { opacity: 0.7, ease: "none" },
          0
        );
      }
      if (fog2Ref.current) {
        tl.fromTo(
          fog2Ref.current,
          { opacity: 0.1 },
          { opacity: 0.8, ease: "none" },
          0.1
        );
      }
      if (fog3Ref.current) {
        tl.fromTo(
          fog3Ref.current,
          { opacity: 0.05 },
          { opacity: 0.9, ease: "none" },
          0.25
        );
      }

      // ── Architecture passes upward (different speeds for depth) ──
      // Left arches
      if (archL1Ref.current) {
        tl.fromTo(
          archL1Ref.current,
          { yPercent: 15, opacity: 0.2 },
          { yPercent: -60, opacity: 0.6, ease: "none" },
          0
        );
      }
      if (archL2Ref.current) {
        tl.fromTo(
          archL2Ref.current,
          { yPercent: 30, opacity: 0.15 },
          { yPercent: -80, opacity: 0.5, ease: "none" },
          0
        );
      }
      // Right arches
      if (archR1Ref.current) {
        tl.fromTo(
          archR1Ref.current,
          { yPercent: 10, opacity: 0.2 },
          { yPercent: -55, opacity: 0.6, ease: "none" },
          0
        );
      }
      if (archR2Ref.current) {
        tl.fromTo(
          archR2Ref.current,
          { yPercent: 25, opacity: 0.15 },
          { yPercent: -75, opacity: 0.5, ease: "none" },
          0
        );
      }

      // ── Ghost text: breathes in and out ──
      for (const line of GHOST_LINES) {
        const el = textRefs.current.find(
          (_, i) => GHOST_LINES[i]?.text === line.text
        );
        if (!el) continue;

        const enterAt = line.at;
        const peakAt = enterAt + 0.08;
        const exitAt = peakAt + 0.12;

        tl.fromTo(el, { opacity: 0, y: 20 }, { opacity: 0.7, y: 0, duration: peakAt - enterAt, ease: "power2.out" }, enterAt);
        tl.to(el, { opacity: 0, y: -15, duration: exitAt - peakAt, ease: "power2.in" }, peakAt);
      }
    });

    return () => ctx.revert();
  }, []);

  const setTextRef = (i: number) => (el: HTMLParagraphElement | null) => {
    textRefs.current[i] = el;
  };

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "350vh" }}
    >
      {/* Sticky scene — stays in viewport while section scrolls */}
      <div
        ref={sceneRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ background: "#020202" }}
      >
        {/* ── Light beam from above ── */}
        <div
          ref={lightRef}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 1 }}
        >
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: "clamp(120px, 18vw, 320px)",
              height: "100%",
              background:
                "linear-gradient(180deg, rgba(200,210,220,0.12) 0%, rgba(200,210,220,0.04) 40%, transparent 100%)",
            }}
          />
        </div>

        {/* ── Fog layers ── */}
        {/* Fog 1 — distant, slow */}
        <div
          ref={fog1Ref}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 2, opacity: 0.15 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 140% 60% at 50% 30%, rgba(60,65,75,0.3) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Fog 2 — mid, medium */}
        <div
          ref={fog2Ref}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 3, opacity: 0.1 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 120% 70% at 45% 55%, rgba(40,42,50,0.4) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 100% 50% at 60% 70%, rgba(30,32,40,0.35) 0%, transparent 60%)",
            }}
          />
        </div>

        {/* Fog 3 — close, thick */}
        <div
          ref={fog3Ref}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 4, opacity: 0.05 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 160% 80% at 50% 80%, rgba(20,22,28,0.6) 0%, transparent 60%)",
            }}
          />
        </div>

        {/* ── Gothic architecture silhouettes ── */}
        {/* Left arch 1 — near */}
        <div
          ref={archL1Ref}
          className="pointer-events-none absolute left-0 top-0 h-full"
          style={{ zIndex: 5, opacity: 0.2, width: "clamp(80px, 15vw, 200px)" }}
        >
          <svg
            viewBox="0 0 200 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tall spire */}
            <path d="M180 900 L180 120 Q160 40 140 0" stroke="rgba(55,58,68,0.6)" strokeWidth="2" />
            <path d="M160 900 L160 180 Q145 80 120 20" stroke="rgba(55,58,68,0.45)" strokeWidth="1.5" />
            {/* Arch frame */}
            <path d="M190 900 L190 300 Q180 260 160 240 Q140 260 130 300 L130 900" stroke="rgba(45,48,58,0.5)" strokeWidth="1.5" fill="rgba(15,16,20,0.15)" />
            {/* Cross beams */}
            <line x1="130" y1="350" x2="190" y2="350" stroke="rgba(45,48,58,0.35)" strokeWidth="1" />
            <line x1="135" y1="500" x2="185" y2="500" stroke="rgba(45,48,58,0.3)" strokeWidth="1" />
            <line x1="132" y1="650" x2="188" y2="650" stroke="rgba(45,48,58,0.25)" strokeWidth="1" />
            {/* Small arch detail */}
            <path d="M145 400 Q160 380 175 400" stroke="rgba(45,48,58,0.3)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Left arch 2 — far */}
        <div
          ref={archL2Ref}
          className="pointer-events-none absolute left-0 top-0 h-full"
          style={{ zIndex: 3, opacity: 0.15, width: "clamp(60px, 10vw, 140px)" }}
        >
          <svg
            viewBox="0 0 140 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M130 900 L130 200 Q110 100 90 30" stroke="rgba(50,53,63,0.4)" strokeWidth="1.5" />
            <path d="M110 900 L110 280 Q95 160 70 50" stroke="rgba(50,53,63,0.3)" strokeWidth="1" />
            <path d="M70 900 L70 350 Q80 300 95 280 Q110 300 120 350 L120 900" stroke="rgba(40,43,53,0.35)" strokeWidth="1" fill="rgba(10,11,15,0.1)" />
          </svg>
        </div>

        {/* Right arch 1 — near */}
        <div
          ref={archR1Ref}
          className="pointer-events-none absolute right-0 top-0 h-full"
          style={{ zIndex: 5, opacity: 0.2, width: "clamp(80px, 15vw, 200px)" }}
        >
          <svg
            viewBox="0 0 200 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 900 L20 120 Q40 40 60 0" stroke="rgba(55,58,68,0.6)" strokeWidth="2" />
            <path d="M40 900 L40 180 Q55 80 80 20" stroke="rgba(55,58,68,0.45)" strokeWidth="1.5" />
            <path d="M10 900 L10 300 Q20 260 40 240 Q60 260 70 300 L70 900" stroke="rgba(45,48,58,0.5)" strokeWidth="1.5" fill="rgba(15,16,20,0.15)" />
            <line x1="10" y1="350" x2="70" y2="350" stroke="rgba(45,48,58,0.35)" strokeWidth="1" />
            <line x1="15" y1="500" x2="65" y2="500" stroke="rgba(45,48,58,0.3)" strokeWidth="1" />
            <line x1="12" y1="650" x2="68" y2="650" stroke="rgba(45,48,58,0.25)" strokeWidth="1" />
            <path d="M25 400 Q40 380 55 400" stroke="rgba(45,48,58,0.3)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Right arch 2 — far */}
        <div
          ref={archR2Ref}
          className="pointer-events-none absolute right-0 top-0 h-full"
          style={{ zIndex: 3, opacity: 0.15, width: "clamp(60px, 10vw, 140px)" }}
        >
          <svg
            viewBox="0 0 140 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 900 L10 200 Q30 100 50 30" stroke="rgba(50,53,63,0.4)" strokeWidth="1.5" />
            <path d="M30 900 L30 280 Q45 160 70 50" stroke="rgba(50,53,63,0.3)" strokeWidth="1" />
            <path d="M70 900 L70 350 Q60 300 45 280 Q30 300 20 350 L20 900" stroke="rgba(40,43,53,0.35)" strokeWidth="1" fill="rgba(10,11,15,0.1)" />
          </svg>
        </div>

        {/* ── Particle canvas ── */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 6 }}
        />

        {/* ── Ghost text ── */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 7 }}
        >
          <div className="flex flex-col items-center gap-16">
            {GHOST_LINES.map((line, i) => (
              <p
                key={i}
                ref={setTextRef(i)}
                className="font-[family-name:var(--font-geist-mono)] text-center text-[clamp(11px,1.4vw,16px)] uppercase tracking-[0.35em]"
                style={{
                  opacity: 0,
                  color: "rgba(180, 188, 200, 0.8)",
                  textShadow: "0 0 30px rgba(180, 188, 200, 0.15)",
                }}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>

        {/* ── Bottom void — absolute darkness consumes ── */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            zIndex: 8,
            height: "40%",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(2,2,2,0.6) 40%, rgba(2,2,2,0.95) 80%, #020202 100%)",
          }}
        />
      </div>
    </section>
  );
}
