"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setDescentProgress } from "@/lib/descentStore";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// THE DESCENT — Scroll driver + ghost text + architecture silhouettes
//
// The actual visual descent (fog, particles, light beam, darkening)
// is handled entirely by the fluidBackground shader via uDescent.
// This component only:
//   1. Drives scroll progress → setDescentProgress (→ shader uniform)
//   2. Renders gothic arch silhouettes (SVG, parallaxing)
//   3. Renders ghost text that breathes in and out
// ─────────────────────────────────────────────────────────────

const GHOST_LINES = [
  { text: "Below the surface, something stirs.", at: 0.15 },
  { text: "The deeper you go, the darker it remembers.", at: 0.4 },
  { text: "In the void, even silence has weight.", at: 0.7 },
];

export default function TheDescent() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const archL1Ref = useRef<HTMLDivElement>(null);
  const archL2Ref = useRef<HTMLDivElement>(null);
  const archR1Ref = useRef<HTMLDivElement>(null);
  const archR2Ref = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // ── Scroll driver → shader uniform via descentStore ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Master timeline for all scroll-driven animations
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => {
            // Feed progress to the shader
            setDescentProgress(self.progress);
          },
        },
      });

      // ── Architecture passes upward (different speeds for depth) ──
      if (archL1Ref.current) {
        tl.fromTo(
          archL1Ref.current,
          { yPercent: 15, opacity: 0.15 },
          { yPercent: -60, opacity: 0.5, ease: "none" },
          0
        );
      }
      if (archL2Ref.current) {
        tl.fromTo(
          archL2Ref.current,
          { yPercent: 30, opacity: 0.1 },
          { yPercent: -80, opacity: 0.4, ease: "none" },
          0
        );
      }
      if (archR1Ref.current) {
        tl.fromTo(
          archR1Ref.current,
          { yPercent: 10, opacity: 0.15 },
          { yPercent: -55, opacity: 0.5, ease: "none" },
          0
        );
      }
      if (archR2Ref.current) {
        tl.fromTo(
          archR2Ref.current,
          { yPercent: 25, opacity: 0.1 },
          { yPercent: -75, opacity: 0.4, ease: "none" },
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

        tl.fromTo(el, { opacity: 0, y: 20 }, { opacity: 0.65, y: 0, duration: peakAt - enterAt, ease: "power2.out" }, enterAt);
        tl.to(el, { opacity: 0, y: -15, duration: exitAt - peakAt, ease: "power2.in" }, peakAt);
      }
    });

    return () => {
      ctx.revert();
      // Reset descent when section unmounts
      setDescentProgress(0);
    };
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
      >
        {/* ── Gothic architecture silhouettes ── */}
        {/* Left arch 1 — near */}
        <div
          ref={archL1Ref}
          className="pointer-events-none absolute left-0 top-0 h-full"
          style={{ zIndex: 5, opacity: 0.15, width: "clamp(80px, 15vw, 200px)" }}
        >
          <svg
            viewBox="0 0 200 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M180 900 L180 120 Q160 40 140 0" stroke="rgba(55,58,68,0.5)" strokeWidth="2" />
            <path d="M160 900 L160 180 Q145 80 120 20" stroke="rgba(55,58,68,0.35)" strokeWidth="1.5" />
            <path d="M190 900 L190 300 Q180 260 160 240 Q140 260 130 300 L130 900" stroke="rgba(45,48,58,0.4)" strokeWidth="1.5" fill="rgba(10,10,14,0.08)" />
            <line x1="130" y1="350" x2="190" y2="350" stroke="rgba(45,48,58,0.3)" strokeWidth="1" />
            <line x1="135" y1="500" x2="185" y2="500" stroke="rgba(45,48,58,0.25)" strokeWidth="1" />
            <line x1="132" y1="650" x2="188" y2="650" stroke="rgba(45,48,58,0.2)" strokeWidth="1" />
            <path d="M145 400 Q160 380 175 400" stroke="rgba(45,48,58,0.25)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Left arch 2 — far */}
        <div
          ref={archL2Ref}
          className="pointer-events-none absolute left-0 top-0 h-full"
          style={{ zIndex: 3, opacity: 0.1, width: "clamp(60px, 10vw, 140px)" }}
        >
          <svg
            viewBox="0 0 140 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M130 900 L130 200 Q110 100 90 30" stroke="rgba(50,53,63,0.35)" strokeWidth="1.5" />
            <path d="M110 900 L110 280 Q95 160 70 50" stroke="rgba(50,53,63,0.25)" strokeWidth="1" />
            <path d="M70 900 L70 350 Q80 300 95 280 Q110 300 120 350 L120 900" stroke="rgba(40,43,53,0.3)" strokeWidth="1" fill="rgba(8,8,12,0.06)" />
          </svg>
        </div>

        {/* Right arch 1 — near */}
        <div
          ref={archR1Ref}
          className="pointer-events-none absolute right-0 top-0 h-full"
          style={{ zIndex: 5, opacity: 0.15, width: "clamp(80px, 15vw, 200px)" }}
        >
          <svg
            viewBox="0 0 200 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 900 L20 120 Q40 40 60 0" stroke="rgba(55,58,68,0.5)" strokeWidth="2" />
            <path d="M40 900 L40 180 Q55 80 80 20" stroke="rgba(55,58,68,0.35)" strokeWidth="1.5" />
            <path d="M10 900 L10 300 Q20 260 40 240 Q60 260 70 300 L70 900" stroke="rgba(45,48,58,0.4)" strokeWidth="1.5" fill="rgba(10,10,14,0.08)" />
            <line x1="10" y1="350" x2="70" y2="350" stroke="rgba(45,48,58,0.3)" strokeWidth="1" />
            <line x1="15" y1="500" x2="65" y2="500" stroke="rgba(45,48,58,0.25)" strokeWidth="1" />
            <line x1="12" y1="650" x2="68" y2="650" stroke="rgba(45,48,58,0.2)" strokeWidth="1" />
            <path d="M25 400 Q40 380 55 400" stroke="rgba(45,48,58,0.25)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Right arch 2 — far */}
        <div
          ref={archR2Ref}
          className="pointer-events-none absolute right-0 top-0 h-full"
          style={{ zIndex: 3, opacity: 0.1, width: "clamp(60px, 10vw, 140px)" }}
        >
          <svg
            viewBox="0 0 140 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 900 L10 200 Q30 100 50 30" stroke="rgba(50,53,63,0.35)" strokeWidth="1.5" />
            <path d="M30 900 L30 280 Q45 160 70 50" stroke="rgba(50,53,63,0.25)" strokeWidth="1" />
            <path d="M70 900 L70 350 Q60 300 45 280 Q30 300 20 350 L20 900" stroke="rgba(40,43,53,0.3)" strokeWidth="1" fill="rgba(8,8,12,0.06)" />
          </svg>
        </div>

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
                  color: "rgba(160, 170, 185, 0.75)",
                  textShadow: "0 0 40px rgba(160, 170, 185, 0.12)",
                }}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
