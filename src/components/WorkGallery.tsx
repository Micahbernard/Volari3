"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// WorkGallery ✦ Cinematic Project Showcase
//
// Full-viewport project cards with parallax scroll, 3D tilt
// on hover, and liquid displacement effects. Each card uses
// CSS perspective transforms for depth without requiring
// a separate Three.js canvas — keeping it lightweight and
// fully integrated with the existing page scroll.
// ─────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: "01",
    title: "Aether Dynamics",
    category: "Brand Identity / Web Platform",
    year: "2025",
    gradient: "from-[#0c0c18] via-[#1a1a2e] to-[#12121e]",
    accent: "rgba(180,190,220,0.06)",
  },
  {
    id: "02",
    title: "Meridian Capital",
    category: "Fintech / Digital Strategy",
    year: "2025",
    gradient: "from-[#0e0e12] via-[#181824] to-[#0c0c14]",
    accent: "rgba(212,168,83,0.05)",
  },
  {
    id: "03",
    title: "Obsidian Protocol",
    category: "Creative Technology / WebGL",
    year: "2024",
    gradient: "from-[#0a0a10] via-[#161622] to-[#0a0a12]",
    accent: "rgba(200,200,212,0.06)",
  },
  {
    id: "04",
    title: "Solstice Studio",
    category: "E-Commerce / UI Design",
    year: "2024",
    gradient: "from-[#101018] via-[#1c1c28] to-[#12121c]",
    accent: "rgba(180,180,200,0.05)",
  },
] as const;

