"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// Project data — each card in the horizontal portfolio rail
// ─────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  tags: string[];
  gradient: string;
  accentHex: string;
}

const PROJECTS: Project[] = [
  {
    id: "01",
    title: "Maison Lumière",
    category: "Luxury E-Commerce",
    year: "2024",
    tags: ["Next.js", "WebGL", "Shopify"],
    gradient: "from-[#1a1410] via-[#2a1f0e] to-[#0d0b08]",
    accentHex: "#d4a853",
  },
  {
    id: "02",
    title: "Axiom Protocol",
    category: "DeFi Platform",
    year: "2024",
    tags: ["React", "GSAP", "Motion Design"],
    gradient: "from-[#0e1218] via-[#111a22] to-[#080c10]",
    accentHex: "#4a7fa5",
  },
  {
    id: "03",
    title: "Solstice",
    category: "Fashion Editorial",
    year: "2023",
    tags: ["Three.js", "R3F", "Editorial"],
    gradient: "from-[#180e18] via-[#221222] to-[#0e080e]",
    accentHex: "#a06090",
  },
  {
    id: "04",
    title: "Helix Bio",
    category: "Biotech Identity",
    year: "2023",
    tags: ["Brand", "Motion", "3D"],
    gradient: "from-[#0e1810] via-[#121f14] to-[#080e09]",
    accentHex: "#5a9e6a",
  },
  {
    id: "05",
    title: "Raven & Co",
    category: "Creative Studio",
    year: "2024",
    tags: ["Identity", "WebGL", "Interaction"],
    gradient: "from-[#181210] via-[#221a14] to-[#0e0908]",
    accentHex: "#c47a4a",
  },
];

