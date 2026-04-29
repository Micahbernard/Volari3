"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// ProcessPipeline ✦ Scroll-Driven SVG Timeline
//
// A vertical section where a glowing SVG line animates through
// 5 creative process milestones as the user scrolls. Each step
// triggers distinct entrance: clip-path reveals, typewriter text,
// and mercury-style fill markers.
// ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Discovery",
    body: "We immerse ourselves in your world — stakeholder interviews, competitive analysis, user research, and technical audit. Every assumption is questioned until only signal remains.",
    tags: ["Research", "Audit", "Strategy"],
  },
  {
    num: "02",
    title: "Design",
    body: "Visual systems emerge from the research. Wireframes become prototypes; prototypes become polished designs. Motion language is defined at this stage, not bolted on later.",
    tags: ["UI/UX", "Motion", "Prototyping"],
  },
  {
    num: "03",
    title: "Build",
    body: "Component architecture, shader development, animation implementation. We write every line of frontend code ourselves — no templates, no shortcuts. Performance is a feature.",
    tags: ["Next.js", "WebGL", "GSAP"],
  },
  {
    num: "04",
    title: "Refine",
    body: "Pixel-perfect polish. Micro-interactions tuned to 16ms frames. Cross-browser validation. Accessibility audit. The last 10% of work that separates good from extraordinary.",
    tags: ["QA", "A11y", "Performance"],
  },
  {
    num: "05",
    title: "Launch",
    body: "Deployment, monitoring, handoff documentation. We do not disappear at launch — we stay for the first 30 days to ensure everything performs as designed under real traffic.",
    tags: ["Deploy", "Monitor", "Support"],
  },
] as const;

export default function ProcessPipeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);
  const svgGlowRef = useRef<SVGPathElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const path = svgPathRef.current;
    const glow = svgGlowRef.current;
    if (!section || !path || !glow) return;

    const pathLength = path.getTotalLength();
    gsap.set([path, glow], {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });

    const ctx = gsap.context(() => {
      // ── SVG line draw on scroll ──
      const lineTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 60%",
          end: "bottom 70%",
          scrub: 0.6,
        },
      });

      lineTl.to([path, glow], {
        strokeDashoffset: 0,
        ease: "none",
        duration: 1,
      });

      // ── Step reveals ──
      stepRefs.current.forEach((step, i) => {
        if (!step) return;

        const els = step.querySelectorAll("[data-reveal]");
        gsap.fromTo(
          els,
          {
            clipPath: "inset(0 100% 0 0)",
            opacity: 0,
          },
          {
            clipPath: "inset(0 0% 0 0)",
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "expo.out",
            scrollTrigger: {
              trigger: step,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // ── Mercury marker fills ──
      markerRefs.current.forEach((marker, i) => {
        if (!marker) return;
        const fill = marker.querySelector("[data-marker-fill]");
        if (!fill) return;

        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: marker,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const setStepRef = (i: number) => (el: HTMLDivElement | null) => {
    stepRefs.current[i] = el;
  };
  const setMarkerRef = (i: number) => (el: HTMLDivElement | null) => {
    markerRefs.current[i] = el;
  };

  return (
    <section ref={sectionRef} id="process" className="relative scroll-mt-20">
      {/* Top rule */}
      <div className="flex justify-center px-6 md:px-10">
        <div className="h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-v-smoke/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-[90rem] px-6 py-32 md:px-10">
        {/* Heading */}
        <div className="mb-24">
          <span className="mb-5 block font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.5em] text-v-accent/70">
            003 — The Method
          </span>
          <div className="flex items-center gap-6 md:gap-10">
            <div className="hidden h-px w-16 bg-gradient-to-r from-v-accent/40 to-transparent md:block" />
            <h2 className="font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-v-chalk">
              From <span className="italic text-v-accent">signal</span> to launch
            </h2>
          </div>
          <p className="mt-5 max-w-lg font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.9] tracking-[0.02em] text-v-silver/70 md:text-xs">
            A disciplined five-stage process. Each phase is gated —
            nothing proceeds until the previous step is complete.
          </p>
        </div>

        {/* Pipeline */}
        <div className="relative">
          {/* SVG connecting line */}
          <svg
            className="absolute top-0 left-[19px] h-full w-[2px] md:left-[27px]"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Glow layer */}
            <path
              ref={svgGlowRef}
              d="M 1 0 L 1 100%"
              stroke="rgba(212,168,83,0.25)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ height: "100%" }}
            />
            {/* Main line */}
            <path
              ref={svgPathRef}
              d="M 1 0 L 1 100%"
              stroke="rgba(200,200,212,0.35)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Steps */}
          <div className="flex flex-col gap-20 md:gap-28">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                ref={setStepRef(i)}
                className="relative flex gap-6 md:gap-10"
              >
                {/* Mercury marker */}
                <div
                  ref={setMarkerRef(i)}
                  className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-v-smoke/20 bg-[var(--v-void)] md:h-14 md:w-14"
                >
                  {/* Fill */}
                  <div
                    data-marker-fill
                    className="absolute inset-0 origin-bottom bg-gradient-to-t from-v-accent/30 via-v-accent/10 to-transparent"
                    style={{ transform: "scaleY(0)" }}
                  />
                  {/* Number */}
                  <span
                    data-reveal
                    className="relative z-10 font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.15em] text-v-accent md:text-[11px]"
                    style={{ opacity: 0 }}
                  >
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-baseline gap-4">
                    <h3
                      data-reveal
                      className="font-[family-name:var(--font-playfair)] text-[clamp(1.5rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-v-chalk"
                      style={{ opacity: 0 }}
                    >
                      {step.title}
                    </h3>
                    <div
                      data-reveal
                      className="hidden h-px flex-1 max-w-[80px] bg-gradient-to-r from-v-smoke/20 to-transparent md:block"
                      style={{ opacity: 0 }}
                    />
                  </div>

                  <p
                    data-reveal
                    className="mt-4 max-w-xl font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.85] text-v-silver/75 md:text-xs"
                    style={{ opacity: 0 }}
                  >
                    {step.body}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        data-reveal
                        className="rounded-full border border-v-smoke/20 px-3 py-1 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.2em] text-v-silver/50"
                        style={{ opacity: 0 }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
