"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// Service data — five tablets of the alchemical canon
// Each card carries a metal grade, a seal, and a doctrine.
// ─────────────────────────────────────────────────────────────
const SERVICES = [
  {
    seal: "I",
    title: "Web Design\n& Development",
    doctrine:
      "Bespoke sites engineered for conversion. Editorial design married to sub-frame performance — digital storefronts that command premium pricing.",
    notations: ["Next.js", "WebGL", "Headless CMS", "E-Commerce"],
    metal: "from-[#0c0c14] via-[#1e1e2e] to-[#0a0a12]",
    bokeh: "rgba(200,200,212,0.08)",
  },
  {
    seal: "II",
    title: "AI-Powered\nSEO Strategy",
    doctrine:
      "Machine-learning audits, programmatic content architecture, and technical SEO that compounds. We do not chase algorithms — we anticipate them.",
    notations: ["Technical SEO", "AI Content", "Schema", "Analytics"],
    metal: "from-[#0a0a10] via-[#161622] to-[#08080c]",
    bokeh: "rgba(180,180,200,0.06)",
  },
  {
    seal: "III",
    title: "Brand\nIdentity",
    doctrine:
      "Visual systems that scale from favicon to billboard. Typography, color theory, and motion language distilled into a cohesive identity that resonates.",
    notations: ["Visual Identity", "Typography", "Motion Design", "Guidelines"],
    metal: "from-[#0e0e16] via-[#1a1a28] to-[#0c0c14]",
    bokeh: "rgba(212,168,83,0.05)",
  },
  {
    seal: "IV",
    title: "Creative\nTechnology",
    doctrine:
      "Interactive installations, generative art, and immersive experiences that blur the boundary between digital craft and fine art.",
    notations: ["Three.js", "GLSL Shaders", "Generative Art", "R3F"],
    metal: "from-[#08080c] via-[#141420] to-[#060608]",
    bokeh: "rgba(160,160,180,0.07)",
  },
  {
    seal: "V",
    title: "Digital\nStrategy",
    doctrine:
      "Data-informed roadmaps that align business goals with user behavior. Conversion architecture, funnel design, and growth systems.",
    notations: ["CRO", "Analytics", "UX Research", "Growth"],
    metal: "from-[#0c0c12] via-[#181826] to-[#0a0a10]",
    bokeh: "rgba(190,190,210,0.06)",
  },
] as const;

// ─────────────────────────────────────────────────────────────
// ServicesShowcase — Alchemical Tablets
//
// Five engraved metal plates arranged in a horizontal scroll.
// Each tablet carries a Roman seal, a title in Playfair, and
// doctrinal text in Geist Mono.
// ─────────────────────────────────────────────────────────────