// ─────────────────────────────────────────────────────────────
// WorkShowcase
//
// Horizontal scroll portfolio with SVG feTurbulence distortion
// on hover. Architecture mirrors ServicesShowcase exactly:
// refs over state, GSAP for all motion, zero re-renders.
//
// Desktop: sticky container + ScrollTrigger scrub translateX
// Mobile: overflow-x auto with scroll-snap fallback
// ─────────────────────────────────────────────────────────────
export default function WorkShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headingRuleRef = useRef<HTMLDivElement>(null);
  const headingLabelRef = useRef<HTMLSpanElement>(null);
  const headingNumRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const turbulenceRefs = useRef<(SVGFETurbulenceElement | null)[]>([]);
  const displacementRefs = useRef<(SVGFEDisplacementMapElement | null)[]>([]);
  const isMobileRef = useRef(false);

  // ── Hover: SVG distortion + scale ──
  const onCardEnter = useCallback(
    (index: number) => () => {
      const turb = turbulenceRefs.current[index];
      const disp = displacementRefs.current[index];
      const card = cardRefs.current[index];
      if (!card) return;

      const visual = card.querySelector("[data-card-visual]");

      if (turb) {
        gsap.to(turb, {
          attr: { baseFrequency: "0.065 0.065" },
          duration: 0.4,
          ease: "power2.out",
        });
      }
      if (disp) {
        gsap.to(disp, {
          attr: { scale: 28 },
          duration: 0.4,
          ease: "power2.out",
        });
      }
      if (visual) {
        gsap.to(visual, {
          scale: 1.04,
          duration: 0.7,
          ease: "power3.out",
        });
      }
    },
    []
  );

  const onCardLeave = useCallback(
    (index: number) => () => {
      const turb = turbulenceRefs.current[index];
      const disp = displacementRefs.current[index];
      const card = cardRefs.current[index];
      if (!card) return;

      const visual = card.querySelector("[data-card-visual]");

      if (turb) {
        gsap.to(turb, {
          attr: { baseFrequency: "0.000 0.000" },
          duration: 0.6,
          ease: "power3.out",
        });
      }
      if (disp) {
        gsap.to(disp, {
          attr: { scale: 0 },
          duration: 0.6,
          ease: "power3.out",
        });
      }
      if (visual) {
        gsap.to(visual, {
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
        });
      }
    },
    []
  );

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!section || !track || !sticky) return;

    // Detect mobile — fallback to native scroll-snap
    const mq = window.matchMedia("(max-width: 768px)");
    isMobileRef.current = mq.matches;

    // Attach card hover listeners (per-index callbacks)
    const enterHandlers: (() => void)[] = [];
    const leaveHandlers: (() => void)[] = [];
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const enter = onCardEnter(i);
      const leave = onCardLeave(i);
      enterHandlers[i] = enter;
      leaveHandlers[i] = leave;
      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
    });

    // Mobile: no GSAP pin, rely on CSS scroll-snap
    if (isMobileRef.current) {
      // Simple entrance animation only
      const validCards = cardRefs.current.filter(Boolean);
      if (validCards.length) {
        gsap.fromTo(
          validCards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 60%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      return () => {
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          if (enterHandlers[i]) card.removeEventListener("mouseenter", enterHandlers[i]);
          if (leaveHandlers[i]) card.removeEventListener("mouseleave", leaveHandlers[i]);
        });
      };
    }

    // Desktop: full GSAP horizontal scroll
    const ctx = gsap.context(() => {
      // ── Heading entrance ──
      if (headingRuleRef.current) {
        gsap.fromTo(
          headingRuleRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      const labels = [headingLabelRef.current, headingNumRef.current].filter(
        Boolean
      );
      if (labels.length) {
        gsap.fromTo(
          labels,
          { clipPath: "inset(0 100% 0 0)", opacity: 0 },
          {
            clipPath: "inset(0 0% 0 0)",
            opacity: 1,
            duration: 1.0,
            stagger: 0.08,
            ease: "expo.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // ── Calculate scroll distance via ResizeObserver ──
      let scrollDistance = track.scrollWidth - window.innerWidth;

      const ro = new ResizeObserver(() => {
        scrollDistance = track.scrollWidth - window.innerWidth;
        ScrollTrigger.refresh();
      });
      ro.observe(track);

      // ── Horizontal scroll — scrub maps vertical scroll to translateX ──
      gsap.to(track, {
        x: () => -scrollDistance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${scrollDistance}`,
          pin: sticky,
          scrub: 1,
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
            end: () => `+=${scrollDistance}`,
            scrub: 0.3,
          },
        });
      }

      // ── Card entrance stagger ──
      const validCards = cardRefs.current.filter(Boolean);
      if (validCards.length) {
        gsap.fromTo(
          validCards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 60%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Cleanup ResizeObserver on context revert
      return () => ro.disconnect();
    }, section);

    return () => {
      ctx.revert();
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        if (enterHandlers[i]) card.removeEventListener("mouseenter", enterHandlers[i]);
        if (leaveHandlers[i]) card.removeEventListener("mouseleave", leaveHandlers[i]);
      });
    };
  }, [onCardEnter, onCardLeave]);

  // ── Ref setters ──
  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[i] = el;
  };
  const setTurbRef = (i: number) => (el: SVGFETurbulenceElement | null) => {
    turbulenceRefs.current[i] = el;
  };
  const setDispRef = (i: number) => (el: SVGFEDisplacementMapElement | null) => {
    displacementRefs.current[i] = el;
  };

  return (
    <section
      ref={sectionRef}
      id="work"
      className="relative"
      style={{
        // Outer section tall enough for scroll distance on desktop.
        // Mobile uses auto height with native overflow scroll.
        height: `calc(100vh + ${PROJECTS.length} * 100vw)`,
      }}
    >
      {/* ── Sticky inner container — viewport-locked on desktop ── */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen overflow-hidden md:overflow-visible"
      >
        {/* ── Heading — pinned top-left ── */}
        <div className="absolute top-8 left-6 z-10 md:top-12 md:left-10">
          <div
            ref={headingRuleRef}
            className="mb-4 h-px w-[120px] bg-v-smoke/50"
            style={{ transform: "scaleX(0)" }}
          />
          <span
            ref={headingLabelRef}
            className="block font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.5em] text-v-silver opacity-0"
          >
            Selected Work
          </span>
          <span
            ref={headingNumRef}
            className="mt-1 block font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.4em] text-v-smoke opacity-0"
          >
            004 &mdash; Portfolio
          </span>
        </div>

        {/* ── Progress bar — bottom of sticky frame ── */}
        <div className="absolute bottom-12 left-6 right-6 z-10 h-px overflow-hidden md:left-10 md:right-10">
          <div
            ref={progressRef}
            className="h-full w-full origin-left bg-gradient-to-r from-v-smoke via-v-silver/20 to-transparent"
            style={{ transform: "scaleX(0)" }}
          />
        </div>

        {/* ── Horizontal card track ── */}
        <div
          ref={trackRef}
          className="flex h-full items-center gap-16 px-6 will-change-transform md:px-10 max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:scroll-smooth"
        >
          {/* Left spacer — push first card past heading */}
          <div className="w-[8vw] shrink-0 max-md:hidden" aria-hidden="true" />

          {PROJECTS.map((project, i) => (
            <div
              key={project.id}
              ref={setCardRef(i)}
              data-cursor-label="View"
              className="relative flex h-[70vh] w-[clamp(320px,60vw,680px)] shrink-0 flex-col overflow-hidden rounded-sm opacity-0 ring-1 ring-transparent transition-[box-shadow,ring-color] duration-500 max-md:w-[90vw] max-md:snap-center hover:shadow-[0_0_48px_-14px_var(--card-hover-glow)] hover:ring-v-smoke/25"
            >
              {/* ════════════════════════════════════════
                  VISUAL AREA — top 65%
                  SVG feTurbulence distortion on hover
                  ════════════════════════════════════════ */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  height: "65%",
                  filter: `url(#distort-${project.id})`,
                }}
              >
                {/* SVG distortion filter — unique per card */}
                <svg
                  width="0"
                  height="0"
                  style={{ position: "absolute" }}
                  aria-hidden="true"
                >
                  <defs>
                    <filter
                      id={`distort-${project.id}`}
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feTurbulence
                        ref={setTurbRef(i)}
                        type="turbulence"
                        baseFrequency="0.000 0.000"
                        numOctaves={3}
                        seed={parseInt(project.id)}
                        result="noise"
                      />
                      <feDisplacementMap
                        ref={setDispRef(i)}
                        in="SourceGraphic"
                        in2="noise"
                        scale={0}
                        xChannelSelector="R"
                        yChannelSelector="G"
                      />
                    </filter>
                  </defs>
                </svg>

                {/* Inner visual — 110% size for parallax headroom */}
                <div
                  data-card-visual
                  className={`absolute inset-[-5%] bg-gradient-to-br ${project.gradient}`}
                  style={{ willChange: "transform" }}
                >
                  {/* Edge vignette */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_30%,var(--card-inner-vignette)_100%)]" />

                  {/* Accent glow — faint radial from project color */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(ellipse at 50% 50%, ${project.accentHex}0D, transparent 70%)`,
                    }}
                  />

                  {/* Number watermark */}
                  <span className="absolute bottom-4 right-6 font-[family-name:var(--font-playfair)] text-[clamp(5rem,12vw,10rem)] leading-none text-white/[0.03]">
                    {project.id}
                  </span>
                </div>
              </div>

              {/* ════════════════════════════════════════
                  INFO AREA — bottom 35%
                  ════════════════════════════════════════ */}
              <div
                className="flex flex-1 flex-col p-6"
                style={{
                  backgroundColor: "var(--v-charcoal)",
                  borderTop: "1px solid var(--card-panel-border)",
                }}
              >
                {/* ID + Year row */}
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.3em] text-v-silver">
                    {project.id}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.3em] text-v-silver">
                    {project.year}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(1.4rem,2.5vw,2rem)] leading-[1.15] tracking-[-0.02em] text-v-chalk">
                  {project.title}
                </h3>

                {/* Category */}
                <span className="mt-1 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-v-silver">
                  {project.category}
                </span>

                {/* Tags */}
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-white/10 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-[0.3em] text-v-silver"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow icon */}
                <ArrowUpRight
                  className="absolute bottom-5 right-5 text-v-accent"
                  size={20}
                  strokeWidth={1}
                />
              </div>
            </div>
          ))}

          {/* Right spacer — ensures last card can scroll to center */}
          <div className="w-[30vw] shrink-0 max-md:hidden" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