export default function WorkGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  // ── 3D tilt on hover ──
  const onCardMove = useCallback((e: MouseEvent) => {
    const card = (e.currentTarget as HTMLElement).querySelector("[data-card-face]");
    if (!card) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(card, {
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.4,
      ease: "power2.out",
    });

    // Specular shift
    const spec = (e.currentTarget as HTMLElement).querySelector("[data-card-spec]");
    if (spec) {
      (spec as HTMLElement).style.backgroundPosition = `${50 + x * 30}% ${50 + y * 30}%`;
    }
  }, []);

  const onCardLeave = useCallback((e: MouseEvent) => {
    const card = (e.currentTarget as HTMLElement).querySelector("[data-card-face]");
    if (!card) return;
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.4)",
    });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      // ── Heading entrance ──
      if (headingRef.current) {
        const els = headingRef.current.querySelectorAll("[data-reveal]");
        gsap.fromTo(
          els,
          { clipPath: "inset(0 100% 0 0)", opacity: 0 },
          {
            clipPath: "inset(0 0% 0 0)",
            opacity: 1,
            duration: 1.4,
            stagger: 0.1,
            ease: "expo.out",
            scrollTrigger: {
              trigger: headingRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
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
        gsap.fromTo(
          card,
          { opacity: 0.35, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontalScroll,
              start: "left 85%",
              end: "left 45%",
              scrub: true,
            },
          }
        );
        gsap.to(card, {
          opacity: 0.35,
          scale: 0.9,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            containerAnimation: horizontalScroll,
            start: "right 45%",
            end: "right 10%",
            scrub: true,
          },
        });
      });

      // ── Hover listeners ──
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.addEventListener("mousemove", onCardMove as EventListener);
        card.addEventListener("mouseleave", onCardLeave as EventListener);
      });
    }, section);

    return () => {
      ctx.revert();
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.removeEventListener("mousemove", onCardMove as EventListener);
        card.removeEventListener("mouseleave", onCardLeave as EventListener);
      });
    };
  }, [onCardMove, onCardLeave]);

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[i] = el;
  };

  return (
    <section ref={sectionRef} id="work" className="relative scroll-mt-20">
      {/* Top rule */}
      <div className="flex justify-center px-6 md:px-10">
        <div className="h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-v-smoke/30 to-transparent" />
      </div>

      {/* Heading */}
      <div ref={headingRef} className="px-6 pb-20 pt-32 md:px-10">
        <div className="mx-auto max-w-[90rem]">
          <span
            data-reveal
            className="mb-5 block font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.5em] text-v-accent/70"
            style={{ opacity: 0 }}
          >
            002 — Selected Work
          </span>
          <div className="flex items-center gap-6 md:gap-10">
            <div
              data-reveal
              className="hidden h-px w-16 bg-gradient-to-r from-v-accent/40 to-transparent md:block"
              style={{ opacity: 0 }}
            />
            <h2
              data-reveal
              className="font-[family-name:var(--font-playfair)] text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-v-chalk"
              style={{ opacity: 0 }}
            >
              The <span className="italic text-v-accent">work</span>
            </h2>
            <div
              data-reveal
              className="hidden h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-v-smoke/20 to-transparent md:block"
              style={{ opacity: 0 }}
            />
          </div>
          <p
            data-reveal
            className="mt-5 max-w-lg font-[family-name:var(--font-geist-mono)] text-[11px] leading-[1.9] tracking-[0.02em] text-v-silver/70 md:text-xs"
            style={{ opacity: 0 }}
          >
            Four recent projects. Each built with the same obsessive
            attention to craft that defines every Volari engagement.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-px overflow-hidden">
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-gradient-to-r from-v-accent/30 via-v-silver/20 to-transparent"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Horizontal track */}
      <div
        ref={trackRef}
        className="flex items-stretch gap-8 px-6 pb-24 will-change-transform md:gap-12 md:px-10"
      >
        {PROJECTS.map((project, i) => (
          <div
            key={project.id}
            ref={setCardRef(i)}
            className="group relative flex w-[85vw] shrink-0 cursor-pointer flex-col md:w-[60vw] lg:w-[50vw]"
            style={{ perspective: "1200px" }}
          >
            {/* Card face with 3D tilt */}
            <div
              data-card-face
              className="relative overflow-hidden rounded-sm border border-v-smoke/12"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <div
                className={`relative aspect-[16/10] w-full bg-gradient-to-br ${project.gradient}`}
              >
                {/* Specular highlight layer */}
                <div
                  data-card-spec
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(ellipse 120% 100% at 30% 30%, rgba(255,255,255,0.06), transparent 60%)",
                  }}
                />

                {/* Subtle accent glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 60% 70%, ${project.accent}, transparent 50%)`,
                  }}
                />

                {/* Corner frames */}
                <div className="pointer-events-none absolute inset-4 md:inset-6">
                  <div className="absolute top-0 left-0 h-5 w-5 border-t border-l border-v-smoke/20" />
                  <div className="absolute top-0 right-0 h-5 w-5 border-t border-r border-v-smoke/20" />
                  <div className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-v-smoke/20" />
                  <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-v-smoke/20" />
                </div>

                {/* Large project number */}
                <span
                  className="absolute bottom-4 right-5 font-[family-name:var(--font-playfair)] text-[clamp(4rem,10vw,8rem)] leading-none md:bottom-6 md:right-8"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--hero-metal-4), var(--hero-metal-6), var(--hero-metal-3))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    opacity: 0.12,
                  }}
                >
                  {project.id}
                </span>

                {/* Hover overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-v-black/20 opacity-0 backdrop-blur-[1px] transition-opacity duration-500 group-hover:opacity-100">
                  <span className="flex items-center gap-2 font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.3em] text-v-chalk">
                    View Case Study
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1} />
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 flex items-start justify-between md:mt-8">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.3em] text-v-accent/60">
                    {project.id}
                  </span>
                  <div className="h-px w-8 bg-gradient-to-r from-v-smoke/25 to-transparent" />
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-[clamp(1.4rem,2.8vw,2.2rem)] leading-[1.1] tracking-[-0.02em] text-v-chalk">
                  {project.title}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.15em] text-v-silver/60">
                  {project.category}
                </p>
              </div>
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.2em] text-v-smoke/40">
                {project.year}
              </span>
            </div>
          </div>
        ))}

        {/* End spacer */}
        <div className="w-[15vw] shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}