export default function ServicesShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  // ── Card hover — liquid metal distortion ──
  const onCardEnter = useCallback((e: MouseEvent) => {
    const card = (e.currentTarget as HTMLElement).querySelector(
      "[data-card-visual]"
    );
    if (!card) return;
    gsap.to(card, { scale: 1.03, skewY: -1.5, duration: 0.6, ease: "power3.out" });
    const redLayer = (e.currentTarget as HTMLElement).querySelector("[data-rgb='red']");
    const blueLayer = (e.currentTarget as HTMLElement).querySelector("[data-rgb='blue']");
    if (redLayer) gsap.to(redLayer, { x: 4, y: -2, opacity: 0.6, duration: 0.4, ease: "power2.out" });
    if (blueLayer) gsap.to(blueLayer, { x: -4, y: 2, opacity: 0.6, duration: 0.4, ease: "power2.out" });
  }, []);

  const onCardLeave = useCallback((e: MouseEvent) => {
    const card = (e.currentTarget as HTMLElement).querySelector("[data-card-visual]");
    if (!card) return;
    gsap.to(card, { scale: 1, skewY: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    const redLayer = (e.currentTarget as HTMLElement).querySelector("[data-rgb='red']");
    const blueLayer = (e.currentTarget as HTMLElement).querySelector("[data-rgb='blue']");
    if (redLayer) gsap.to(redLayer, { x: 0, y: 0, opacity: 0, duration: 0.5, ease: "power2.out" });
    if (blueLayer) gsap.to(blueLayer, { x: 0, y: 0, opacity: 0, duration: 0.5, ease: "power2.out" });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      // ── Heading entrance ──
      if (headingRef.current) {
        const headingEls = headingRef.current.querySelectorAll("[data-animate]");
        gsap.fromTo(headingEls,
          { clipPath: "inset(0 100% 0 0)", opacity: 0 },
          { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 1.4, stagger: 0.1, ease: "expo.out",
            scrollTrigger: { trigger: headingRef.current, start: "top 80%", toggleActions: "play none none none" }
          }
        );
      }

      // ── Horizontal scroll ──
      const getScrollDistance = () => -(track.scrollWidth - window.innerWidth);
      const horizontalScroll = gsap.to(track, {
        x: getScrollDistance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // ── Progress bar ──
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${track.scrollWidth - window.innerWidth}`,
            scrub: 0.3,
          },
        });
      }

      // ── Card parallax ──
      cardRefs.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card, { opacity: 0.4, scale: 0.92 },
          { opacity: 1, scale: 1, ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: horizontalScroll, start: "left 80%", end: "left 40%", scrub: true }
          }
        );
        gsap.to(card, { opacity: 0.4, scale: 0.92, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: horizontalScroll, start: "right 40%", end: "right 10%", scrub: true }
        });
      });

      // ── Hover listeners ──
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.addEventListener("mouseenter", onCardEnter as EventListener);
        card.addEventListener("mouseleave", onCardLeave as EventListener);
      });
    }, section);

    return () => {
      ctx.revert();
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.removeEventListener("mouseenter", onCardEnter as EventListener);
        card.removeEventListener("mouseleave", onCardLeave as EventListener);
      });
    };
  }, [onCardEnter, onCardLeave]);

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[i] = el;
  };

  return (
    <section ref={sectionRef} className="relative" id="services">
      {/* ── Decorative top rule ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center px-6 md:px-10">
        <div className="h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-v-smoke/30 to-transparent" />
      </div>

      {/* ── Section heading ── */}
      <div ref={headingRef} className="px-6 pb-20 pt-32 md:px-10">
        <div className="mx-auto max-w-[90rem]">
          <span data-animate className="mb-5 block font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.5em] text-v-accent/70 opacity-0">
            004 — The Five Seals
          </span>
          <div className="flex items-center gap-6 md:gap-10">
            <div data-animate className="hidden h-px w-16 bg-gradient-to-r from-v-accent/40 to-transparent opacity-0 md:block" />
            <h2 data-animate className="font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-v-chalk opacity-0">
              What we <span className="italic text-v-accent">architect</span>
            </h2>
            <div data-animate className="hidden h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-v-smoke/20 to-transparent opacity-0 md:block" />
          </div>
          <p data-animate className="mt-5 max-w-lg font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.9] tracking-[0.02em] text-v-silver/70 opacity-0 md:text-xs">
            Five disciplines. One continuous line from intent to launch.
            Each tablet is discrete; together they are the Volari method.
          </p>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 h-px overflow-hidden">
        <div ref={progressRef} className="h-full w-full origin-left bg-gradient-to-r from-v-accent/30 via-v-silver/20 to-transparent" style={{ transform: "scaleX(0)" }} />
      </div>

      {/* ── Horizontal track ── */}
      <div ref={trackRef} className="flex items-stretch gap-6 px-6 pb-24 will-change-transform md:gap-10 md:px-10">
        {SERVICES.map((service, i) => (
          <div key={service.seal} ref={setCardRef(i)} data-cursor-label="Explore"
            className="group relative flex w-[82vw] shrink-0 flex-col rounded-sm md:w-[58vw] lg:w-[48vw]">
            {/* ── Card visual — engraved metal plate ── */}
            <div className="relative overflow-hidden rounded-sm border border-v-smoke/15">
              <div data-card-visual className={`relative aspect-[16/10] w-full bg-gradient-to-br ${service.metal}`} style={{ willChange: "transform" }}>
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 80% at 30% 50%, ${service.bokeh}, transparent 70%)` }} />
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 70% 70%, ${service.bokeh}, transparent 60%)` }} />

                {/* Corner marks — alchemical framing */}
                <div className="pointer-events-none absolute inset-3 md:inset-5">
                  <div className="absolute top-0 left-0 h-4 w-4 border-t border-l border-v-smoke/25" />
                  <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-v-smoke/25" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-v-smoke/25" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-v-smoke/25" />
                </div>

                {/* Large Roman seal */}
                <span className="absolute bottom-5 right-6 font-[family-name:var(--font-playfair)] text-[clamp(4rem,10vw,8rem)] leading-none md:bottom-8 md:right-10"
                  style={{ background: "linear-gradient(135deg, var(--hero-metal-4), var(--hero-metal-6), var(--hero-metal-3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", opacity: 0.15 }}>
                  {service.seal}
                </span>

                {/* Small seal label at top-left */}
                <span className="absolute top-4 left-4 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.4em] text-v-smoke/50 md:top-6 md:left-6">
                  Seal {service.seal}
                </span>

                {/* RGB split layers */}
                <div data-rgb="red" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_40%,rgba(120,30,30,0.15),transparent_60%)] opacity-0 mix-blend-screen" style={{ willChange: "transform, opacity" }} />
                <div data-rgb="blue" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_60%,rgba(30,30,120,0.15),transparent_60%)] opacity-0 mix-blend-screen" style={{ willChange: "transform, opacity" }} />

                {/* Hover overlay */}
                <div data-card-overlay className="pointer-events-none absolute inset-0 flex items-center justify-center bg-v-black/25 opacity-0 backdrop-blur-[2px]">
                  <span className="flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.3em] text-v-chalk">
                    Explore <ArrowUpRight className="h-4 w-4" strokeWidth={1} />
                  </span>
                </div>
              </div>
            </div>

            {/* ── Card metadata ── */}
            <div className="mt-7 flex flex-1 flex-col md:mt-9">
              <div className="mb-5 flex items-center gap-4">
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.3em] text-v-accent/60">{service.seal}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-v-smoke/30 to-transparent" />
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-v-chalk">
                {service.title.split("\n").map((line, li) => (<span key={li}>{li > 0 && <br />}{line}</span>))}
              </h3>
              <p className="mt-5 max-w-md font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.85] text-v-silver/80 md:text-xs">
                {service.doctrine}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-7">
                {service.notations.map((tag) => (
                  <span key={tag} className="rounded-full border border-v-smoke/25 px-3 py-1 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.2em] text-v-silver/60 transition-all duration-300 group-hover:border-v-accent/20 group-hover:text-v-silver/80">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="w-[15vw] shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}
